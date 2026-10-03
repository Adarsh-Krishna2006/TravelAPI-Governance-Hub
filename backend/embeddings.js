// Contextual Semantic Vector Embedding Engine
// In-process pretrained sentence embedding model (all-MiniLM-L6-v2 via @xenova/transformers)
// with deterministic semantic anchor and character-trigram hashing fallback encoder.

const FALLBACK_DIM = 64;
const PRETRAINED_DIM = 384;
const embeddingCache = new Map();

let pretrainedPipeline = null;
let pretrainedLoadingPromise = null;
let pretrainedAvailable = false;

// Domain semantic anchor points (orthogonal bases for travel API concepts)
const SEMANTIC_ANCHORS = {
  monetary_amount: ['price', 'cost', 'fee', 'amount', 'fare', 'total', 'charge', 'sum', 'val', 'payment', 'rate', 'tariff'],
  customer_identifier: ['guest', 'customer', 'client', 'user', 'passenger', 'payer', 'account', 'person', 'traveler'],
  booking_identifier: ['reservation', 'booking', 'order', 'pnr', 'voucher', 'confirmation', 'ticket', 'itinerary', 'reference'],
  property_identifier: ['hotel', 'property', 'room', 'lodging', 'stay', 'accommodation', 'resort'],
  flight_identifier: ['flight', 'aircraft', 'plane', 'airline', 'carrier', 'flightnumber', 'aviation'],
  check_in_date: ['checkin', 'arrival', 'startdate', 'fromdate', 'checkindate', 'arrivaldate'],
  check_out_date: ['checkout', 'departure', 'enddate', 'todate', 'checkoutdate', 'departuredate'],
  currency_code: ['currency', 'iso', 'curr', 'symbol', 'unit', 'currencycode'],
  transaction_status: ['status', 'state', 'stage', 'condition', 'phase', 'lifecycle'],
  airport_code: ['airport', 'iata', 'station', 'origin', 'destination', 'terminal'],
  temporal_timestamp: ['timestamp', 'created', 'updated', 'datetime', 'schedule', 'date']
};

const ANCHOR_KEYS = Object.keys(SEMANTIC_ANCHORS);

/**
 * Normalizes field names and descriptions into clean token sequences.
 */
export function normalizeFieldTokens(name, description = '') {
  const cleanName = (name || '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .toLowerCase()
    .trim();

  // Strip common boilerplate from descriptions
  const cleanDesc = (description || '')
    .replace(/(unique identifier|the unique|reference code|system identifier|parameter for|specifies the|indicates the)/gi, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .toLowerCase()
    .trim();

  const tokens = `${cleanName} ${cleanDesc}`
    .split(/\s+/)
    .filter(t => t.length > 1);

  return { cleanName, cleanDesc, tokens };
}

/**
 * Computes a hash index for character n-grams to capture morphological patterns.
 */
function hashNgram(ngram, maxBuckets) {
  let hash = 2166136261;
  for (let i = 0; i < ngram.length; i++) {
    hash ^= ngram.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % maxBuckets;
}

/**
 * Generates a deterministic 64-dimensional semantic-anchor + subword vector.
 * Used as reliable in-process fallback whenever the pretrained transformer is unavailable.
 */
function generateDeterministicFallbackEmbedding(name, description = '', semanticConcept = '') {
  const vec = new Float32Array(FALLBACK_DIM);
  const { tokens, cleanName } = normalizeFieldTokens(name, description);

  if (semanticConcept) {
    const conceptTokens = semanticConcept.toLowerCase().split(/[^a-z0-9]/).filter(Boolean);
    tokens.push(...conceptTokens);
  }

  if (tokens.length === 0 && !semanticConcept) {
    return vec;
  }

  // 1. Semantic Anchor Projections (first 32 dimensions)
  for (let aIdx = 0; aIdx < ANCHOR_KEYS.length; aIdx++) {
    const concept = ANCHOR_KEYS[aIdx];
    const keywords = SEMANTIC_ANCHORS[concept];
    let matchWeight = 0;

    if (semanticConcept && (semanticConcept === concept || concept.includes(semanticConcept) || semanticConcept.includes(concept))) {
      matchWeight += 4.0;
    }

    for (const token of tokens) {
      if (keywords.includes(token)) {
        matchWeight += 2.0;
      } else {
        for (const kw of keywords) {
          if (token.startsWith(kw) || kw.startsWith(token)) {
            matchWeight += 1.0;
            break;
          }
        }
      }
    }

    if (matchWeight > 0) {
      const dimOffset = (aIdx * 2) % 32;
      vec[dimOffset] += matchWeight * 0.8;
      vec[dimOffset + 1] += Math.sin(matchWeight * 1.5);
    }
  }

  // 2. Character Tri-gram Morphological Hashing (dimensions 32 to 63)
  const subwordOffset = 32;
  const subwordDims = FALLBACK_DIM - subwordOffset;

  for (const token of tokens) {
    const padded = `^${token}$`;
    for (let i = 0; i < padded.length - 2; i++) {
      const trigram = padded.slice(i, i + 3);
      const bucket = hashNgram(trigram, subwordDims);
      vec[subwordOffset + bucket] += 1.0;
    }
  }

  // 3. Name-weight amplification
  const nameTokens = cleanName.split(/\s+/).filter(Boolean);
  for (const nTok of nameTokens) {
    const bucket = hashNgram(nTok, subwordDims);
    vec[subwordOffset + bucket] += 1.5;
  }

  // 4. L2 Normalization (unit length)
  let norm = 0;
  for (let i = 0; i < FALLBACK_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < FALLBACK_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * Initializes the @xenova/transformers pipeline in-process using Xenova/all-MiniLM-L6-v2.
 */
export async function initPretrainedPipeline() {
  if (pretrainedAvailable && pretrainedPipeline) return pretrainedPipeline;
  if (pretrainedLoadingPromise) return pretrainedLoadingPromise;

  pretrainedLoadingPromise = (async () => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      if (env) {
        env.allowRemoteModels = true;
      }
      pretrainedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      pretrainedAvailable = true;
      return pretrainedPipeline;
    } catch (err) {
      console.warn('[Embeddings] Pretrained model initialization deferred; falling back to deterministic anchor encoder:', err.message);
      pretrainedAvailable = false;
      return null;
    }
  })();

  return pretrainedLoadingPromise;
}

/**
 * Indicates whether the pretrained MiniLM model has been successfully loaded into memory.
 */
export function isPretrainedModelLoaded() {
  return pretrainedAvailable && pretrainedPipeline !== null;
}

/**
 * Pre-warms the in-memory embedding cache with pretrained vectors for catalog schema fields.
 */
export async function prewarmEmbeddingCache(fields = []) {
  if (!fields || fields.length === 0) return;
  const pipe = await initPretrainedPipeline();
  if (!pipe) return;

  for (const field of fields) {
    const name = field.name || '';
    const desc = field.description || '';
    const concept = field.semanticConcept || '';
    const cacheKey = `${name}::${desc}::${concept}`;
    if (!embeddingCache.has(cacheKey)) {
      try {
        const text = [name, concept, desc].filter(Boolean).join(': ');
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        embeddingCache.set(cacheKey, new Float32Array(output.data));
      } catch {
        embeddingCache.set(cacheKey, generateDeterministicFallbackEmbedding(name, desc, concept));
      }
    }
  }
}

/**
 * Encodes text into a normalized dense vector (Float32Array).
 * Synchronous lookup from cache with deterministic fallback.
 */
export function generateEmbedding(name = '', description = '', semanticConcept = '') {
  const cacheKey = `${name || ''}::${description || ''}::${semanticConcept || ''}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  // Synchronous generation via deterministic anchor encoder
  const vec = generateDeterministicFallbackEmbedding(name, description, semanticConcept);
  embeddingCache.set(cacheKey, vec);
  return vec;
}

/**
 * Asynchronously generates an embedding, utilizing pretrained all-MiniLM-L6-v2 if loaded.
 */
export async function generateEmbeddingAsync(name = '', description = '', semanticConcept = '') {
  const cacheKey = `${name || ''}::${description || ''}::${semanticConcept || ''}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    const pipe = await initPretrainedPipeline();
    if (pipe) {
      const text = [name, semanticConcept, description].filter(Boolean).join(': ');
      if (!text.trim()) {
        const emptyVec = new Float32Array(PRETRAINED_DIM);
        embeddingCache.set(cacheKey, emptyVec);
        return emptyVec;
      }
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      const vec = new Float32Array(output.data);
      embeddingCache.set(cacheKey, vec);
      return vec;
    }
  } catch (err) {
    console.warn('[Embeddings] generateEmbeddingAsync fallback:', err.message);
  }

  return generateEmbedding(name, description, semanticConcept);
}

/**
 * Computes Cosine Similarity between two Float32Array embedding vectors.
 * Returns value between 0.0 and 1.0.
 */
export function computeCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0.0;

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  return Math.max(0.0, Math.min(1.0, Math.round(dotProduct * 1000) / 1000));
}

/**
 * Calculates Contextual Embedding Similarity between two field schema objects.
 */
export function calculateContextualFieldSimilarity(fieldA, fieldB) {
  try {
    if (!fieldA || !fieldB || (!fieldA.name && !fieldB.name)) return 0.0;
    const vecA = generateEmbedding(fieldA?.name || '', fieldA?.description || '', fieldA?.semanticConcept || '');
    const vecB = generateEmbedding(fieldB?.name || '', fieldB?.description || '', fieldB?.semanticConcept || '');
    return computeCosineSimilarity(vecA, vecB);
  } catch (err) {
    console.warn('Embedding computation fallback encountered:', err.message);
    return 0.0;
  }
}

/**
 * Returns cache size and diagnostic statistics.
 */
export function getEmbeddingCacheStats() {
  const sampleVector = embeddingCache.values().next().value;
  const currentDim = sampleVector ? sampleVector.length : (pretrainedAvailable ? PRETRAINED_DIM : FALLBACK_DIM);

  return {
    cachedVectorsCount: embeddingCache.size,
    dimensions: currentDim,
    engine: pretrainedAvailable ? 'all-MiniLM-L6-v2 (ONNX in-process)' : 'ContextualDenseVectorEngine (Deterministic Fallback)',
    pretrainedLoaded: pretrainedAvailable
  };
}

/**
 * Clears the in-memory embedding cache.
 */
export function clearEmbeddingCache() {
  embeddingCache.clear();
}

export const cosineSimilarity = computeCosineSimilarity;

export function generateFieldEmbedding(field) {
  return generateEmbedding(field?.name || '', field?.description || '', field?.semanticConcept || '');
}
