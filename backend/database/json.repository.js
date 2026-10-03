import { IRepository } from './repository.interface.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '..', 'db.json');

export class JsonRepository extends IRepository {
  constructor(dbFile = DB_FILE, helpers = {}) {
    super();
    this.dbFile = dbFile;
    this.helpers = helpers;
  }

  _read() {
    if (this.helpers.readDB) return this.helpers.readDB();
    try {
      const raw = fs.readFileSync(this.dbFile, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  _write(data) {
    if (this.helpers.writeDB) return this.helpers.writeDB(data);
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
      } catch (err) {
        if (attempt === 3) return false;
        const end = Date.now() + 60;
        while (Date.now() < end) {}
      }
    }
    return false;
  }

  async rawRead() {
    return this._read();
  }

  async rawWrite(data) {
    return this._write(data);
  }

  async getOrganisations(filter = {}) {
    const db = this._read();
    let orgs = db.organisations || [];
    if (filter.id) orgs = orgs.filter(o => o.id === filter.id);
    if (filter.type) orgs = orgs.filter(o => o.type === filter.type);
    return orgs;
  }

  async getUsers(filter = {}) {
    const db = this._read();
    let users = db.users || [];
    if (filter.id) users = users.filter(u => u.id === filter.id);
    if (filter.email) users = users.filter(u => u.email === filter.email);
    if (filter.role) users = users.filter(u => u.role === filter.role);
    if (filter.organisationId) users = users.filter(u => u.organisationId === filter.organisationId);
    return users;
  }

  async getSettings() {
    const db = this._read();
    return db.settings || {};
  }

  async updateSettings(settings) {
    const db = this._read();
    db.settings = { ...db.settings, ...settings };
    this._write(db);
    return db.settings;
  }

  async getApis(filter = {}) {
    const db = this._read();
    let apis = db.apis || [];
    if (filter.id) apis = apis.filter(a => a.id === filter.id);
    if (filter.organisationId) apis = apis.filter(a => a.organisationId === filter.organisationId);
    if (filter.status) apis = apis.filter(a => a.status === filter.status);
    if (filter.category) apis = apis.filter(a => a.category === filter.category);
    return apis;
  }

  async getEnrichedApis(filter = {}) {
    if (this.helpers.getEnrichedApis) {
      const db = this._read();
      let enriched = this.helpers.getEnrichedApis(db);
      if (filter.organisationId) enriched = enriched.filter(a => a.organisationId === filter.organisationId);
      if (filter.status) enriched = enriched.filter(a => a.status === filter.status);
      return enriched;
    }
    return this.getApis(filter);
  }

  async getApiById(id) {
    const apis = await this.getApis({ id });
    return apis[0] || null;
  }

  async createApi(apiData) {
    const db = this._read();
    db.apis = db.apis || [];
    db.apis.push(apiData);
    this._write(db);
    return apiData;
  }

  async updateApi(id, updates) {
    const db = this._read();
    const idx = (db.apis || []).findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.apis[idx] = { ...db.apis[idx], ...updates, updatedAt: new Date().toISOString() };
    this._write(db);
    return db.apis[idx];
  }

  async deleteApi(id) {
    const db = this._read();
    const beforeLen = (db.apis || []).length;
    db.apis = (db.apis || []).filter(a => a.id !== id);
    if (db.apis.length !== beforeLen) {
      this._write(db);
      return true;
    }
    return false;
  }

  async getEndpoints(filter = {}) {
    const db = this._read();
    let eps = db.endpoints || [];
    if (filter.id) eps = eps.filter(e => e.id === filter.id);
    if (filter.apiId) eps = eps.filter(e => e.apiId === filter.apiId);
    return eps;
  }

  async createEndpoint(epData) {
    const db = this._read();
    db.endpoints = db.endpoints || [];
    db.endpoints.push(epData);
    this._write(db);
    return epData;
  }

  async getFields(filter = {}) {
    const db = this._read();
    let fields = db.api_fields || [];
    if (filter.id) fields = fields.filter(f => f.id === filter.id);
    if (filter.endpointId) fields = fields.filter(f => f.endpointId === filter.endpointId);
    return fields;
  }

  async createField(fieldData) {
    const db = this._read();
    db.api_fields = db.api_fields || [];
    db.api_fields.push(fieldData);
    this._write(db);
    return fieldData;
  }

  async getDuplicateFindings(filter = {}) {
    const db = this._read();
    let findings = db.duplicate_findings || [];
    if (filter.id) findings = findings.filter(f => f.id === filter.id);
    if (filter.status) findings = findings.filter(f => f.status === filter.status);
    return findings;
  }

  async saveDuplicateFindings(findings) {
    const db = this._read();
    db.duplicate_findings = findings;
    this._write(db);
    return db.duplicate_findings;
  }

  async updateDuplicateFinding(id, updates) {
    const db = this._read();
    const idx = (db.duplicate_findings || []).findIndex(f => f.id === id);
    if (idx === -1) return null;
    db.duplicate_findings[idx] = { ...db.duplicate_findings[idx], ...updates, updatedAt: new Date().toISOString() };
    this._write(db);
    return db.duplicate_findings[idx];
  }

  async getGovernanceDecisions(filter = {}) {
    const db = this._read();
    let decs = db.governance_decisions || [];
    if (filter.id) decs = decs.filter(d => d.id === filter.id);
    if (filter.apiId) decs = decs.filter(d => d.apiId === filter.apiId);
    return decs;
  }

  async createGovernanceDecision(decision) {
    const db = this._read();
    db.governance_decisions = db.governance_decisions || [];
    db.governance_decisions.push(decision);
    this._write(db);
    return decision;
  }

  async getAuditLogs(filter = {}) {
    const db = this._read();
    let logs = db.audit_logs || [];
    if (filter.organisationId) logs = logs.filter(l => l.organisationId === filter.organisationId);
    return logs;
  }

  async createAuditLog(log) {
    const db = this._read();
    db.audit_logs = db.audit_logs || [];
    db.audit_logs.push(log);
    this._write(db);
    return log;
  }

  async getExperimentRuns() {
    const db = this._read();
    return db.experiment_runs || [];
  }

  async saveExperimentRun(run) {
    const db = this._read();
    db.experiment_runs = db.experiment_runs || [];
    db.experiment_runs.push(run);
    this._write(db);
    return run;
  }

  async getTestResults() {
    const db = this._read();
    return db.test_results || [];
  }

  async saveTestResults(results) {
    const db = this._read();
    db.test_results = results;
    this._write(db);
    return db.test_results;
  }

  async getGroundTruthReviews() {
    const db = this._read();
    return db.ground_truth_reviews || [];
  }

  async saveGroundTruthReview(review) {
    const db = this._read();
    db.ground_truth_reviews = db.ground_truth_reviews || [];
    db.ground_truth_reviews.push(review);
    this._write(db);
    return review;
  }

  async reset() {
    if (this.helpers.resetDB) {
      return this.helpers.resetDB();
    }
    return this._read();
  }

  async transaction(callback) {
    const db = this._read();
    const backup = JSON.parse(JSON.stringify(db));
    try {
      const result = await callback(this);
      return result;
    } catch (err) {
      this._write(backup);
      throw err;
    }
  }
}
