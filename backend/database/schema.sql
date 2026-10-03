-- ====================================================================
-- TravelAPI Governance Hub - PostgreSQL Production Schema
-- ====================================================================

-- Organisations Table
CREATE TABLE IF NOT EXISTS organisations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'External',
  status VARCHAR(64) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(64) NOT NULL,
  organisation_id VARCHAR(64) REFERENCES organisations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- APIs Table
CREATE TABLE IF NOT EXISTS apis (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organisation_id VARCHAR(64) REFERENCES organisations(id) ON DELETE CASCADE,
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(128) NOT NULL DEFAULT 'Unclassified',
  visibility VARCHAR(32) NOT NULL DEFAULT 'Public',
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  gateway_base_url VARCHAR(255),
  governance_status VARCHAR(64) NOT NULL DEFAULT 'Active',
  source_type VARCHAR(64) DEFAULT 'manual',
  source_gateway VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Endpoints Table
CREATE TABLE IF NOT EXISTS endpoints (
  id VARCHAR(128) PRIMARY KEY,
  api_id VARCHAR(128) NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  path VARCHAR(255) NOT NULL,
  http_method VARCHAR(16) NOT NULL,
  description TEXT,
  operation_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema Fields Table
CREATE TABLE IF NOT EXISTS schema_fields (
  id VARCHAR(128) PRIMARY KEY,
  endpoint_id VARCHAR(128) NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  data_type VARCHAR(64) NOT NULL DEFAULT 'string',
  direction VARCHAR(16) NOT NULL DEFAULT 'input',
  required BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  semantic_concept VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specifications Table (OpenAPI & Gateway Specs)
CREATE TABLE IF NOT EXISTS specifications (
  id VARCHAR(128) PRIMARY KEY,
  api_id VARCHAR(128) REFERENCES apis(id) ON DELETE CASCADE,
  version VARCHAR(32),
  format VARCHAR(32) NOT NULL DEFAULT 'openapi-json',
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duplicate Findings Table
CREATE TABLE IF NOT EXISTS duplicate_findings (
  id VARCHAR(128) PRIMARY KEY,
  api_a_id VARCHAR(128) NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  api_b_id VARCHAR(128) NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL,
  label VARCHAR(64) NOT NULL,
  confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.85,
  status VARCHAR(64) NOT NULL DEFAULT 'Pending Review',
  evidence_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Governance Decisions Table
CREATE TABLE IF NOT EXISTS governance_decisions (
  id VARCHAR(128) PRIMARY KEY,
  finding_id VARCHAR(128) REFERENCES duplicate_findings(id) ON DELETE SET NULL,
  api_id VARCHAR(128) REFERENCES apis(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  rationale TEXT,
  decided_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(64) NOT NULL DEFAULT 'Approved'
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(128) PRIMARY KEY,
  organisation_id VARCHAR(64) REFERENCES organisations(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(128),
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Experiment Runs Table
CREATE TABLE IF NOT EXISTS experiment_runs (
  id VARCHAR(128) PRIMARY KEY,
  model_type VARCHAR(64) NOT NULL,
  precision_val NUMERIC(5, 2),
  recall_val NUMERIC(5, 2),
  f1_score NUMERIC(5, 2),
  metrics_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id VARCHAR(128) PRIMARY KEY,
  suite_name VARCHAR(128),
  passed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  results_json JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ground Truth Reviews Table
CREATE TABLE IF NOT EXISTS ground_truth_reviews (
  id VARCHAR(128) PRIMARY KEY,
  pair_id VARCHAR(128) NOT NULL,
  human_label VARCHAR(64) NOT NULL,
  reviewed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(64) PRIMARY KEY,
  settings_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_apis_org ON apis(organisation_id);
CREATE INDEX IF NOT EXISTS idx_apis_status ON apis(status);
CREATE INDEX IF NOT EXISTS idx_apis_category ON apis(category);
CREATE INDEX IF NOT EXISTS idx_endpoints_api ON endpoints(api_id);
CREATE INDEX IF NOT EXISTS idx_fields_endpoint ON schema_fields(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_fields_concept ON schema_fields(semantic_concept);
CREATE INDEX IF NOT EXISTS idx_findings_apis ON duplicate_findings(api_a_id, api_b_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON duplicate_findings(status);
CREATE INDEX IF NOT EXISTS idx_gov_api ON governance_decisions(api_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
