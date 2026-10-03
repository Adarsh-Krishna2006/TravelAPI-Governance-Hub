/**
 * Repository Interface
 * Defines the standard contract for data access across persistence engines (JSON vs PostgreSQL).
 */
export class IRepository {
  async getOrganisations(filter = {}) { throw new Error('Not implemented'); }
  async getUsers(filter = {}) { throw new Error('Not implemented'); }
  async getSettings() { throw new Error('Not implemented'); }
  async updateSettings(settings) { throw new Error('Not implemented'); }
  async getApis(filter = {}) { throw new Error('Not implemented'); }
  async getEnrichedApis(filter = {}) { throw new Error('Not implemented'); }
  async getApiById(id) { throw new Error('Not implemented'); }
  async createApi(apiData) { throw new Error('Not implemented'); }
  async updateApi(id, updates) { throw new Error('Not implemented'); }
  async deleteApi(id) { throw new Error('Not implemented'); }
  async getEndpoints(filter = {}) { throw new Error('Not implemented'); }
  async createEndpoint(epData) { throw new Error('Not implemented'); }
  async getFields(filter = {}) { throw new Error('Not implemented'); }
  async createField(fieldData) { throw new Error('Not implemented'); }
  async getDuplicateFindings(filter = {}) { throw new Error('Not implemented'); }
  async saveDuplicateFindings(findings) { throw new Error('Not implemented'); }
  async updateDuplicateFinding(id, updates) { throw new Error('Not implemented'); }
  async getGovernanceDecisions(filter = {}) { throw new Error('Not implemented'); }
  async createGovernanceDecision(decision) { throw new Error('Not implemented'); }
  async getAuditLogs(filter = {}) { throw new Error('Not implemented'); }
  async createAuditLog(log) { throw new Error('Not implemented'); }
  async getExperimentRuns() { throw new Error('Not implemented'); }
  async saveExperimentRun(run) { throw new Error('Not implemented'); }
  async getTestResults() { throw new Error('Not implemented'); }
  async saveTestResults(results) { throw new Error('Not implemented'); }
  async getGroundTruthReviews() { throw new Error('Not implemented'); }
  async saveGroundTruthReview(review) { throw new Error('Not implemented'); }
  async reset() { throw new Error('Not implemented'); }
  async rawRead() { throw new Error('Not implemented'); }
  async rawWrite(data) { throw new Error('Not implemented'); }
  async transaction(callback) { throw new Error('Not implemented'); }
}
