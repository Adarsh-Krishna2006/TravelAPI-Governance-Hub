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

This Governance Hub maps these overlapping surfaces, calculates similarity indexes (0-100), offers side-by-side spec field mapping comparisons, tracks precision/recall data, and allows administrators to deprecate duplicates or establish formal legacy integration mappings.

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
   - Monitors the updated **Duplicate Surface Metrics** down to the target rate on the Dashboard.

---

## 5. Automated Tests & Security Verification

The platform includes a test runner covering 37 automated assertions across 7 security and algorithm suites:
1. **Authentication Suite**: Enforces HTTP 401 on missing, malformed, invalid, or expired JWT tokens with zero silent demo fallbacks. Validates that `JWT_SECRET` is strictly enforced in production.
2. **RBAC & Mutation Security**: Restricts database resets, consolidation, formal governance, test runner (`POST /api/tests/run`), and benchmark experiment (`POST /api/experiment/run`) to Admin (HTTP 403 for API Owner, External Partner, and Auditor). Provides authenticated read-only access for Auditor on `/api/tests/results` and `/api/experiment/results`.
3. **Multi-Organisation Isolation**: Quarantines rival partner private specifications and findings from External Partner sessions. Partitions audit logs and governance decisions so External Partners only see their own records.
4. **OpenAPI 3.x Parser**: Validates JSON and YAML specifications via `js-yaml`, handles adversarial/malformed payloads safely, and scrubs hardcoded credentials. Recursively extracts nested `requestBody` and response schema properties with circular reference protection (depth $\le 5$), enabling imported specs to participate directly in duplicate analysis.
5. **Duplicate Detection & Semantics**: Verifies $\ge 85\%$ detection for confirmed duplicates, $< 40\%$ for false positive controls, and $\ge 60\%$ for semantic synonyms. Benchmarks dynamic baseline vs enhanced algorithm metrics without hardcoded numbers.
6. **Endpoint-Level Duplicate Surface**: Calculates measured duplication percentage over active endpoints ($N=75$) rather than gross API counts. Formally verifies deprecation exclusion using a controlled synthetic dataset.
7. **Adversarial & Edge Cases**: Validates zero-parameter inputs, schema bombs, and corrupt payloads without uncaught server exceptions.

### Running Automated Tests
```bash
npm test
```
Or directly via Node:
```bash
node backend/tests.js
```

---

## 6. Live Deployment

* **Render Production URL**: [https://travelapi-governance-hub.onrender.com/](https://travelapi-governance-hub.onrender.com/)
* **Default Admin Demo User**: `admin@travelsphere.demo` (Switch roles via Demo Role Switcher bar)

---

## 7. Seed Data & Methodology

* **Seeding Scale**: The default seed contains **25 APIs and 75 endpoints** spanning 4 organisations (TravelSphere, StayEasy Hotels, GlobalHotels, FlyFast Airlines, and PayLink Payments).
* **Ground Truth Reviewing**: Real ground-truth pairs are evaluated dynamically to calculate True Positives, False Positives, False Negatives, True Negatives, Precision, Recall, and F1 scores with zero invented numbers.
* **Schema Flattening**: Nested properties are extracted and flattened with dotted notation (e.g., `guest.address.city`) up to 5 levels deep.
* **Surface Formula**:
  $$\text{Duplicate Surface \%} = \frac{\text{Active Duplicate Endpoints}}{\text{Total Active Endpoints}} \times 100$$
  Endpoints belonging to deprecated or consolidated APIs are strictly excluded from the active endpoint pool.
