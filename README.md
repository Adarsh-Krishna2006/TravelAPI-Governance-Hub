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

### Steps to Run

1. **Extract & Initialize Projects**:
   In the root directory of the workspace, run the concurrent installer:
   ```bash
   npm run install:all
   ```
   This will install all root dev tools (`concurrently`), followed by frontend and backend package dependencies.

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
   - Inspects the active **API Catalogue**.
   - Uploads a new partner specification (**StayEasy Room Reserve** duplicate spec).
   - Triggers the **Catalogue Duplicate Scan**.
   - Reviews the **Side-by-Side Comparison** and highlights semantic field connections.
   - Submits a **Consolidation Justification** to deprecate StayEasy and redirect routes.
   - Monitors the updated **Duplicate Surface Metrics** down to the target 15% rate on the Dashboard.

---

## 5. Automated Edge Cases & Adversarial Verification

The platform contains a dedicated **Edge Case Tests** page running the following suites:
1. **Similar Name, Different Function**: Checks if `/booking-payment` vs `/booking-history` are marked as **Not Duplicate** due to differing category metrics.
2. **Different Names, Same Function**: Verifies if `/reservations` vs `/travel-orders` are flagged as **Potential/High Priority** based on semantic mapping.
3. **Incomplete Specification**: Checks warnings generation when uploading APIs missing ownership and parameters.
4. **Malicious/Adversarial Spec**: Uploads oversized payloads, corrupted JSON structures, and checks that server interceptors reject payloads without crashing.
5. **Access Control Failure**: Verifies that External Partners cannot read sensitive private schemas owned by rival networks.

---

## 6. Experiment Methodology & Known Limitations

* **Seeding Scale**: Seeds 22 original travel endpoints mapping across internal services, FlyFast, StayEasy, GlobalHotels, and SecurePay networks.
* **Ground Truth Reviewing**: Reviewer overrides (Confirmed Duplicate vs False Positive) are stored as the ground truth array to compute analytical Precision and Recall coefficients dynamically.
* **Limitations**: Field parsing matches JSON objects up to 3 tiers of nesting. Recursive structures are truncated during evaluation.
* **Future Work**: Integration of LLM semantic classifiers to map descriptions, and auto-generation of redirect router adapters for consolidated routes.
