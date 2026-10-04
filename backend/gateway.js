import * as yaml from 'js-yaml';
import { CONCEPT_MAP } from './analyser.js';

/**
 * AUTOMATED CREDENTIAL SCRUBBER:
 * 
 * SECURITY DESIGN DECISION:
 * API Gateway configurations (Kong declarative dumps, AWS exports, Apigee bundles) frequently contain
 * embedded administrative keys, consumer JWT bearer tokens, AWS IAM access keys, or client secrets.
 * 
 * To strictly prevent credential leakage into catalog databases, memory dumps, or compliance audit logs,
 * scrubbing is executed as a PRE-PARSE REGEX PIPELINE across the raw payload string BEFORE the object
 * is deserialized into JSON or YAML. Any detected secret is replaced with '***REDACTED_CREDENTIAL***'.
 */
export function scrubCredentials(content) {
  let text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  let scrubbedCount = 0;

  // 1. AWS Access Key ID
  const awsKeyRegex = /(AKIA[0-9A-Z]{16})/g;
  if (awsKeyRegex.test(text)) {
    const matches = text.match(awsKeyRegex) || [];
    scrubbedCount += matches.length;
    text = text.replace(awsKeyRegex, 'AKIA***REDACTED_AWS_KEY***');
  }

  // 2. Bearer tokens
  const bearerRegex = /Bearer\s+([A-Za-z0-9_\-\.]{15,})/g;
  if (bearerRegex.test(text)) {
    const matches = text.match(bearerRegex) || [];
    scrubbedCount += matches.length;
    text = text.replace(bearerRegex, 'Bearer ***REDACTED_TOKEN***');
  }

  // 3. Known credential keys in JSON/YAML (client_secret, api_key, password, keyauth_credentials, etc.)
  const secretKeyRegex = /"(client_secret|clientSecret|consumerSecret|api_key|apiKey|password|secret|keyauth_credentials|credentials)":\s*("(?:(?!REDACTED)[^"\\]|\\.)*"|\[\s*\{\s*"key":\s*"[^"]+"\s*\}\s*\])/gi;
  text = text.replace(secretKeyRegex, (match, key) => {
    scrubbedCount++;
    return `"${key}": "***REDACTED_CREDENTIAL***"`;
  });

  // 4. YAML-style secrets: key: value
  const yamlSecretRegex = /(client_secret|api_key|apiKey|password|secret):\s*([a-zA-Z0-9_\-\.]{8,})/gi;
  text = text.replace(yamlSecretRegex, (match, key) => {
    scrubbedCount++;
    return `${key}: "***REDACTED_CREDENTIAL***"`;
  });

  return { sanitizedText: text, scrubbedCount };
}

/**
 * Auto-detects the format of the provided gateway export.
 */
export function detectGatewayFormat(parsed) {
  if (!parsed || typeof parsed !== 'object') return 'unknown';

  // Kong declarative export
  if (parsed._format_version || parsed.services || (parsed.plugins && Array.isArray(parsed.plugins))) {
    return 'kong';
  }

  // Apigee proxy export
  if (parsed.proxyEndpoints || parsed.targetEndpoints || (parsed.basepaths && Array.isArray(parsed.basepaths))) {
    return 'apigee';
  }

  // AWS API Gateway export (Swagger/OpenAPI with Amazon extensions)
  if (parsed['x-amazon-apigateway-endpoint-configuration'] || 
      parsed['x-amazon-apigateway-gateway-responses'] || 
      JSON.stringify(parsed).includes('x-amazon-apigateway-integration')) {
    return 'aws';
  }

  // Standard OpenAPI
  if (parsed.openapi || parsed.swagger) {
    return 'openapi';
  }

  return 'generic';
}

/**
 * Main Gateway Ingestion Pipeline
 */
export function parseGatewayExport(rawContent, formatHint = 'auto') {
  const logs = [];
  const { sanitizedText, scrubbedCount } = scrubCredentials(rawContent);

  if (scrubbedCount > 0) {
    logs.push(`Credential Scrubber: Detected and sanitized ${scrubbedCount} sensitive credential/token instance(s).`);
  } else {
    logs.push('Credential Scrubber: No exposed credentials or private keys detected.');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(sanitizedText);
    logs.push('Specification successfully parsed as valid JSON.');
  } catch {
    try {
      parsed = yaml.load(sanitizedText);
      if (parsed && typeof parsed === 'object') {
        logs.push('Specification successfully parsed as valid YAML.');
      } else {
        return { isValid: false, logs: [...logs, 'Error: Specification content evaluated to a scalar value instead of an object.'], scrubbedCount };
      }
    } catch (yamlErr) {
      return { isValid: false, logs: [...logs, `Error: Failed to parse specification as JSON or YAML: ${yamlErr.message}`], scrubbedCount };
    }
  }

  const format = formatHint === 'auto' ? detectGatewayFormat(parsed) : formatHint;
  logs.push(`Gateway Ingestion Engine: Identified gateway format as "${format.toUpperCase()}".`);

  switch (format) {
    case 'kong':
      return parseKongExport(parsed, logs, scrubbedCount);
    case 'apigee':
      return parseApigeeExport(parsed, logs, scrubbedCount);
    case 'aws':
      return parseAwsExport(parsed, logs, scrubbedCount);
    case 'openapi':
    default:
      return parseGenericOpenApi(parsed, logs, scrubbedCount, format);
  }
}

/**
 * Kong Declarative Parser
 */
function parseKongExport(parsed, logs, scrubbedCount) {
  const services = parsed.services || [];
  if (services.length === 0) {
    logs.push('Warning: Kong configuration has no defined services. Checking for top-level routes.');
  }

  const apis = [];
  const endpoints = [];
  const fields = [];

  const serviceList = services.length > 0 ? services : [{
    name: 'Kong Default Gateway Service',
    url: 'https://gateway.kong.internal',
    routes: parsed.routes || []
  }];

  for (const svc of serviceList) {
    const apiId = `api-kong-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const svcName = svc.name ? svc.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Kong Gateway API';
    
    // Category heuristic
    let category = 'Unclassified';
    const lowerName = svcName.toLowerCase();
    if (lowerName.includes('hotel') || lowerName.includes('room') || lowerName.includes('stay')) category = 'Hotel Booking';
    else if (lowerName.includes('flight') || lowerName.includes('air')) category = 'Flight Booking';
    else if (lowerName.includes('pay') || lowerName.includes('transact') || lowerName.includes('card')) category = 'Payment Processing';
    else if (lowerName.includes('reserve') || lowerName.includes('book')) category = 'Reservation Management';

    const api = {
      id: apiId,
      name: svcName,
      description: `Ingested from Kong Declarative configuration. Target: ${svc.url || 'Internal Mesh'}`,
      category,
      version: '1.0.0',
      status: 'Active',
      visibility: 'Public',
      gatewayBaseUrl: svc.url ? new URL(svc.url, 'http://localhost').pathname : '/gateway/kong',
      governanceStatus: 'Active',
      sourceType: 'gateway_export',
      sourceGateway: 'kong'
    };
    apis.push(api);

    // Routes -> Endpoints
    const routes = svc.routes || [];
    for (const r of routes) {
      const paths = r.paths || ['/'];
      const methods = r.methods || ['GET'];
      for (const p of paths) {
        for (const m of methods) {
          const epId = `ep-kong-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          endpoints.push({
            id: epId,
            apiId,
            path: p,
            httpMethod: m.toUpperCase(),
            description: `Kong Route: ${r.name || p} (${m.toUpperCase()})`,
            operationId: r.name || `kong_${m.toLowerCase()}_${p.replace(/[^a-zA-Z0-9]/g, '_')}`
          });

          // Inferred Fields from path params (e.g. :id or {id})
          const pathParams = p.match(/[:\{]([a-zA-Z0-9_]+)[\}]?/g) || [];
          for (const param of pathParams) {
            const cleanParam = param.replace(/[:\{\}]/g, '');
            fields.push({
              id: `f-${epId}-${cleanParam}`,
              endpointId: epId,
              name: cleanParam,
              dataType: 'string',
              direction: 'input',
              required: true,
              description: `Path parameter from Kong route: ${p}`,
              semanticConcept: CONCEPT_MAP[cleanParam] || 'custom_identifier'
            });
          }
        }
      }
    }
  }

  logs.push(`Kong Ingestion: Extracted ${apis.length} API(s), ${endpoints.length} endpoint(s), and ${fields.length} field(s).`);
  return {
    isValid: true,
    format: 'kong',
    apis,
    endpoints,
    fields,
    logs,
    scrubbedCount
  };
}

/**
 * Apigee API Proxy Parser
 */
function parseApigeeExport(parsed, logs, scrubbedCount) {
  const apis = [];
  const endpoints = [];
  const fields = [];

  const proxyName = parsed.name ? parsed.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Apigee Proxy API';
  const basepath = (parsed.basepaths && parsed.basepaths[0]) || '/apigee/v1';
  const apiId = `api-apigee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  let category = 'Unclassified';
  const lower = proxyName.toLowerCase();
  if (lower.includes('hotel')) category = 'Hotel Booking';
  else if (lower.includes('flight')) category = 'Flight Booking';
  else if (lower.includes('pay')) category = 'Payment Processing';
  else if (lower.includes('order')) category = 'Travel Orders';

  apis.push({
    id: apiId,
    name: proxyName,
    description: parsed.description || `Ingested Apigee API Proxy (Revision: ${parsed.revision || '1'})`,
    category,
    version: parsed.revision ? `${parsed.revision}.0.0` : '1.0.0',
    status: 'Active',
    visibility: 'Public',
    gatewayBaseUrl: basepath,
    governanceStatus: 'Active',
    sourceType: 'gateway_export',
    sourceGateway: 'apigee'
  });

  const proxyEndpoints = parsed.proxyEndpoints || [{ endpoint: basepath, httpMethods: ['GET'] }];
  for (const pe of proxyEndpoints) {
    const flows = pe.flows || [];
    if (flows.length > 0) {
      for (const flow of flows) {
        const epId = `ep-apigee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        // Extract method and path from condition or default
        const methodMatch = flow.condition ? flow.condition.match(/request\.verb\s*=\s*"([A-Z]+)"/i) : null;
        const pathMatch = flow.condition ? flow.condition.match(/MatchesPath\s*"([^"]+)"/i) : null;
        const httpMethod = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
        const subPath = pathMatch ? pathMatch[1] : '';
        const fullPath = `${basepath}${subPath}`;

        endpoints.push({
          id: epId,
          apiId,
          path: fullPath,
          httpMethod,
          description: flow.description || flow.name || `Apigee Flow ${fullPath}`,
          operationId: flow.name || `flow_${epId}`
        });
      }
    } else {
      const epId = `ep-apigee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      endpoints.push({
        id: epId,
        apiId,
        path: pe.endpoint || basepath,
        httpMethod: (pe.httpMethods && pe.httpMethods[0]) || 'GET',
        description: `Apigee Proxy Endpoint ${pe.name || 'default'}`,
        operationId: `apigee_${pe.name || 'default'}`
      });
    }
  }

  logs.push(`Apigee Ingestion: Extracted 1 API, ${endpoints.length} endpoint(s), and ${fields.length} field(s).`);
  return {
    isValid: true,
    format: 'apigee',
    apis,
    endpoints,
    fields,
    logs,
    scrubbedCount
  };
}

/**
 * AWS API Gateway Parser
 */
function parseAwsExport(parsed, logs, scrubbedCount) {
  const openApiRes = parseGenericOpenApi(parsed, logs, scrubbedCount, 'aws');
  if (openApiRes.apis && openApiRes.apis.length > 0) {
    for (const a of openApiRes.apis) {
      a.sourceType = 'gateway_export';
      a.sourceGateway = 'aws';
      a.description = a.description || 'Ingested from AWS API Gateway REST/HTTP API Export.';
    }
  }
  logs.push(`AWS Gateway Ingestion: Validated AWS API Gateway extensions and parsed ${openApiRes.endpoints.length} endpoint(s).`);
  return {
    ...openApiRes,
    format: 'aws'
  };
}

/**
 * Generic OpenAPI / Swagger Parser
 */
function parseGenericOpenApi(parsed, logs, scrubbedCount, sourceGateway = 'openapi') {
  const version = parsed.openapi || parsed.swagger;
  if (!version || typeof version !== 'string' || version.trim() === '') {
    return {
      isValid: false,
      logs: [...logs, 'Error: Missing required "openapi" or "swagger" version declaration.'],
      scrubbedCount
    };
  }

  const vStr = version.trim();
  const isSupported = vStr.startsWith('3.0') || vStr.startsWith('3.1') || vStr === '2.0' || vStr.startsWith('2.');
  if (!isSupported) {
    return {
      isValid: false,
      logs: [...logs, `Error: Unsupported OpenAPI/Swagger version "${vStr}".`],
      scrubbedCount
    };
  }

  if (!parsed.info || typeof parsed.info !== 'object' || !parsed.info.title) {
    return {
      isValid: false,
      logs: [...logs, 'Error: Specification missing required "info" or "info.title" metadata.'],
      scrubbedCount
    };
  }

  if (!parsed.paths || typeof parsed.paths !== 'object') {
    return {
      isValid: false,
      logs: [...logs, 'Error: Specification missing required "paths" object.'],
      scrubbedCount
    };
  }

  const specTitle = parsed.info.title;
  const apiId = `api-imported-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  let derivedCategory = 'Unclassified';
  if (parsed['x-category'] || (parsed.info && parsed.info['x-category'])) {
    derivedCategory = parsed['x-category'] || parsed.info['x-category'];
  } else if (parsed.tags && Array.isArray(parsed.tags) && parsed.tags.length > 0) {
    const tag = parsed.tags[0];
    derivedCategory = typeof tag === 'string' ? tag : (tag && tag.name ? tag.name : 'Unclassified');
  } else {
    const lower = specTitle.toLowerCase();
    if (lower.includes('hotel')) derivedCategory = 'Hotel Booking';
    else if (lower.includes('flight')) derivedCategory = 'Flight Booking';
    else if (lower.includes('pay') || lower.includes('charge')) derivedCategory = 'Payment Processing';
    else if (lower.includes('order')) derivedCategory = 'Travel Orders';
  }

  const api = {
    id: apiId,
    name: specTitle,
    description: parsed.info.description || `Imported ${sourceGateway.toUpperCase()} specification.`,
    category: derivedCategory,
    version: parsed.info.version || '1.0.0',
    status: 'Active',
    visibility: 'Public',
    gatewayBaseUrl: `/gateway/${specTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    governanceStatus: 'Active',
    sourceType: sourceGateway === 'openapi' ? 'openapi' : 'gateway_export',
    sourceGateway: sourceGateway
  };

  const endpoints = [];
  const fields = [];

  for (const [pathKey, pathItem] of Object.entries(parsed.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const [method, opItem] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const epId = `ep-${apiId}-${Math.floor(Math.random() * 10000)}`;
        endpoints.push({
          id: epId,
          apiId,
          path: pathKey,
          httpMethod: method.toUpperCase(),
          description: opItem.summary || opItem.description || `${method.toUpperCase()} ${pathKey}`,
          operationId: opItem.operationId || `op_${epId}`
        });

        // Parameters
        if (opItem.parameters && Array.isArray(opItem.parameters)) {
          for (const param of opItem.parameters) {
            if (param && param.name) {
              fields.push({
                id: `f-${epId}-in-${param.name}-${fields.length}`,
                endpointId: epId,
                name: param.name,
                dataType: (param.schema && param.schema.type) || 'string',
                direction: 'input',
                required: Boolean(param.required),
                description: param.description || `Parameter: ${param.name}`,
                semanticConcept: CONCEPT_MAP[param.name] || CONCEPT_MAP[param.name.toLowerCase()] || null
              });
            }
          }
        }

        // Request Body Schema properties
        const reqSchema = opItem.requestBody && 
                          opItem.requestBody.content && 
                          opItem.requestBody.content['application/json'] && 
                          opItem.requestBody.content['application/json'].schema;
        if (reqSchema && reqSchema.properties) {
          for (const [fieldName, fieldDef] of Object.entries(reqSchema.properties)) {
            fields.push({
              id: `f-${epId}-in-${fieldName}-${fields.length}`,
              endpointId: epId,
              name: fieldName,
              dataType: fieldDef.type || 'string',
              direction: 'input',
              required: Array.isArray(reqSchema.required) && reqSchema.required.includes(fieldName),
              description: fieldDef.description || `Request body field: ${fieldName}`,
              semanticConcept: CONCEPT_MAP[fieldName] || CONCEPT_MAP[fieldName.toLowerCase()] || null
            });
          }
        }

        // Response Schema properties
        const resp200 = opItem.responses && (opItem.responses['200'] || opItem.responses['201'] || opItem.responses.default);
        const respSchema = resp200 && resp200.content && resp200.content['application/json'] && resp200.content['application/json'].schema;
        if (respSchema && respSchema.properties) {
          for (const [fieldName, fieldDef] of Object.entries(respSchema.properties)) {
            fields.push({
              id: `f-${epId}-out-${fieldName}-${fields.length}`,
              endpointId: epId,
              name: fieldName,
              dataType: fieldDef.type || 'string',
              direction: 'output',
              required: false,
              description: fieldDef.description || `Response property: ${fieldName}`,
              semanticConcept: CONCEPT_MAP[fieldName] || CONCEPT_MAP[fieldName.toLowerCase()] || null
            });
          }
        }
      }
    }
  }

  logs.push(`OpenAPI Validation: Identified ${endpoints.length} endpoint(s) and ${fields.length} schema field(s).`);

  return {
    isValid: true,
    format: sourceGateway,
    apis: [api],
    endpoints,
    fields,
    logs,
    scrubbedCount
  };
}
