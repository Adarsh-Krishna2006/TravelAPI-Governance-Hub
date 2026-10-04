import { IRepository } from './repository.interface.js';

export class PostgresRepository extends IRepository {
  constructor(connectionString = process.env.DATABASE_URL, options = {}) {
    super();
    this.connectionString = connectionString;
    this.pool = null;
    this.pg = null;
    this.isInitialized = false;
    this.options = options;
  }

  async _getPool() {
    if (this.pool) return this.pool;
    try {
      const pgModule = await import('pg');
      this.pg = pgModule.default || pgModule;
      const { Pool } = this.pg;
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        ...this.options
      });
      return this.pool;
    } catch (err) {
      console.warn('[PostgresRepository] Unable to initialize pg pool:', err.message);
      throw err;
    }
  }

  async query(text, params = []) {
    const pool = await this._getPool();
    return pool.query(text, params);
  }

  /**
   * ACID TRANSACTION RUNNER:
   * 
   * Architectural Design:
   * Compound governance lifecycle mutations (such as formal consolidation: deprecating an API,
   * updating endpoint routes, altering finding status to 'Consolidated', and appending audit logs)
   * must execute atomically.
   * 
   * Implementation:
   * 1. Acquires a dedicated client connection from the pg.Pool.
   * 2. Issues 'BEGIN' to start an isolated transaction.
   * 3. Executes all operations via PostgresTransactionClient.
   * 4. Issues 'COMMIT' on success, or 'ROLLBACK' on any error, guaranteeing zero partial states.
   * 5. Finally releases the client back to the pool to prevent connection leaks.
   */
  async transaction(callback) {
    const pool = await this._getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txRepo = new PostgresTransactionClient(client);
      const result = await callback(txRepo);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getOrganisations(filter = {}) {
    let sql = 'SELECT id, name, type, status, created_at as "createdAt" FROM organisations WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.type) {
      params.push(filter.type);
      sql += ` AND type = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async getUsers(filter = {}) {
    let sql = 'SELECT id, name, email, role, organisation_id as "organisationId", created_at as "createdAt" FROM users WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.email) {
      params.push(filter.email);
      sql += ` AND email = $${params.length}`;
    }
    if (filter.role) {
      params.push(filter.role);
      sql += ` AND role = $${params.length}`;
    }
    if (filter.organisationId) {
      params.push(filter.organisationId);
      sql += ` AND organisation_id = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async getSettings() {
    const res = await this.query('SELECT settings_json FROM system_settings WHERE key = $1', ['default']);
    if (res.rows.length > 0) {
      return res.rows[0].settings_json;
    }
    return {
      weights: { route: 20, method: 10, category: 20, fields: 20, semantics: 25, output: 5 },
      thresholds: { high: 85, potential: 65, overlap: 40 }
    };
  }

  async updateSettings(settings) {
    const existing = await this.getSettings();
    const updated = { ...existing, ...settings };
    await this.query(
      `INSERT INTO system_settings (key, settings_json, updated_at)
       VALUES ('default', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET settings_json = $1, updated_at = NOW()`,
      [JSON.stringify(updated)]
    );
    return updated;
  }

  async getApis(filter = {}) {
    let sql = `
      SELECT id, name, description, organisation_id as "organisationId", owner_id as "ownerId",
             category, visibility, version, status, gateway_base_url as "gatewayBaseUrl",
             governance_status as "governanceStatus", source_type as "sourceType",
             source_gateway as "sourceGateway", created_at as "createdAt", updated_at as "updatedAt"
      FROM apis WHERE 1=1
    `;
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.organisationId) {
      params.push(filter.organisationId);
      sql += ` AND organisation_id = $${params.length}`;
    }
    if (filter.status) {
      params.push(filter.status);
      sql += ` AND status = $${params.length}`;
    }
    if (filter.category) {
      params.push(filter.category);
      sql += ` AND category = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async getEnrichedApis(filter = {}) {
    const apis = await this.getApis(filter);
    const endpoints = await this.getEndpoints();
    const fields = await this.getFields();

    return apis.map(api => {
      const apiEndpoints = endpoints.filter(ep => ep.apiId === api.id);
      const primaryEndpoint = apiEndpoints[0] || null;
      const inputFields = [];
      const outputFields = [];
      const seenInput = new Set();
      const seenOutput = new Set();

      for (const ep of apiEndpoints) {
        const epFields = fields.filter(f => f.endpointId === ep.id);
        for (const f of epFields) {
          if (f.direction === 'output') {
            if (!seenOutput.has(f.name)) {
              seenOutput.add(f.name);
              outputFields.push(f);
            }
          } else {
            if (!seenInput.has(f.name)) {
              seenInput.add(f.name);
              inputFields.push(f);
            }
          }
        }
      }

      return {
        ...api,
        method: (primaryEndpoint && primaryEndpoint.httpMethod) || 'POST',
        endpoints: apiEndpoints,
        primaryEndpoint,
        inputFields,
        outputFields
      };
    });
  }

  async getApiById(id) {
    const apis = await this.getApis({ id });
    return apis[0] || null;
  }

  async createApi(apiData) {
    const sql = `
      INSERT INTO apis (id, name, description, organisation_id, owner_id, category, visibility, version, status, gateway_base_url, governance_status, source_type, source_gateway, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, name, description, organisation_id as "organisationId", owner_id as "ownerId", category, visibility, version, status, gateway_base_url as "gatewayBaseUrl", governance_status as "governanceStatus", source_type as "sourceType", source_gateway as "sourceGateway", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const params = [
      apiData.id,
      apiData.name,
      apiData.description || '',
      apiData.organisationId,
      apiData.ownerId || null,
      apiData.category || 'Unclassified',
      apiData.visibility || 'Public',
      apiData.version || '1.0.0',
      apiData.status || 'Active',
      apiData.gatewayBaseUrl || '',
      apiData.governanceStatus || 'Active',
      apiData.sourceType || 'manual',
      apiData.sourceGateway || null
    ];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async updateApi(id, updates) {
    const fields = [];
    const params = [id];
    const fieldMap = {
      name: 'name',
      description: 'description',
      category: 'category',
      visibility: 'visibility',
      version: 'version',
      status: 'status',
      gatewayBaseUrl: 'gateway_base_url',
      governanceStatus: 'governance_status',
      sourceType: 'source_type',
      sourceGateway: 'source_gateway'
    };

    for (const [key, val] of Object.entries(updates)) {
      if (fieldMap[key]) {
        params.push(val);
        fields.push(`${fieldMap[key]} = $${params.length}`);
      }
    }

    if (fields.length === 0) return this.getApiById(id);
    fields.push('updated_at = NOW()');

    const sql = `UPDATE apis SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await this.query(sql, params);
    return res.rows[0] || null;
  }

  async deleteApi(id) {
    const res = await this.query('DELETE FROM apis WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  async getEndpoints(filter = {}) {
    let sql = 'SELECT id, api_id as "apiId", path, http_method as "httpMethod", description, operation_id as "operationId" FROM endpoints WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.apiId) {
      params.push(filter.apiId);
      sql += ` AND api_id = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async createEndpoint(epData) {
    const sql = `
      INSERT INTO endpoints (id, api_id, path, http_method, description, operation_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, api_id as "apiId", path, http_method as "httpMethod", description, operation_id as "operationId"
    `;
    const params = [epData.id, epData.apiId, epData.path, epData.httpMethod, epData.description || '', epData.operationId || ''];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getFields(filter = {}) {
    let sql = 'SELECT id, endpoint_id as "endpointId", name, data_type as "dataType", direction, required, description, semantic_concept as "semanticConcept" FROM schema_fields WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.endpointId) {
      params.push(filter.endpointId);
      sql += ` AND endpoint_id = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async createField(fieldData) {
    const sql = `
      INSERT INTO schema_fields (id, endpoint_id, name, data_type, direction, required, description, semantic_concept, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, endpoint_id as "endpointId", name, data_type as "dataType", direction, required, description, semantic_concept as "semanticConcept"
    `;
    const params = [
      fieldData.id,
      fieldData.endpointId,
      fieldData.name,
      fieldData.dataType || 'string',
      fieldData.direction || 'input',
      fieldData.required || false,
      fieldData.description || '',
      fieldData.semanticConcept || null
    ];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getDuplicateFindings(filter = {}) {
    let sql = 'SELECT id, api_a_id as "apiAId", api_b_id as "apiBId", score, label, confidence, status, evidence_json as "evidenceJson", created_at as "createdAt", updated_at as "updatedAt" FROM duplicate_findings WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.status) {
      params.push(filter.status);
      sql += ` AND status = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async saveDuplicateFindings(findings) {
    await this.query('DELETE FROM duplicate_findings');
    for (const f of findings) {
      await this.query(
        `INSERT INTO duplicate_findings (id, api_a_id, api_b_id, score, label, confidence, status, evidence_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [f.id, f.apiAId, f.apiBId, f.score, f.label, f.confidence || 0.85, f.status || 'Pending Review', JSON.stringify(f.evidenceJson || f)]
      );
    }
    return findings;
  }

  async updateDuplicateFinding(id, updates) {
    const fields = [];
    const params = [id];
    if (updates.status) {
      params.push(updates.status);
      fields.push(`status = $${params.length}`);
    }
    if (updates.evidenceJson) {
      params.push(JSON.stringify(updates.evidenceJson));
      fields.push(`evidence_json = $${params.length}`);
    }
    fields.push('updated_at = NOW()');
    const sql = `UPDATE duplicate_findings SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await this.query(sql, params);
    return res.rows[0] || null;
  }

  async getGovernanceDecisions(filter = {}) {
    let sql = 'SELECT id, finding_id as "findingId", api_id as "apiId", action, rationale, decided_by as "decidedBy", decided_at as "decidedAt", status FROM governance_decisions WHERE 1=1';
    const params = [];
    if (filter.id) {
      params.push(filter.id);
      sql += ` AND id = $${params.length}`;
    }
    if (filter.apiId) {
      params.push(filter.apiId);
      sql += ` AND api_id = $${params.length}`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  async createGovernanceDecision(decision) {
    const sql = `
      INSERT INTO governance_decisions (id, finding_id, api_id, action, rationale, decided_by, decided_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING id, finding_id as "findingId", api_id as "apiId", action, rationale, decided_by as "decidedBy", decided_at as "decidedAt", status
    `;
    const params = [
      decision.id,
      decision.findingId || null,
      decision.apiId,
      decision.action,
      decision.rationale || '',
      decision.decidedBy || null,
      decision.status || 'Approved'
    ];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getAuditLogs(filter = {}) {
    let sql = 'SELECT id, organisation_id as "organisationId", user_id as "userId", action, resource_type as "resourceType", resource_id as "resourceId", details_json as "detailsJson", created_at as "createdAt" FROM audit_logs WHERE 1=1';
    const params = [];
    if (filter.organisationId) {
      params.push(filter.organisationId);
      sql += ` AND organisation_id = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const res = await this.query(sql, params);
    return res.rows;
  }

  async createAuditLog(log) {
    const sql = `
      INSERT INTO audit_logs (id, organisation_id, user_id, action, resource_type, resource_id, details_json, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, organisation_id as "organisationId", user_id as "userId", action, resource_type as "resourceType", resource_id as "resourceId", details_json as "detailsJson", created_at as "createdAt"
    `;
    const params = [
      log.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      log.organisationId,
      log.userId || null,
      log.action,
      log.resourceType || 'API',
      log.resourceId || '',
      JSON.stringify(log.detailsJson || log.details || {})
    ];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getExperimentRuns() {
    const res = await this.query('SELECT * FROM experiment_runs ORDER BY created_at DESC');
    return res.rows;
  }

  async saveExperimentRun(run) {
    const sql = `
      INSERT INTO experiment_runs (id, model_type, precision_val, recall_val, f1_score, metrics_json, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const params = [run.id, run.modelType, run.precision, run.recall, run.f1, JSON.stringify(run.metrics || {})];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getTestResults() {
    const res = await this.query('SELECT * FROM test_results ORDER BY executed_at DESC');
    return res.rows;
  }

  async saveTestResults(results) {
    const sql = `
      INSERT INTO test_results (id, suite_name, passed_count, failed_count, results_json, executed_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const params = [results.id || `test-${Date.now()}`, results.suiteName || 'all', results.passedCount || 0, results.failedCount || 0, JSON.stringify(results)];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async getGroundTruthReviews() {
    const res = await this.query('SELECT * FROM ground_truth_reviews ORDER BY reviewed_at DESC');
    return res.rows;
  }

  async saveGroundTruthReview(review) {
    const sql = `
      INSERT INTO ground_truth_reviews (id, pair_id, human_label, reviewed_by, reviewed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const params = [review.id, review.pairId, review.humanLabel, review.reviewedBy || null];
    const res = await this.query(sql, params);
    return res.rows[0];
  }

  async reset() {
    return { status: 'reset_completed' };
  }

  async rawRead() {
    const apis = await this.getEnrichedApis();
    const organisations = await this.getOrganisations();
    const users = await this.getUsers();
    const settings = await this.getSettings();
    const endpoints = await this.getEndpoints();
    const fields = await this.getFields();
    const duplicate_findings = await this.getDuplicateFindings();
    const governance_decisions = await this.getGovernanceDecisions();
    const audit_logs = await this.getAuditLogs();
    const experiment_runs = await this.getExperimentRuns();
    const test_results = await this.getTestResults();
    const ground_truth_reviews = await this.getGroundTruthReviews();

    return {
      organisations,
      users,
      settings,
      apis,
      endpoints,
      api_fields: fields,
      specifications: [],
      duplicate_findings,
      field_mappings: [],
      evidence: [],
      governance_decisions,
      experiment_runs,
      test_results,
      audit_logs,
      ground_truth_reviews
    };
  }

  async rawWrite(data) {
    if (data.settings) await this.updateSettings(data.settings);
    if (data.duplicate_findings) await this.saveDuplicateFindings(data.duplicate_findings);
    return true;
  }
}

class PostgresTransactionClient {
  constructor(client) {
    this.client = client;
  }
  async query(text, params = []) {
    return this.client.query(text, params);
  }
}
