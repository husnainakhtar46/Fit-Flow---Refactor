# Future Tasks & Product Roadmap

This document tracks agreed-upon technical debt, deferred structural decisions, and recommended product features to build next for the Fit-Flow QMS.

---

## Part 1: Technical Debt & Security

### 1. Formal Approval & Signature Steps
*   **Current State**: Inspection records and Style Cycle comments can be set to "Approved" or "Accepted" by any user with edit permissions, with no permanent signature or formal approval audit log.
*   **Future Task**: Implement a formal approval step. This might involve an `approved_by` (FK to User), `approved_at` (timestamp), and potentially an immutable digital signature or snapshot of the record at the time of approval.

### 2. CSRF Handling & Token Storage
*   **Current State**: JWT tokens (`access_token`, `refresh_token`) are stored in `localStorage` in the frontend (Next.js). This exposes the application to Cross-Site Scripting (XSS) attacks. Because the backend is a stateless DRF API expecting a Bearer token, Django's default CSRF middleware is bypassed.
*   **Future Task**: Transition to `HttpOnly` and `Secure` cookies for token storage to mitigate XSS. Once tokens are in cookies, implement robust CSRF protection (e.g., passing a CSRF token in headers for mutations) on both the Next.js and Django sides.

### 3. Unified Measurement Architecture (`spec` vs `std`)
*   **Current State**: Sample Evaluation uses `Measurement` (`std`, `tol`), while Final Inspection uses `FinalInspectionMeasurement` (`spec`, `tol`). Serializers and frontend forms have translation code to normalize them.
*   **Future Task**: Consolidate into a unified measurement schema with consistent field naming (`std` or `spec`) across both evaluation and final inspection modules.

---

## Part 2: Recommended Product Features

Based on industry standards for apparel Quality Management Systems, here are high-impact features to consider adding:

### 1. Supplier & Factory Scorecards
*   **Concept**: Since factories are now properly linked as foreign keys, build an analytics dashboard that automatically grades factories based on their AQL pass/fail ratios, average defect density, and on-time shipment rates.
*   **Value**: Helps merchandisers decide which factories to allocate future POs to based on real historical quality data.

### 2. CAPA (Corrective and Preventive Action) Module
*   **Concept**: When a Final Inspection fails the AQL standard, automatically trigger a formal CAPA workflow. The factory must submit a root-cause analysis (e.g., "Why were there 15 critical sewing defects?") and an action plan, which the `quality_head` then approves.
*   **Value**: Moves the QMS from just *reporting* bad quality to actively *fixing* underlying factory processes.

### 3. Image Annotation for Defects
*   **Concept**: When a QA uploads a defect photo on their tablet/phone, allow them to draw arrows or circles directly on the image in the browser before saving it.
*   **Value**: Eliminates confusion for factories trying to spot exactly where a 2mm stitching defect is on a wide-angle photo.

### 4. Barcode / QR Code Scanning
*   **Concept**: Use the device camera in the Next.js PWA to scan PO numbers, Style tags, or Carton labels. 
*   **Value**: Drastically speeds up data entry on the factory floor. Instead of typing a 12-digit PO number, the QA scans a carton, and the app instantly loads the correct AQL limits and template.

### 5. Web Push Notifications for Offline Sync
*   **Concept**: Because QAs work offline via Dexie.js, they often upload batches of inspections when they return to a Wi-Fi zone. Use Web Push API to notify them when background syncing is 100% complete, or alert Merchandisers instantly when a sample is rejected.
*   **Value**: Improves the offline-to-online transition experience and tightens the feedback loop between QA and Merchandisers.
