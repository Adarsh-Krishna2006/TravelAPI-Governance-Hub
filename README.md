# TravelAPI Governance Hub

### API Catalogue & Duplication Overlap Analyser for a Multi-Organisation Travel Platform

---

## 1. Project Overview & Problem Statement

**TravelAPI Governance Hub** is an end-to-end prototype designed for **TravelSphere**, a fictional travel aggregator platform. TravelSphere integrates internal APIs and external partner services (e.g. airlines, hotels, digital payments).

### The Core Business Problem
As TravelSphere scales, different departments and external partners build overlapping or duplicate API services. However, these services:
* Use inconsistent endpoint pathways (e.g., `/bookings` vs `/reservations` vs `/hotel-booking`).
* Use inconsistent schemas and field names (e.g., `customerId` vs `guest_id` vs `client_id`).
* Lack unified ownership records, leading to multiple organizations exposing duplicate hotel inventory or digital payment gateways.

This Governance Hub maps these overlapping surfaces, calculates multi-signal similarity scores (0-100), offers explainable side-by-side field relationship mappings, and presents duplicate candidates for human review. The platform enforces a strict five-stage governance lifecycle:

$$\text{Automated Detection} \longrightarrow \text{Explainable Evidence} \longrightarrow \text{Human Review} \longrightarrow \text{Governance Decision} \longrightarrow \text{Consolidation / Exemption}$$

The automated duplicate analyser produces recommendations and candidates only; all final lifecycle actions (deprecating endpoints, re-routing traffic, or issuing contractual exemptions) strictly require authorized human approval.


---

## 2. Architecture & Duplication Analysis Logic

```
   [React TypeScript Client] <---- proxy: /api ----> [Node Express Server]
               |                                              |
     (Tailwind UI / Recharts)                        (Analytic Scanners)
                                                              |
                                                      [db.json Database]
```

### Similarity Score Model
The Duplication Analyser computes weighted score signals (0-100) between any two catalogued APIs:
* **Route Path Similarity (20%)**: Tokenizes path parameters, ignores standard API versioning strings, and evaluates path segments.
* **HTTP Method Matching (10%)**: Compares operational matching (POST vs GET).
* **Service Category Matching (20%)**: Higher weights if they represent matching functions (e.g. hotel room reserves vs booking management).
* **Field Name overlap (20%)**: Uses segment normalizations (stripping camelCase, snake_case) and an expanded **Travel Domain Synonym Map** (mapping `customer` $\leftrightarrow$ `guest`, `amount` $\leftrightarrow$ `price`, etc.).
* **Field Semantics (25%)**: Tokenizes field descriptions, strips boilerplate terms, and executes keyword Jaccard overlap tests.
* **Response Structure (5%)**: Evaluates schema structure returned by endpoints.

### Risk Threshold Labels
* **85-100**: HIGH PRIORITY DUPLICATE
* **65-84**: POTENTIAL DUPLICATE
* **40-64**: POSSIBLE OVERLAP
* **0-39**: NOT DUPLICATE

> **Weight & Threshold Calibration Justification**:
> The 6 signal weights (Path: 20%, Method: 10%, Category: 20%, Field Names: 20%, Semantics: 25%, Response: 5%) and cutoffs (85/65/40) were empirically calibrated against the ground-truth benchmark suite. In travel APIs, disparate vendors model identical workflows using divergent vocabulary (e.g., `guest` vs `customer`, `/reservations` vs `/bookings`). Allocating 45% of total score mass to semantic concepts (25%) and synonym-normalized field schemas (20%) ensures cross-org duplicates clear the 85-point threshold even when route naming conventions differ. HTTP method (10%) and response structure (5%) provide orthogonal disambiguation—preventing `GET /hotels` from conflating with `POST /reservations`—without drowning out structural overlap. The 85-point cutoff ensures near-zero false positive consolidations, while the 65-point threshold captures candidate duplicates for human governance review.


---

## 3. Installation & Run Guidelines

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
* **`JWT_SECRET`**: Required in production (`NODE_ENV=production`). The backend will fail safely at startup if missing.
* **`PORT`**: Default 5000 for backend Express server.
* **`FRONTEND_URL`**: Optional CORS origin restriction for production.

### Steps to Run

1. **Extract & Initialize Projects**:
   In the root directory of the workspace, run the concurrent installer:
   ```bash
   npm run install:all
   ```
   This will install dev tools followed by frontend and backend package dependencies.

2. **Boot Development Server**:
   Start both the Express backend server (port 5000) and the Vite dev server (port 5173) concurrently:
   ```bash
   npm run dev
   ```

3. **Open Portal UI**:
   Navigate in your browser to:
   ```url
   http://localhost:5173
   ```
   *(Requests to `/api/*` are proxied transparently to port 5000).*

---

## 4. Usability Guided Walkthrough Demo

To demonstrate the full-stack prototype in a structured review:
1. Log in to the application.
2. Click the **"Guided Demo Tour"** button at the bottom left.
3. The popup tutorial will guide you step-by-step:
   - Switches role credentials to **Admin**.
   - Inspects the active **API Catalogue** (25 APIs, 75 endpoints).
   - Uploads a new partner specification (**StayEasy Room Reserve** duplicate spec with nested body schema).
   - Triggers the **Catalogue Duplicate Scan**.
   - Reviews the **Side-by-Side Comparison** and highlights semantic field connections.
   - Submits a **Consolidation Justification** to deprecate StayEasy and redirect routes.
   - Monitors the updated **Duplicate Surface Metrics** before and after governance actions on the Dashboard.

---

## 5. Automated Tests & Security Verification

The platform includes a comprehensive test runner covering **53 automated assertions** across 7 test suites, plus **11 live HTTP integration test scenarios** executed by the backend test runner:
1. **Authentication Suite (6 tests)**: Enforces HTTP 401 on missing, malformed, invalid, or expired JWT tokens with zero silent demo fallbacks. Validates that `JWT_SECRET` is strictly required in production mode.
2. **RBAC & Mutation Security (13 tests)**: Restricts database resets, consolidation, formal governance, test runner (`POST /api/tests/run`), and benchmark experiment (`POST /api/experiment/run`) to Admin (HTTP 403 for API Owner, External Partner, and Auditor). Restricts `/api/analyse/run` to Admin (global) and API Owner (own organisation only). Restricts `/api/analyse/review/:id` to Admin and API Owner (own organisation only; cross-org and Partner/Auditor receive HTTP 403). Provides authenticated read-only access for Auditor on `/api/tests/results` and `/api/experiment/results`.
3. **Multi-Organisation Isolation (4 tests)**: Quarantines rival partner private specifications and findings from External Partner sessions. Partitions audit logs and governance decisions so External Partners only see their own records.
4. **OpenAPI 3.x Parser & Category Classification (13 tests)**: Validates JSON and YAML specifications via `js-yaml`, handles adversarial/malformed payloads safely, and scrubs hardcoded credentials. Strictly rejects missing version, unsupported versions, missing info/title, and missing paths as hard errors (`isValid: false`). Automatically derives category from metadata/tags or defaults to `"Unclassified"`. Provides user classification support via `PATCH /api/apis/:id/category` with cross-organisation mutation prevention. Recursively extracts nested `requestBody` and response schema properties with circular reference protection (depth $\le 5$), enabling imported specs to participate directly in duplicate analysis.
5. **Duplicate Detection & 3-State Ground Truth (5 tests)**: Verifies $\ge 85\%$ detection for confirmed duplicates, $< 40\%$ for false positive controls, and $\ge 60\%$ for semantic synonyms. Implements explicit 3-state ground truth (`DUPLICATE`, `NOT_DUPLICATE`, `UNLABELLED`) where unlabelled pairs are strictly excluded from the confusion matrix (never inflated into True Negatives). Returns `labelledPairCount` and `unlabelledPairCount`.
6. **Endpoint-Level Duplicate Surface (5 tests)**: Calculates measured duplication percentage over active endpoints rather than gross API counts. Formally verifies deprecation exclusion using a controlled synthetic dataset.
7. **Automated Test Evidence Endpoint (1 test / 11 scenarios)**: `POST /api/tests/run` dispatches genuine local HTTP requests verifying missing JWT (401), invalid JWT (401), competitor API isolation (200, 0 leaked), competitor finding redaction (200, 0 leaked), competitor governance isolation (200, 0 leaked), auditor mutation attempt (403), API owner cross-org mutation attempt (403), strict OpenAPI validation errors, domain segregation, semantic matching, and corrupt YAML safety with a 100% pass rate.

### Running Automated Tests
```bash
npm test
```
Or directly via Node:
```bash
node backend/tests.js
```

---

## 6. Authentication & Role-Based Access Control (RBAC)

The platform implements **demo authentication and RBAC** powered by cryptographically signed JSON Web Tokens (`jsonwebtoken`):
* **Authentication Flow**: Users authenticate via the interactive Demo Role Switcher bar, which issues genuine signed JWTs bearing the user's ID, name, role, and organisation ID.
* **Strict Token Enforcement**: Backend middleware rejects missing, malformed, forged, or expired tokens with HTTP 401 Unauthorized.
* **Production Security**: In production mode (`NODE_ENV=production`), `JWT_SECRET` must be set via environment variables, or the server will fail safely at startup.

### Role Permissions Matrix

| Role | Target Persona | Scope & Allowed Capabilities | Enforced Restrictions (HTTP 403) |
| :--- | :--- | :--- | :--- |
| **Admin** | `Alice Admin` | Full global authority: global duplicate scans, full demo runner, database reset, consolidation, formal governance, test runner execution, and experiment runs. | None. |
| **API Owner** | `Bob Owner` | Organisation-scoped access: manage own APIs, trigger organisation-scoped scans, and review duplicate findings involving own organisation. | Blocked from cross-org mutations, competitor reviews, database reset, test runner execution, and formal consolidation. |
| **External Partner** | `Charlie Partner` (FlyFast) | Quarantined partner access: view own partner APIs and public TravelSphere gateways; view own-org audit logs and governance decisions. | Competitor private APIs (*GlobalHotels, StayEasy, PayLink, SecurePay*), competitor duplicate findings, and rival governance records are strictly redacted (0 leaked). Blocked from all administrative and mutation actions. |
| **Auditor** | `Diana Auditor` | Compliance read-only access: view audit logs, governance decisions, test runner execution evidence (`GET /api/tests/results`), and experiment benchmarks (`GET /api/experiment/results`). | Strictly blocked from all mutations: creating APIs, updating categories, reviewing duplicates, running scans, triggering test execution, or executing consolidations. |

---

## 7. Experiment & Evaluation Methodology

The platform features an automated **Experiment Engine** comparing the baseline approach against the enhanced multi-signal model:

* **Baseline Analyser**:
  - Evaluates normalized route path, HTTP method, and exact field-name overlap.
  - Does **not** include semantic concept mappings, domain synonym lookups, or category compatibility.
  - Formula: $\text{Score} = (0.40 \times \text{Route} + 0.40 \times \text{Exact Fields} + 0.20 \times \text{Method}) \times 100$.
* **Enhanced Analyser**:
  - Incorporates all 6 weighted signals: Route (20%), Method (10%), Category (20%), Field Names (20%), Semantics (25%), and Response Structure (5%).
  - Utilizes canonical travel domain synonym groups and relationship classifications (*Exact*, *Strong*, *Contextual*).
* **3-State Ground Truth Isolation**:
  - Ground truth is evaluated across 3 explicit states: `DUPLICATE`, `NOT_DUPLICATE`, and `UNLABELLED`.
  - The benchmark suite contains **8 labelled ground-truth pairs** (5 confirmed duplicate pairs, 3 negative control pairs).
  - Out of the 300 total pairwise comparisons across the 25 catalogued APIs, the remaining **292 unlabelled pairs are strictly excluded from the confusion matrix**, ensuring they are never falsely inflated into True Negatives.
  - Evaluates True Positives (TP), False Positives (FP), False Negatives (FN), True Negatives (TN), Precision, Recall, F1-score, execution time, and duplicate surface.

---

## 8. Database Seed Counts & Surface Metrics

* **Exact Seed Data Counts (Verified from Code & Database)**:
  - **API Count**: 25 APIs spanning 6 organisations (*TravelSphere Internal, FlyFast Airlines, GlobalHotels, StayEasy, PayLink, SecurePay*).
  - **Endpoint Count**: 75 endpoints mapped across the 25 APIs (3 endpoints per API).
  - **Field Count**: 69 schema fields with semantic concept classifications and direction mappings in `DEFAULT_FIELDS` / `db.api_fields`.
  - **Organisations**: 6 active organisations (`org-ts`, `org-flyfast`, `org-globalhotels`, `org-stayeasy`, `org-paylink`, `org-securepay`).
  - **User Personas**: 4 default users covering all 4 platform roles.
  - **Test Count**: 53 automated unit/integration test assertions across 7 test suites + 11 live HTTP integration test scenarios.
* **Endpoint-Level Duplicate Surface Formula**:
  $$\text{Duplicate Surface \%} = \left( \frac{\text{Active Overlapping API Endpoints}}{\text{Total Active API Endpoints}} \right) \times 100$$
  - **Active Endpoints**: Endpoints belonging to non-deprecated APIs. Endpoints belonging to deprecated or consolidated APIs are strictly excluded from both the numerator and denominator.
  - **Active Overlapping Endpoints**: Distinct active endpoints participating in high-priority duplicate pairs (score $\ge 85$) that remain unresolved (`Needs Review` or `Confirmed Duplicate`).
* **OpenAPI 3.x Support**:
  - Supports OpenAPI 3.0 JSON and YAML specification parsing via `js-yaml`.
  - Performs structural validation, rejecting missing versions, unsupported versions, missing info/title, and missing paths as explicit errors (`isValid: false`).
  - Automatically derives service category from tags/summary or assigns default `"Unclassified"`.
  - Recursively extracts nested `requestBody` and response properties (up to depth $\le 5$) with dotted naming conventions (e.g., `guest.address.city`).
  - Automatically scrubs hardcoded secrets, bearer tokens, and credentials (`***REDACTED_CREDENTIAL***`).

---

## 9. Live Deployment

* **Render Production URL**: [https://travelapi-governance-hub.onrender.com/](https://travelapi-governance-hub.onrender.com/)
* **Default Admin Demo User**: `admin@travelsphere.demo` (Switch roles via Demo Role Switcher bar)
