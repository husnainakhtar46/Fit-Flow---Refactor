# Future Tasks & Technical Debt

This document tracks agreed-upon future tasks, deferred decisions, and known technical debt.

## 1. Formal Approval & Signature Steps
*   **Current State**: Inspection records and Style Cycle comments can be set to "Approved" or "Accepted" by any user with edit permissions, with no permanent signature or formal approval audit log.
*   **Future Task**: Implement a formal approval step. This might involve an `approved_by` (FK to User), `approved_at` (timestamp), and potentially an immutable digital signature or snapshot of the record at the time of approval.

## 2. CSRF Handling & Token Storage
*   **Current State**: JWT tokens (`access_token`, `refresh_token`) are stored in `localStorage` in the frontend (Next.js). This makes the application vulnerable to Cross-Site Scripting (XSS) attacks. Because the backend is a stateless DRF API expecting a Bearer token, Django's default CSRF middleware is bypassed.
*   **Future Task**: Transition to `HttpOnly` and `Secure` cookies for token storage to mitigate XSS. Once tokens are in cookies, implement robust CSRF protection (e.g., passing a CSRF token in headers for mutations) on both the Next.js and Django sides.

## 3. Factory Field Normalization (Foreign Keys)
*   **Current State**: In the `Inspection` and `FinalInspection` models, the `factory` (and `supplier`) fields are currently `CharField`s (free text input).
*   **Future Task**: Evaluate whether to convert these text fields into `ForeignKey` relations pointing to the `Factory` model. 
    *   **Why does this matter?** Using a `CharField` means a user can type "Factory A" or "Fctry A" resulting in fragmented data. Using a `ForeignKey` ensures strict referential integrity (the factory must exist in the database) and allows for accurate filtering, reporting, and cascading updates if a factory's name changes. The trade-off is that it requires a data migration to map existing text strings to actual `Factory` database IDs.
