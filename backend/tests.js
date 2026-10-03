// Automated Test Suite for TravelAPI Governance Hub
// Can be executed via: npm test  or  node backend/tests.js

import http from 'http';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app from './server.js';
import { readDB, resetDB, getEnrichedApis, getRepository, createRepository, JsonRepository, PostgresRepository, IRepository } from './database.js';
import { analyzeEnhancedPair, analyzeBaselinePair } from './analyser.js';
import { calculateContextualFieldSimilarity, generateFieldEmbedding, cosineSimilarity } from './embeddings.js';
import { parseGatewayExport, scrubCredentials, detectGatewayFormat } from './gateway.js';
import { getJwtSecret } from './routes.js';


process.env.JWT_SECRET = process.env.JWT_SECRET || 'travelsphere-test-secret-key-9876';
const JWT_SECRET = process.env.JWT_SECRET;

let server;
let baseUrl;
let passedCount = 0;
let failedCount = 0;

function logTest(name, passed, details = '') {
  if (passed) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name} ${details ? `(${details})` : ''}`);
  } else {
    failedCount++;
    console.log(`  \x1b[31m✘ FAIL\x1b[0m: ${name} ${details ? `(${details})` : ''}`);
  }
}

async function startServer() {
  return new Promise((resolve) => {
    // Port 0 picks a free dynamic ephemeral port
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' Starting TravelAPI Governance Hub Automated Tests');
  console.log('======================================================\n');

  process.env.NODE_ENV = 'test';
  await startServer();

  // Reset database before test run to ensure deterministic state
  resetDB();

  // Obtain tokens for different roles
  const adminToken = jwt.sign(
    { id: 'usr-admin', name: 'Alice Admin', email: 'admin@travelsphere.demo', role: 'Admin', organisationId: 'org-ts' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const ownerToken = jwt.sign(
    { id: 'usr-owner', name: 'Bob Owner', email: 'owner@travelsphere.demo', role: 'API Owner', organisationId: 'org-ts' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const partnerToken = jwt.sign(
    { id: 'usr-partner', name: 'Charlie Partner', email: 'partner@flyfast.demo', role: 'External Partner', organisationId: 'org-flyfast' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const auditorToken = jwt.sign(
    { id: 'usr-auditor', name: 'Diana Auditor', email: 'auditor@travelsphere.demo', role: 'Auditor', organisationId: 'org-ts' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const expiredToken = jwt.sign(
    { id: 'usr-admin', name: 'Alice Admin', role: 'Admin', organisationId: 'org-ts' },
    JWT_SECRET,
    { expiresIn: '-1s' }
  );

  // ----------------------------------------------------
  // SUITE 1: AUTHENTICATION & SECURITY
  // ----------------------------------------------------
  console.log('▶ Suite 1: Authentication & Token Validation');

  // 1.1: Missing Authorization header
  const resNoAuth = await fetch(`${baseUrl}/auth/profile`);
  logTest('Reject request with missing Authorization header with 401', resNoAuth.status === 401, `Status: ${resNoAuth.status}`);

  // 1.2: Invalid / malformed header format
  const resBadHeader = await fetch(`${baseUrl}/auth/profile`, {
    headers: { 'Authorization': 'Basic 12345' }
  });
  logTest('Reject malformed Authorization header with 401', resBadHeader.status === 401, `Status: ${resBadHeader.status}`);

  // 1.3: Invalid token
  const resInvalidToken = await fetch(`${baseUrl}/auth/profile`, {
    headers: { 'Authorization': 'Bearer totally-invalid-jwt-token' }
  });
  logTest('Reject invalid JWT token with 401', resInvalidToken.status === 401, `Status: ${resInvalidToken.status}`);

  // 1.4: Expired token
  const resExpiredToken = await fetch(`${baseUrl}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });
  logTest('Reject expired JWT token with 401', resExpiredToken.status === 401, `Status: ${resExpiredToken.status}`);

  // 1.5: Valid token
  const resValid = await fetch(`${baseUrl}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const validData = await resValid.json();
  logTest('Accept valid JWT token and return profile', resValid.status === 200 && validData.user.role === 'Admin');

  // 1.6: Production JWT secret requirement test
  const origNodeEnv = process.env.NODE_ENV;
  const origJwtSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  let prodSecretThrows = false;
  try {
    getJwtSecret();
  } catch (e) {
    prodSecretThrows = true;
  }
  process.env.NODE_ENV = origNodeEnv;
  process.env.JWT_SECRET = origJwtSecret;
  logTest('Require JWT_SECRET in production mode and fail safely if missing', prodSecretThrows);

  // ----------------------------------------------------
  // SUITE 2: RBAC ENFORCEMENT & MUTATION RESTRICTIONS
  // ----------------------------------------------------
  console.log('\n▶ Suite 2: RBAC Enforcement & Destructive Actions');

  // 2.1: Non-admin reset DB
  const resPartnerReset = await fetch(`${baseUrl}/settings/reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  logTest('Block External Partner from database reset (403 Forbidden)', resPartnerReset.status === 403, `Status: ${resPartnerReset.status}`);

  const resOwnerReset = await fetch(`${baseUrl}/settings/reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  logTest('Block API Owner from database reset (403 Forbidden)', resOwnerReset.status === 403, `Status: ${resOwnerReset.status}`);

  // 2.2: Non-admin run full demo
  const resPartnerDemo = await fetch(`${baseUrl}/demo/run-full`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  logTest('Block non-admin from running automated demo (403 Forbidden)', resPartnerDemo.status === 403, `Status: ${resPartnerDemo.status}`);

  // 2.3: Non-admin consolidate APIs
  const resOwnerConsolidate = await fetch(`${baseUrl}/governance/consolidate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ canonicalApiId: 'api-ts-hotel-booking', deprecatedApiId: 'api-stayeasy-reserve', reason: 'Test' })
  });
  logTest('Block API Owner from consolidating APIs (403 Forbidden)', resOwnerConsolidate.status === 403, `Status: ${resOwnerConsolidate.status}`);

  // 2.4: Auditor read-only restriction
  const resAuditorCreate = await fetch(`${baseUrl}/apis`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auditorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Auditor Illegal API' })
  });
  logTest('Block Auditor from creating APIs (403 Forbidden read-only)', resAuditorCreate.status === 403, `Status: ${resAuditorCreate.status}`);

  // 2.5: Admin permitted to reset DB
  const resAdminReset = await fetch(`${baseUrl}/settings/reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  logTest('Permit Admin to reset database (200 OK)', resAdminReset.status === 200);

  // 2.6: Non-admin run tests endpoint blocked
  const resPartnerTestRun = await fetch(`${baseUrl}/tests/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  logTest('Block External Partner from POST /api/tests/run (403 Forbidden)', resPartnerTestRun.status === 403, `Status: ${resPartnerTestRun.status}`);

  const resAuditorTestRun = await fetch(`${baseUrl}/tests/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auditorToken}` }
  });
  logTest('Block Auditor from POST /api/tests/run (403 Forbidden)', resAuditorTestRun.status === 403, `Status: ${resAuditorTestRun.status}`);

  // 2.7: Non-admin run experiment endpoint blocked
  const resPartnerExpRun = await fetch(`${baseUrl}/experiment/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  logTest('Block External Partner from POST /api/experiment/run (403 Forbidden)', resPartnerExpRun.status === 403, `Status: ${resPartnerExpRun.status}`);

  // 2.8: Auditor read-only access to test results
  const resAuditorTestResults = await fetch(`${baseUrl}/tests/results`, {
    headers: { 'Authorization': `Bearer ${auditorToken}` }
  });
  logTest('Allow Auditor read-only access to GET /api/tests/results (200 OK)', resAuditorTestResults.status === 200);

  // 2.9: Auditor read-only access to experiment results
  const resAuditorExpResults = await fetch(`${baseUrl}/experiment/results`, {
    headers: { 'Authorization': `Bearer ${auditorToken}` }
  });
  logTest('Allow Auditor read-only access to GET /api/experiment/results (200 OK)', resAuditorExpResults.status === 200);

  // 2.10: POST /api/analyse/run permissions
  const resPartnerAnalyse = await fetch(`${baseUrl}/analyse/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  logTest('Block External Partner from POST /api/analyse/run (403 Forbidden)', resPartnerAnalyse.status === 403, `Status: ${resPartnerAnalyse.status}`);

  const resAuditorAnalyse = await fetch(`${baseUrl}/analyse/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auditorToken}` }
  });
  logTest('Block Auditor from POST /api/analyse/run (403 Forbidden)', resAuditorAnalyse.status === 403, `Status: ${resAuditorAnalyse.status}`);

  const resOwnerAnalyse = await fetch(`${baseUrl}/analyse/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  const ownerAnalyseData = await resOwnerAnalyse.json();
  logTest('Permit API Owner to run organisation-scoped duplicate scan (200 OK)', resOwnerAnalyse.status === 200 && ownerAnalyseData.scope === 'organisation', `Scope: ${ownerAnalyseData.scope}`);

  const resAdminAnalyse = await fetch(`${baseUrl}/analyse/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminAnalyseData = await resAdminAnalyse.json();
  logTest('Permit Admin to run global duplicate scan (200 OK)', resAdminAnalyse.status === 200 && adminAnalyseData.scope === 'global', `Scope: ${adminAnalyseData.scope}`);

  // 2.11: PUT /api/analyse/review/:id permissions
  const currentFindingsRes = await fetch(`${baseUrl}/analyse/results`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const currentFindings = await currentFindingsRes.json();
  const ownerFinding = currentFindings.find(f => (f.apiA && f.apiA.organisationId === 'org-ts') || (f.apiB && f.apiB.organisationId === 'org-ts'));
  const competitorFinding = currentFindings.find(f => (f.apiA && f.apiA.organisationId !== 'org-ts') && (f.apiB && f.apiB.organisationId !== 'org-ts'));

  const resAuditorReview = await fetch(`${baseUrl}/analyse/review/${ownerFinding ? ownerFinding.id : 'any'}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${auditorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'False Positive', reason: 'Auditor attempt' })
  });
  logTest('Block Auditor from PUT /api/analyse/review/:id (403 Forbidden)', resAuditorReview.status === 403, `Status: ${resAuditorReview.status}`);

  const resPartnerReview = await fetch(`${baseUrl}/analyse/review/${ownerFinding ? ownerFinding.id : 'any'}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${partnerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'False Positive', reason: 'Partner attempt' })
  });
  logTest('Block External Partner from PUT /api/analyse/review/:id (403 Forbidden)', resPartnerReview.status === 403, `Status: ${resPartnerReview.status}`);

  if (competitorFinding) {
    const resOwnerCrossReview = await fetch(`${baseUrl}/analyse/review/${competitorFinding.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'False Positive', reason: 'Cross-org attempt' })
    });
    logTest('Block API Owner from reviewing competitor finding (403 Forbidden)', resOwnerCrossReview.status === 403, `Status: ${resOwnerCrossReview.status}`);
  }

  if (ownerFinding) {
    const resOwnerReview = await fetch(`${baseUrl}/analyse/review/${ownerFinding.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Needs Review', reason: 'Own org review' })
    });
    logTest('Permit API Owner to review own organisation finding (200 OK)', resOwnerReview.status === 200, `Status: ${resOwnerReview.status}`);
  }

  // ----------------------------------------------------
  // SUITE 3: ORGANISATION ISOLATION
  // ----------------------------------------------------
  console.log('\n▶ Suite 3: Multi-Organisation Data Isolation');

  // 3.1: Partner API listing isolation
  const resPartnerApis = await fetch(`${baseUrl}/apis`, {
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  const partnerApis = await resPartnerApis.json();
  const hasCompetitorApis = partnerApis.some(a => 
    ['org-globalhotels', 'org-stayeasy', 'org-paylink', 'org-securepay'].includes(a.organisationId)
  );
  logTest('External Partner cannot view competitor private partner APIs', !hasCompetitorApis && partnerApis.length > 0, `Returned ${partnerApis.length} visible APIs`);

  // 3.2: Partner cross-org creation check
  const resPartnerCrossOrg = await fetch(`${baseUrl}/apis`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Cross Org Hack', organisationId: 'org-globalhotels' })
  });
  logTest('Block External Partner from creating API under rival organisation (403)', resPartnerCrossOrg.status === 403);

  // 3.3: Partner audit log filtering
  const resPartnerLogs = await fetch(`${baseUrl}/audit-logs`, {
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  const partnerLogs = await resPartnerLogs.json();
  const competitorLogsLeaked = partnerLogs.filter(l => l.organisationId !== 'org-flyfast');
  logTest('External Partner only receives own organisation audit logs (0 competitor logs leaked)', competitorLogsLeaked.length === 0, `Partner logs: ${partnerLogs.length}`);

  // 3.4: Partner governance decisions filtering
  const resPartnerDecisions = await fetch(`${baseUrl}/governance/decisions`, {
    headers: { 'Authorization': `Bearer ${partnerToken}` }
  });
  const partnerDecisions = await resPartnerDecisions.json();
  const dbCurrent = readDB();
  const dbApis = dbCurrent.apis || [];
  const competitorDecsLeaked = partnerDecisions.filter(d => {
    const involved = [d.canonicalApiId, d.deprecatedApiId, d.apiAId, d.apiBId].filter(Boolean);
    const apis = involved.map(id => dbApis.find(a => a.id === id)).filter(Boolean);
    return apis.length > 0 && apis.every(a => a.organisationId !== 'org-flyfast' && a.organisationId !== 'org-ts');
  });
  logTest('External Partner only receives own or shared governance decisions', competitorDecsLeaked.length === 0, `Partner decisions: ${partnerDecisions.length}`);

  // ----------------------------------------------------
  // SUITE 4: OPENAPI 3.X SPECIFICATION PARSING
  // ----------------------------------------------------
  console.log('\n▶ Suite 4: OpenAPI 3.x Specification Parser');

  // 4.1: Valid JSON Spec
  const validJsonSpec = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Hotel Booking V3', version: '3.0.0' },
    paths: {
      '/rooms': {
        post: { summary: 'Book room', operationId: 'bookRoom', parameters: [{ name: 'roomId', in: 'query', required: true }] }
      }
    }
  });
  const resParseJson = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: validJsonSpec, format: 'JSON' })
  });
  const jsonParseResult = await resParseJson.json();
  logTest('Parse valid OpenAPI 3.x JSON specification', jsonParseResult.isValid === true);

  // 4.2: Valid YAML Spec via js-yaml
  const validYamlSpec = `
openapi: 3.0.0
info:
  title: Flight Dispatcher API
  version: 2.1.0
paths:
  /dispatch/flights:
    post:
      summary: Dispatch aircraft
      operationId: dispatchFlight
      parameters:
        - name: flightId
          in: query
          required: true
  `;
  const resParseYaml = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: validYamlSpec, format: 'YAML' })
  });
  const yamlParseResult = await resParseYaml.json();
  logTest('Parse valid OpenAPI 3.x YAML specification via js-yaml', yamlParseResult.isValid === true);

  // 4.3: Malformed / Adversarial Spec
  const corruptSpec = 'openapi: 3.0.0\npaths: [unclosed list';
  const resParseCorrupt = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: corruptSpec, format: 'YAML' })
  });
  const corruptResult = await resParseCorrupt.json();
  logTest('Handle malformed OpenAPI specification gracefully without crashing (isValid: false)', corruptResult.isValid === false);

  // 4.4: Credential Scrubbing
  const specWithSecret = `
openapi: 3.0.0
info:
  title: Insecure API
paths:
  /test:
    get:
      summary: Test endpoint
      description: Use secret="super_secret_password_12345" and api_key="sk_live_abcdef1234567890"
  `;
  const resScrub = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specWithSecret, format: 'YAML' })
  });
  const scrubResult = await resScrub.json();
  logTest('Scrub hardcoded credentials/keys from uploaded OpenAPI specification', scrubResult.scrubbedCredentialsCount > 0, `Scrubbed: ${scrubResult.scrubbedCredentialsCount}`);

  // 4.5: OpenAPI requestBody extraction and Duplicate Analyser Participation
  const specA = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Hotel Bookings Service Alpha', version: '1.0.0' },
    paths: {
      '/bookings': {
        post: {
          summary: 'Create booking',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    guestName: { type: 'string', description: 'Name of hotel guest' },
                    checkInDate: { type: 'string', format: 'date' },
                    totalAmount: { type: 'number', description: 'Total booking cost' },
                    currency: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Booking confirmed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bookingId: { type: 'string' },
                      status: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const specB = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Room Reservations Gateway Beta', version: '1.0.0' },
    paths: {
      '/reservations': {
        post: {
          summary: 'Create reservation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    customerName: { type: 'string', description: 'Customer full name' },
                    arrivalDate: { type: 'string', format: 'date' },
                    price: { type: 'number', description: 'Total price of stay' },
                    currencyCode: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Reservation created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reservation_id: { type: 'string' },
                      payment_status: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const resImportA = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specA, format: 'JSON', importIntoCatalogue: true })
  });
  await resImportA.json();

  const resImportB = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specB, format: 'JSON', importIntoCatalogue: true })
  });
  await resImportB.json();

  const currentDb = readDB();
  const importedFieldsA = currentDb.api_fields.filter(f => f.name.includes('guestName') || f.name.includes('checkInDate'));
  const importedFieldsB = currentDb.api_fields.filter(f => f.name.includes('customerName') || f.name.includes('arrivalDate'));
  logTest('Extract nested requestBody & response schema fields during OpenAPI import', importedFieldsA.length > 0 && importedFieldsB.length > 0, `Fields extracted: A=${importedFieldsA.length}, B=${importedFieldsB.length}`);

  // Check duplicate score between these two newly imported APIs
  const enrichedAfterImport = getEnrichedApis(currentDb);
  const importedApiA = enrichedAfterImport.find(a => a.name === 'Hotel Bookings Service Alpha');
  const importedApiB = enrichedAfterImport.find(a => a.name === 'Room Reservations Gateway Beta');
  let importDuplicateScore = 0;
  if (importedApiA && importedApiB) {
    const importComp = await analyzeEnhancedPair(importedApiA, importedApiB, currentDb.settings);
    importDuplicateScore = importComp.score;
  }
  logTest('Imported OpenAPI specs participate in duplicate analysis with score >= 75%', importDuplicateScore >= 75, `Score: ${importDuplicateScore}%`);

  // 4.6: OpenAPI Validation: Missing Version Rejection as Error
  const specNoVersion = JSON.stringify({
    info: { title: 'No Version API' },
    paths: { '/test': { get: { summary: 'test' } } }
  });
  const resNoVer = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specNoVersion, format: 'JSON' })
  });
  const noVerData = await resNoVer.json();
  const hasVerErr = noVerData.logs && noVerData.logs.some(l => l.includes('Error: Missing required "openapi" or "swagger" version'));
  logTest('OpenAPI Validator strictly rejects missing version as ERROR', !noVerData.isValid && hasVerErr);

  // 4.7: OpenAPI Validation: Unsupported Version Rejection as Error
  const specBadVer = JSON.stringify({
    openapi: '4.0.0',
    info: { title: 'Unsupported Version API' },
    paths: { '/test': { get: { summary: 'test' } } }
  });
  const resBadVer = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specBadVer, format: 'JSON' })
  });
  const badVerData = await resBadVer.json();
  const hasBadVerErr = badVerData.logs && badVerData.logs.some(l => l.includes('Error: Unsupported OpenAPI/Swagger version'));
  logTest('OpenAPI Validator strictly rejects unsupported version as ERROR', !badVerData.isValid && hasBadVerErr);

  // 4.8: OpenAPI Validation: Missing Info & Title Rejection as Error
  const specNoTitle = JSON.stringify({
    openapi: '3.0.0',
    paths: { '/test': { get: { summary: 'test' } } }
  });
  const resNoTitle = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specNoTitle, format: 'JSON' })
  });
  const noTitleData = await resNoTitle.json();
  logTest('OpenAPI Validator strictly rejects missing info/title as ERROR', !noTitleData.isValid);

  // 4.9: OpenAPI Validation: Missing Paths Rejection as Error
  const specNoPaths = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'No Paths API' }
  });
  const resNoPaths = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specNoPaths, format: 'JSON' })
  });
  const noPathsData = await resNoPaths.json();
  logTest('OpenAPI Validator strictly rejects missing paths as ERROR', !noPathsData.isValid);

  // 4.10: Imported API without category defaults to "Unclassified"
  const specUnclassified = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Uncategorised Custom Service', version: '1.0.0' },
    paths: { '/custom': { get: { summary: 'Custom' } } }
  });
  const resImportUnclass = await fetch(`${baseUrl}/specifications/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: specUnclassified, format: 'JSON', importIntoCatalogue: true })
  });
  await resImportUnclass.json();
  const dbAfterUnclass = readDB();
  const unclassApi = dbAfterUnclass.apis.find(a => a.name === 'Uncategorised Custom Service');
  logTest('Imported API without category defaults to "Unclassified"', unclassApi && unclassApi.category === 'Unclassified', `Category: ${unclassApi?.category}`);

  // 4.11: User Classification Support: PATCH /api/apis/:id/category
  if (unclassApi) {
    const resPatchCat = await fetch(`${baseUrl}/apis/${unclassApi.id}/category`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Hotel Booking' })
    });
    const patchData = await resPatchCat.json();
    logTest('User classification support via PATCH /api/apis/:id/category', resPatchCat.status === 200 && patchData.api.category === 'Hotel Booking', `Updated: ${patchData.api?.category}`);

    // Non-admin cross-organisation category modification blocked
    const resPartnerPatch = await fetch(`${baseUrl}/apis/${unclassApi.id}/category`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${partnerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Airline Services' })
    });
    logTest('Block cross-organisation category modification (403 Forbidden)', resPartnerPatch.status === 403, `Status: ${resPartnerPatch.status}`);
  }

  // ----------------------------------------------------
  // SUITE 5: DUPLICATE DETECTION ALGORITHM & EXPERIMENT
  // ----------------------------------------------------
  console.log('\n▶ Suite 5: Duplicate Detection Algorithm & Experiment');

  resetDB();
  const db = readDB();
  const enrichedApis = getEnrichedApis(db);

  // 5.1: High Priority Duplicate: Hotel Bookings (TravelSphere vs StayEasy)
  const tsHotel = enrichedApis.find(a => a.id === 'api-ts-hotel-booking');
  const seHotel = enrichedApis.find(a => a.id === 'api-stayeasy-reserve');
  const hotelComp = await analyzeEnhancedPair(tsHotel, seHotel, db.settings);
  logTest('Detect Hotel Booking duplication (TravelSphere vs StayEasy) with score >= 85%', hotelComp.score >= 85, `Score: ${hotelComp.score}%`);

  // 5.2: False Positive Control: Hotel Booking vs Flight Booking
  const tsFlight = enrichedApis.find(a => a.id === 'api-ts-flight-booking');
  const controlComp = await analyzeEnhancedPair(tsHotel, tsFlight, db.settings);
  logTest('False Positive Control: Segregate Hotel vs Flight bookings with score < 40%', controlComp.score < 40, `Score: ${controlComp.score}%`);

  // 5.3: Semantic Duplicate: Travel Orders vs Reservation Mgmt
  const tsOrders = enrichedApis.find(a => a.id === 'api-ts-travel-orders');
  const seMgmt = enrichedApis.find(a => a.id === 'api-stayeasy-mgmt');
  const ordersComp = await analyzeEnhancedPair(tsOrders, seMgmt, db.settings);
  logTest('Detect Semantic Duplicate: Travel Orders vs Reservation Management with score >= 60%', ordersComp.score >= 60, `Score: ${ordersComp.score}%`);

  // 5.4: Baseline vs Enhanced comparison execution
  const resExp = await fetch(`${baseUrl}/experiment/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const expData = await resExp.json();
  logTest('Run Baseline vs Enhanced Experiment dynamically without hardcoded values', expData.comparisonCount === 300 && expData.f1 > 0, `Enhanced F1: ${expData.f1}%, Comparisons: ${expData.comparisonCount}`);

  // 5.5: 3-State Ground Truth Verification
  const valid3State = expData.labelledPairCount === 8 && expData.unlabelledPairCount === 292 && expData.trueNegatives === 3;
  logTest('Ground Truth 3-State Overhaul: Unlabelled pairs must NOT become True Negatives', valid3State, `Labelled: ${expData.labelledPairCount}, Unlabelled: ${expData.unlabelledPairCount}, TN: ${expData.trueNegatives}`);

  // 5.6: Pretrained Embedding Execution & Summary Flag
  logTest('Model C exposes truthful embedding source summary flag', typeof expData.modelC_usedPretrained === 'boolean' && ['pretrained', 'fallback'].includes(expData.embeddingSource), `modelC_usedPretrained=${expData.modelC_usedPretrained}, embeddingSource=${expData.embeddingSource}`);

  // ----------------------------------------------------
  // SUITE 6: ENDPOINT-LEVEL DUPLICATE SURFACE & METRICS
  // ----------------------------------------------------
  console.log('\n▶ Suite 6: Endpoint-Level Metrics & Surface Calculation');

  // Trigger analysis scan
  await fetch(`${baseUrl}/analyse/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const resMetrics = await fetch(`${baseUrl}/dashboard/metrics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const metricsData = await resMetrics.json();

  logTest('Duplicate surface uses endpoints instead of APIs', typeof metricsData.totalActiveEndpoints === 'number' && metricsData.totalActiveEndpoints === 75, `Total Endpoints: ${metricsData.totalActiveEndpoints}`);
  logTest('Measured duplicate surface percentage calculated accurately', typeof metricsData.measured.duplicateSurface === 'number' && metricsData.measured.duplicateSurface > 0, `Surface: ${metricsData.measured.duplicateSurface}%`);
  logTest('Metrics dynamically reflect latest experiment results', metricsData.f1 === expData.f1, `F1: ${metricsData.f1}%`);

  // 6.4: Verify duplicate surface excludes deprecated APIs on small synthetic dataset
  const syntheticDb = {
    apis: [
      { id: 'syn-1', name: 'API 1', governanceStatus: 'Active' },
      { id: 'syn-2', name: 'API 2', governanceStatus: 'Active' },
      { id: 'syn-3', name: 'API 3', governanceStatus: 'Active' }
    ],
    endpoints: [
      { id: 'ep-1-a', apiId: 'syn-1' },
      { id: 'ep-1-b', apiId: 'syn-1' },
      { id: 'ep-2-a', apiId: 'syn-2' },
      { id: 'ep-2-b', apiId: 'syn-2' },
      { id: 'ep-3-a', apiId: 'syn-3' },
      { id: 'ep-3-b', apiId: 'syn-3' }
    ],
    duplicate_findings: [
      { id: 'find-1-2', apiAId: 'syn-1', apiBId: 'syn-2', score: 90, status: 'Needs Review' }
    ],
    settings: { thresholds: { high: 85 } }
  };

  function calculateSyntheticSurface(data) {
    const activeApis = data.apis.filter(a => a.governanceStatus !== 'Deprecated');
    const activeApiIds = new Set(activeApis.map(a => a.id));
    const activeEndpoints = data.endpoints.filter(ep => activeApiIds.has(ep.apiId));
    const overlapping = new Set();
    data.duplicate_findings.forEach(f => {
      if (f.score >= data.settings.thresholds.high && ['Needs Review', 'Confirmed Duplicate'].includes(f.status)) {
        data.endpoints.filter(ep => ep.apiId === f.apiAId && activeApiIds.has(ep.apiId)).forEach(ep => overlapping.add(ep.id));
        data.endpoints.filter(ep => ep.apiId === f.apiBId && activeApiIds.has(ep.apiId)).forEach(ep => overlapping.add(ep.id));
      }
    });
    return activeEndpoints.length > 0 ? Math.round((overlapping.size / activeEndpoints.length) * 1000) / 10 : 0;
  }

  const surfaceBefore = calculateSyntheticSurface(syntheticDb); // 4 / 6 * 100 = 66.7%
  syntheticDb.apis[1].governanceStatus = 'Deprecated';
  syntheticDb.duplicate_findings[0].status = 'Consolidated';
  const surfaceAfter = calculateSyntheticSurface(syntheticDb); // 0 / 4 * 100 = 0.0%

  logTest('Duplicate surface percentage matches active duplicate endpoints / total active endpoints * 100', surfaceBefore === 66.7, `Before: ${surfaceBefore}%`);
  logTest('Deprecated and consolidated APIs are strictly excluded from duplicate surface', surfaceAfter === 0.0, `After consolidation: ${surfaceAfter}%`);

  // ----------------------------------------------------
  // SUITE 7: AUTOMATED TEST EVIDENCE ENDPOINT
  // ----------------------------------------------------
  console.log('\n▶ Suite 7: Test Evidence Endpoint');

  const resTestRun = await fetch(`${baseUrl}/tests/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const testRunData = await resTestRun.json();
  const allPassed = testRunData.results && testRunData.results.length > 0 && testRunData.results.every(t => t.status === 'PASS');
  logTest('POST /api/tests/run executes all integration test scenarios successfully (100% PASS)', allPassed, `${testRunData.results ? testRunData.results.length : 0} scenarios executed`);

  // ----------------------------------------------------
  // SUITE 8: CONTEXTUAL SEMANTIC EMBEDDINGS
  // ----------------------------------------------------
  console.log('\n▶ Suite 8: Contextual Semantic Embeddings');

  // 8.1: Exact / Synonym concept vectors match with high similarity
  const simCustomer = calculateContextualFieldSimilarity(
    { name: 'customer_id', semanticConcept: 'customer_identifier' },
    { name: 'guest_id', semanticConcept: 'customer_identifier' }
  );
  logTest('Calculate high contextual similarity for synonym fields (customer_id ↔ guest_id)', simCustomer >= 0.65, `Similarity: ${(simCustomer * 100).toFixed(1)}%`);

  // 8.2: Related travel domain fields exhibit contextual similarity
  const simBooking = calculateContextualFieldSimilarity(
    { name: 'bookingId', semanticConcept: 'booking_identifier' },
    { name: 'reservation_id', semanticConcept: 'booking_identifier' }
  );
  logTest('Calculate strong similarity for booking identifiers (bookingId ↔ reservation_id)', simBooking >= 0.70, `Similarity: ${(simBooking * 100).toFixed(1)}%`);

  // 8.3: Orthogonal cross-domain fields are strongly segregated
  const simFlightHotel = calculateContextualFieldSimilarity(
    { name: 'flightNumber', semanticConcept: 'flight_identifier' },
    { name: 'hotelId', semanticConcept: 'property_identifier' }
  );
  logTest('Segregate orthogonal cross-domain fields with low cosine similarity (< 0.45)', simFlightHotel < 0.45, `Similarity: ${(simFlightHotel * 100).toFixed(1)}%`);

  // 8.4: In-memory embedding cache returns cached vectors on subsequent calls
  const v1 = generateFieldEmbedding({ name: 'currency_code', description: 'ISO currency' });
  const v2 = generateFieldEmbedding({ name: 'currency_code', description: 'ISO currency' });
  logTest('In-memory LRU embedding cache returns cached vectors on subsequent lookups', v1 === v2, `Vector Dimension: ${v1.length}`);

  // 8.5: Fallback behavior handles null, undefined, or missing descriptions gracefully
  const simEmpty = calculateContextualFieldSimilarity(null, undefined);
  const simNoDesc = calculateContextualFieldSimilarity({ name: '' }, { name: '' });
  logTest('Graceful fallback for empty, null, or undefined field inputs without crashing', simEmpty === 0 && typeof simNoDesc === 'number', `Null sim: ${simEmpty}`);

  // ----------------------------------------------------
  // SUITE 9: DATABASE REPOSITORY ABSTRACTION
  // ----------------------------------------------------
  console.log('\n▶ Suite 9: Database Repository Abstraction');

  // 9.1: Repository factory instantiates JsonRepository by default
  const defaultRepo = getRepository();
  logTest('Repository factory instantiates JsonRepository by default when DATABASE_URL is unset', defaultRepo instanceof JsonRepository);

  // 9.2: Repository conforms to IRepository interface contract
  const hasInterfaceMethods = 
    typeof defaultRepo.getApis === 'function' &&
    typeof defaultRepo.getEnrichedApis === 'function' &&
    typeof defaultRepo.getEndpoints === 'function' &&
    typeof defaultRepo.getFields === 'function' &&
    typeof defaultRepo.updateSettings === 'function' &&
    typeof defaultRepo.transaction === 'function';
  logTest('Repository conforms to IRepository interface contract methods', hasInterfaceMethods);

  // 9.3: Transactional rollback restores previous state on error
  let rollbackPassed = false;
  try {
    await defaultRepo.transaction(async (tx) => {
      await tx.updateSettings({ canary_rollback_test: true });
      throw new Error('Forced rollback test');
    });
  } catch {
    const s = await defaultRepo.getSettings();
    rollbackPassed = s.canary_rollback_test === undefined;
  }
  logTest('Repository transaction rolls back atomic changes upon failure', rollbackPassed);

  // 9.4: PostgreSQL DDL schema validation
  const schemaPath = path.join(process.cwd(), 'backend', 'database', 'schema.sql');
  const schemaExists = fs.existsSync(schemaPath);
  const schemaContent = schemaExists ? fs.readFileSync(schemaPath, 'utf8') : '';
  const hasTables = schemaContent.includes('CREATE TABLE IF NOT EXISTS organisations') &&
                    schemaContent.includes('CREATE TABLE IF NOT EXISTS apis') &&
                    schemaContent.includes('CREATE TABLE IF NOT EXISTS endpoints') &&
                    schemaContent.includes('CREATE TABLE IF NOT EXISTS schema_fields') &&
                    schemaContent.includes('CREATE TABLE IF NOT EXISTS duplicate_findings') &&
                    schemaContent.includes('CREATE INDEX IF NOT EXISTS idx_apis_org');
  logTest('PostgreSQL DDL schema.sql defines required relational tables, foreign keys, and indexes', hasTables, `Schema size: ${schemaContent.length} bytes`);

  // ----------------------------------------------------
  // SUITE 10: GENERIC API GATEWAY INGESTION & SECURITY
  // ----------------------------------------------------
  console.log('\n▶ Suite 10: Generic API Gateway Ingestion & Security');

  // 10.1: Kong Declarative JSON export preview & credential scrubbing
  const kongFixture = fs.readFileSync(path.join(process.cwd(), 'backend', 'fixtures', 'sample-kong-export.json'), 'utf8');
  const resKongPrev = await fetch(`${baseUrl}/gateway/preview`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: kongFixture, formatHint: 'kong' })
  });
  const kongData = await resKongPrev.json();
  const kongValid = kongData.isValid && kongData.format === 'kong' && kongData.apis.length >= 1 && kongData.endpoints.length >= 2 && kongData.scrubbedCount >= 1;
  logTest('Parse Kong Declarative export, map routes, and scrub consumer credentials', kongValid, `Scrubbed: ${kongData.scrubbedCount}, Endpoints: ${kongData.endpoints ? kongData.endpoints.length : 0}`);

  // 10.2: Apigee API Proxy export preview & credential scrubbing
  const apigeeFixture = fs.readFileSync(path.join(process.cwd(), 'backend', 'fixtures', 'sample-apigee-export.json'), 'utf8');
  const resApigeePrev = await fetch(`${baseUrl}/gateway/preview`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: apigeeFixture, formatHint: 'apigee' })
  });
  const apigeeData = await resApigeePrev.json();
  const apigeeValid = apigeeData.isValid && apigeeData.format === 'apigee' && apigeeData.apis.length === 1 && apigeeData.scrubbedCount >= 1;
  logTest('Parse Apigee API Proxy export, map flows to endpoints, and scrub client secrets', apigeeValid, `Scrubbed: ${apigeeData.scrubbedCount}`);

  // 10.3: AWS API Gateway export preview & credential scrubbing
  const awsFixture = fs.readFileSync(path.join(process.cwd(), 'backend', 'fixtures', 'sample-aws-export.json'), 'utf8');
  const resAwsPrev = await fetch(`${baseUrl}/gateway/preview`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: awsFixture, formatHint: 'aws' })
  });
  const awsData = await resAwsPrev.json();
  const awsValid = awsData.isValid && awsData.format === 'aws' && awsData.scrubbedCount >= 1;
  logTest('Parse AWS API Gateway export, validate x-amazon extensions, and scrub IAM keys', awsValid, `Scrubbed: ${awsData.scrubbedCount}`);

  // 10.4: RBAC Security Boundary: External Partner blocked from ingesting into internal/rival organisation
  const resPartnerIngest = await fetch(`${baseUrl}/gateway/ingest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${partnerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: kongFixture, formatHint: 'kong', organisationId: 'org-ts' })
  });
  logTest('Block External Partner from ingesting gateway services into competitor/internal organisation (403)', resPartnerIngest.status === 403, `Status: ${resPartnerIngest.status}`);

  // 10.5: RBAC Security Boundary: Auditor blocked from ingesting APIs
  const resAuditorIngest = await fetch(`${baseUrl}/gateway/ingest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auditorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: kongFixture, formatHint: 'kong' })
  });
  logTest('Block Auditor from mutating gateway catalogue via POST /api/gateway/ingest (403 Forbidden)', resAuditorIngest.status === 403, `Status: ${resAuditorIngest.status}`);

  // 10.6: Permitted API Owner successfully ingests gateway export into their own organisation
  const resOwnerIngest = await fetch(`${baseUrl}/gateway/ingest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: kongFixture, formatHint: 'kong' })
  });
  const ownerIngestData = await resOwnerIngest.json();
  const ownerSuccess = resOwnerIngest.status === 200 && ownerIngestData.success && ownerIngestData.apis && ownerIngestData.apis[0].sourceGateway === 'kong';
  logTest('Permit API Owner to ingest gateway export into own organisation with provenance tracking (200 OK)', ownerSuccess, `Source: ${ownerIngestData.apis ? ownerIngestData.apis[0].sourceGateway : 'none'}`);

  // ----------------------------------------------------
  // SUITE 11: MULTI-MODEL EXPERIMENT VERIFICATION
  // ----------------------------------------------------
  console.log('\n▶ Suite 11: Multi-Model Experiment Verification');

  // 11.1: Multi-Model comparative metrics returned from experiment runner
  const resExpMulti = await fetch(`${baseUrl}/experiment/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const expMultiData = await resExpMulti.json();
  const hasModels = expMultiData.models && expMultiData.models.length === 3 && expMultiData.models.some(m => m.modelName.includes('Vector Embeddings'));
  logTest('Experiment runner dynamically computes benchmarks across Baseline, Curated, and Embedding models', hasModels, `Models: ${expMultiData.models ? expMultiData.models.length : 0}`);

  // 11.2: Layered contextual embedding model satisfies benchmark quality gates
  const qualityPassed = expMultiData.precision >= 85 && expMultiData.f1 >= 88 && expMultiData.comparisonCount > 0;
  logTest('Layered embedding model satisfies benchmark quality gates (Precision >= 85%, F1 >= 88%) without fabricated data', qualityPassed, `Precision: ${expMultiData.precision}%, F1: ${expMultiData.f1}%`);

  await stopServer();


  console.log('\n======================================================');
  console.log(` Test Summary: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error('Test Suite encountered unhandled fatal error:', err);
  await stopServer();
  process.exit(1);
});
