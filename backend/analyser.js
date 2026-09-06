// TravelAPI Governance Hub - Dual Duplication Analysis Engine

const SYNONYMS = {
  customer: ['guest', 'guests', 'client', 'clients', 'user', 'users', 'passenger', 'passengers', 'payer', 'payers', 'account', 'accounts', 'customer', 'customers'],
  id: ['identifier', 'identifiers', 'code', 'codes', 'key', 'keys', 'ref', 'reference', 'num', 'number', 'id', 'pnr'],
  booking: ['reservation', 'reservations', 'order', 'orders', 'stay', 'stays', 'itinerary', 'itineraries', 'booking', 'bookings', 'reserve', 'mgmt', 'management'],
  date: ['time', 'timestamp', 'created', 'scheduled', 'date', 'dates', 'calendar', 'checkin', 'checkout', 'arrival', 'departure'],
  amount: ['price', 'prices', 'cost', 'costs', 'total', 'totals', 'value', 'payment', 'charge', 'amount', 'fee', 'val', 'sum', 'fare', 'fares'],
  currency: ['curr', 'symbol', 'unit', 'currency', 'iso', 'code'],
  status: ['state', 'stage', 'condition', 'phase', 'status', 'label'],
  transaction: ['tx', 'txn', 'payment', 'payments', 'charge', 'charges', 'transaction', 'transactions', 'transact'],
  card: ['cc', 'number', 'hash', 'obfuscated', 'card', 'cards'],
  flight: ['air', 'plane', 'route', 'routes', 'trip', 'trips', 'flight', 'flights', 'aviation'],
  hotel: ['property', 'properties', 'room', 'rooms', 'stay', 'stays', 'lodging', 'hotel', 'hotels']
};

export const CONCEPT_MAP = {
  bookingId: 'booking_identifier',
  reservation_id: 'booking_identifier',
  booking_ref: 'booking_identifier',
  res_mgmt_key: 'booking_identifier',
  order_reference: 'booking_identifier',
  pnrCode: 'booking_identifier',
  confirmationCode: 'booking_identifier',
  confirmation_id: 'booking_identifier',
  
  customerId: 'customer_identifier',
  guest_id: 'customer_identifier',
  client_id: 'customer_identifier',
  client_code: 'customer_identifier',
  payer_id: 'customer_identifier',
  passengerId: 'customer_identifier',
  customer_id: 'customer_identifier',
  user_account_id: 'customer_identifier',
  
  hotelId: 'property_identifier',
  property_id: 'property_identifier',
  hotel_code: 'property_identifier',
  
  bookingDate: 'creation_date',
  reservation_date: 'creation_date',
  transaction_date: 'creation_date',
  paymentDate: 'creation_date',
  tx_date: 'creation_date',
  
  checkInDate: 'check_in_date',
  check_in: 'check_in_date',
  arrival_date: 'check_in_date',
  
  checkOutDate: 'check_out_date',
  check_out: 'check_out_date',
  departure_date: 'check_out_date',
  
  totalAmount: 'monetary_amount',
  amount: 'monetary_amount',
  total_amount: 'monetary_amount',
  total_cost: 'monetary_amount',
  charge_total: 'monetary_amount',
  charge_sum: 'monetary_amount',
  order_total: 'monetary_amount',
  ticketPrice: 'monetary_amount',
  fareAmount: 'monetary_amount',
  
  currency: 'currency_code',
  currency_code: 'currency_code',
  currencyCode: 'currency_code',
  currency_iso: 'currency_code',
  
  paymentId: 'transaction_identifier',
  transaction_id: 'transaction_identifier',
  tx_id: 'transaction_identifier',
  tx_reference_id: 'transaction_identifier',
  
  status: 'transaction_status',
  payment_status: 'transaction_status',
  status_label: 'transaction_status',
  order_status: 'transaction_status',
  state: 'transaction_status'
};

const KNOWN_ORGS = ['stayeasy', 'globalhotels', 'flyfast', 'paylink', 'securepay', 'ts', 'travelsphere'];

function getSynonymGroup(token) {
  let normalized = token.toLowerCase();
  for (const [key, group] of Object.entries(SYNONYMS)) {
    if (group.includes(normalized)) {
      return key;
    }
  }
  // Try singularization for plurals
  if (normalized.endsWith('s') && normalized.length > 3) {
    const singular = normalized.slice(0, -1);
    for (const [key, group] of Object.entries(SYNONYMS)) {
      if (group.includes(singular)) {
        return key;
      }
    }
  }
  return normalized;
}

function tokenizeFieldName(fieldName) {
  if (!fieldName) return [];
  let parts = fieldName.replace(/([a-z])([A-Z])/g, '$1_$2').split(/[^a-zA-Z0-9]/);
  return parts
    .map(p => p.toLowerCase())
    .filter(p => p.length > 0)
    .map(p => getSynonymGroup(p));
}

function classifyRelationship(fAName, fBName, conceptA, conceptB) {
  if (fAName === fBName) return 'Exact Equivalent';
  if (conceptA && conceptB && conceptA === conceptB) return 'Strong Equivalent';
  
  const tokensA = tokenizeFieldName(fAName);
  const tokensB = tokenizeFieldName(fBName);
  
  let matches = 0;
  for (const tA of tokensA) {
    if (tokensB.includes(tA)) matches++;
  }
  const jaccard = matches / Math.max(1, tokensA.length + tokensB.length - matches);
  
  if (jaccard >= 0.5) return 'Contextual Equivalent';
  if (jaccard > 0) return 'Related';
  return 'Different';
}

function normalizeRoute(route) {
  if (!route) return '';
  return route.toLowerCase()
    .replace(/^\/gateway/, '')
    .replace(/^\/api\/v\d+/, '')
    .replace(/^\/flyfast\/v\d+/, '')
    .replace(/^\/globalhotels\/v\d+/, '')
    .replace(/^\/paylink\/v\d+/, '')
    .replace(/\/:\w+/g, '')
    .replace(/\/\{\w+\}/g, '')
    .replace(/^[\/\-_]+|[\/\-_]+$/g, '');
}

function getRouteTokens(norm) {
  return norm
    .split(/[^a-zA-Z0-9]+/)
    .filter(s => s.length > 0)
    .filter(s => !KNOWN_ORGS.includes(s))
    .map(s => getSynonymGroup(s));
}

function getRouteSimilarity(routeA, routeB, catA = '', catB = '') {
  const normA = normalizeRoute(routeA);
  const normB = normalizeRoute(routeB);

  const segsA = getRouteTokens(normA);
  const segsB = getRouteTokens(normB);

  if (segsA.length === 0 || segsB.length === 0) return 0;

  // Domain conflict check: Flight vs Hotel vertical in routes
  const hasFlightA = segsA.includes('flight') || (catA && catA.includes('Flight'));
  const hasFlightB = segsB.includes('flight') || (catB && catB.includes('Flight'));
  const hasHotelA = segsA.includes('hotel') || (catA && catA.includes('Hotel'));
  const hasHotelB = segsB.includes('hotel') || (catB && catB.includes('Hotel'));

  if ((hasFlightA && hasHotelB) || (hasHotelA && hasFlightB)) {
    return 0; // Distinct travel verticals never share route similarity
  }

  let matches = 0;
  for (const sA of segsA) {
    if (segsB.includes(sA)) matches++;
  }

  return matches / Math.max(1, segsA.length + segsB.length - matches);
}

function extractMethod(api) {
  return api.method || (api.endpoints && api.endpoints[0] && api.endpoints[0].httpMethod) || (api.primaryEndpoint && api.primaryEndpoint.httpMethod) || 'POST';
}

function extractRoute(api) {
  return api.gatewayBaseUrl || api.gatewayRoute || (api.endpoints && api.endpoints[0] && api.endpoints[0].path) || '';
}

// --- BASELINE ANALYSIS ENGINE (No Semantics) ---
export function analyzeBaselinePair(apiA, apiB) {
  const routeScore = getRouteSimilarity(extractRoute(apiA), extractRoute(apiB), apiA.category, apiB.category);
  const methodScore = extractMethod(apiA) === extractMethod(apiB) ? 1.0 : 0.0;

  // Exact Field Matching only
  const fieldsA = (apiA.inputFields || []).map(f => f.name);
  const fieldsB = (apiB.inputFields || []).map(f => f.name);

  let exactMatches = 0;
  for (const fA of fieldsA) {
    if (fieldsB.includes(fA)) exactMatches++;
  }

  const fieldScore = exactMatches / Math.max(1, fieldsA.length + fieldsB.length - exactMatches);

  // Baseline Formula: 40% Route + 40% Exact Fields + 20% Method
  const rawScore = (routeScore * 0.40 + fieldScore * 0.40 + methodScore * 0.20) * 100;
  return Math.round(rawScore * 10) / 10;
}

// --- ENHANCED ANALYSIS ENGINE (With Semantics & Relationships) ---
export function analyzeEnhancedPair(apiA, apiB, settings = {}) {
  const weights = settings.weights || { route: 20, method: 10, category: 20, fields: 20, semantics: 25, output: 5 };
  
  // 1. Route similarity
  const routeScore = getRouteSimilarity(extractRoute(apiA), extractRoute(apiB), apiA.category, apiB.category);

  // 2. Method similarity
  const methodScore = extractMethod(apiA) === extractMethod(apiB) ? 1.0 : 0.0;

  // 3. Category similarity
  let categoryScore = 0.0;
  if (apiA.category === apiB.category) {
    categoryScore = 1.0;
  } else {
    const catMap = {
      'Reservation Management': 'Hotel Booking',
      'Hotel Booking': 'Reservation Management',
      'Payment Processing': 'Refund Processing',
      'Refund Processing': 'Payment Processing',
      'Travel Orders': 'Reservation Management'
    };
    if (catMap[apiA.category] === apiB.category || catMap[apiB.category] === apiA.category) {
      categoryScore = 0.7;
    }
  }

  // Cross-vertical domain mismatch flag (e.g. Flight vs Hotel)
  const isVerticalMismatch = 
    ((apiA.category.includes('Flight') && apiB.category.includes('Hotel')) ||
     (apiA.category.includes('Hotel') && apiB.category.includes('Flight')));

  // 4. Field Names similarity
  const fieldsA = apiA.inputFields || [];
  const fieldsB = apiB.inputFields || [];
  const fieldMappings = [];
  let inputMatches = 0;

  for (const fA of fieldsA) {
    for (const fB of fieldsB) {
      const conceptA = fA.semanticConcept || CONCEPT_MAP[fA.name] || getSynonymGroup(fA.name);
      const conceptB = fB.semanticConcept || CONCEPT_MAP[fB.name] || getSynonymGroup(fB.name);
      const rel = classifyRelationship(fA.name, fB.name, conceptA, conceptB);

      if (rel !== 'Different') {
        fieldMappings.push({
          id: `map-${fA.name}-${fB.name}`,
          fieldA: fA.name,
          fieldB: fB.name,
          semanticConceptA: conceptA,
          semanticConceptB: conceptB,
          relationship: rel,
          similarityScore: rel === 'Exact Equivalent' ? 100 : rel === 'Strong Equivalent' ? 88 : 72,
          reason: `Mapped via semantic concept (${conceptA} ↔ ${conceptB})`,
          confidence: rel === 'Exact Equivalent' ? 1.0 : 0.85
        });
        inputMatches++;
        break;
      }
    }
  }

  const totalInputUnique = Math.max(1, fieldsA.length + fieldsB.length - inputMatches);
  const rawFieldsScore = (fieldsA.length > 0 && fieldsB.length > 0) ? (inputMatches / totalInputUnique) : 0;
  // If distinct verticals collide, dampen field score
  const fieldsScore = isVerticalMismatch ? rawFieldsScore * 0.5 : rawFieldsScore;

  // 5. Semantic similarity (concept overlap)
  let semanticMatchesSum = 0;
  let semanticCount = 0;

  for (const fA of fieldsA) {
    for (const fB of fieldsB) {
      const conceptA = fA.semanticConcept || CONCEPT_MAP[fA.name];
      const conceptB = fB.semanticConcept || CONCEPT_MAP[fB.name];
      if (conceptA && conceptB && conceptA === conceptB) {
        semanticMatchesSum += 1.0;
        semanticCount++;
        break;
      }
    }
  }
  const rawSemanticsScore = semanticCount > 0 ? (semanticMatchesSum / Math.max(1, Math.min(fieldsA.length, fieldsB.length))) : 0;
  const semanticsScore = isVerticalMismatch ? rawSemanticsScore * 0.4 : rawSemanticsScore;

  // 6. Response structure similarity
  const outA = apiA.outputFields || [];
  const outB = apiB.outputFields || [];
  let outputMatches = 0;
  for (const oA of outA) {
    if (outB.some(oB => oB.name === oA.name || (CONCEPT_MAP[oA.name] && CONCEPT_MAP[oA.name] === CONCEPT_MAP[oB.name]))) {
      outputMatches++;
    }
  }
  const outputScore = (outA.length > 0 && outB.length > 0) 
    ? (outputMatches / Math.max(1, outA.length + outB.length - outputMatches)) 
    : (isVerticalMismatch ? 0 : 0.5);

  // Final Weighted Score calculation
  const scoreRaw = (
    (routeScore * (weights.route / 100)) +
    (methodScore * (weights.method / 100)) +
    (categoryScore * (weights.category / 100)) +
    (fieldsScore * (weights.fields / 100)) +
    (semanticsScore * (weights.semantics / 100)) +
    (outputScore * (weights.output / 100))
  ) * 100;

  const score = Math.round(scoreRaw * 10) / 10;

  // Priority Labeling
  const thresholds = settings.thresholds || { high: 85, potential: 65, overlap: 40 };
  let label = 'NOT DUPLICATE';
  if (score >= thresholds.high) label = 'HIGH PRIORITY DUPLICATE';
  else if (score >= thresholds.potential) label = 'POTENTIAL DUPLICATE';
  else if (score >= thresholds.overlap) label = 'POSSIBLE OVERLAP';

  // Construct Explainable Evidence Checkmarks List
  const evidenceCheckmarks = [];
  if (categoryScore === 1.0) evidenceCheckmarks.push(`✓ Same business category (${apiA.category})`);
  else if (categoryScore > 0) evidenceCheckmarks.push(`✓ Related travel domains (${apiA.category} & ${apiB.category})`);
  
  if (methodScore === 1.0) evidenceCheckmarks.push(`✓ Same HTTP method (${extractMethod(apiA)})`);
  
  if (routeScore > 0.6) evidenceCheckmarks.push(`✓ Strong route token similarity (${Math.round(routeScore * 100)}%)`);
  
  if (fieldMappings.length > 0) evidenceCheckmarks.push(`✓ ${fieldMappings.length} field parameters have strong semantic concept matches`);
  
  if (fieldMappings.some(m => m.semanticConceptA === 'currency_code')) evidenceCheckmarks.push(`✓ Currency fields are equivalent`);
  if (fieldMappings.some(m => m.semanticConceptA === 'check_in_date')) evidenceCheckmarks.push(`✓ Date fields are equivalent`);
  if (fieldMappings.some(m => m.semanticConceptA === 'monetary_amount')) evidenceCheckmarks.push(`✓ Amount/Price fields are equivalent`);
  if (fieldMappings.some(m => m.semanticConceptA === 'booking_identifier')) evidenceCheckmarks.push(`✓ Booking/Reservation identifiers are equivalent`);
  if (fieldMappings.some(m => m.semanticConceptA === 'transaction_identifier')) evidenceCheckmarks.push(`✓ Payment Transaction identifiers are equivalent`);

  return {
    score,
    label,
    confidence: score > 80 ? 0.95 : 0.75,
    routeScore: Math.round(routeScore * 100),
    methodScore: Math.round(methodScore * 100),
    categoryScore: Math.round(categoryScore * 100),
    fieldNameScore: Math.round(fieldsScore * 100),
    semanticScore: Math.round(semanticsScore * 100),
    responseScore: Math.round(outputScore * 100),
    fieldMappings,
    evidenceCheckmarks
  };
}

export function runFullAnalysis(apis, settings = {}) {
  const results = [];
  
  for (let i = 0; i < apis.length; i++) {
    for (let j = i + 1; j < apis.length; j++) {
      const apiA = apis[i];
      const apiB = apis[j];
      
      const comparison = analyzeEnhancedPair(apiA, apiB, settings);
      
      const epAId = (apiA.primaryEndpoint && apiA.primaryEndpoint.id) || (apiA.endpoints && apiA.endpoints[0] && apiA.endpoints[0].id) || `ep-${apiA.id}`;
      const epBId = (apiB.primaryEndpoint && apiB.primaryEndpoint.id) || (apiB.endpoints && apiB.endpoints[0] && apiB.endpoints[0].id) || `ep-${apiB.id}`;

      results.push({
        id: `find-${apiA.id}-${apiB.id}`,
        apiAId: apiA.id,
        apiBId: apiB.id,
        endpointAId: epAId,
        endpointBId: epBId,
        score: comparison.score,
        label: comparison.label,
        confidence: comparison.confidence,
        status: 'Needs Review',
        routeScore: comparison.routeScore,
        categoryScore: comparison.categoryScore,
        fieldNameScore: comparison.fieldNameScore,
        semanticScore: comparison.semanticScore,
        responseScore: comparison.responseScore,
        methodScore: comparison.methodScore,
        detectedAt: new Date().toISOString(),
        fieldMappings: comparison.fieldMappings,
        evidenceCheckmarks: comparison.evidenceCheckmarks
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
