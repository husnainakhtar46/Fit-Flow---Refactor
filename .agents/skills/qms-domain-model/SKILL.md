---
name: qms-domain-model
description: >-
  Complete QMS domain entity reference for Fit-Flow, derived from actual Django models.
  Documents every entity, its workflow states, relationships, write rules, and
  what is confirmed vs what is unknown. Use this skill whenever designing features
  touching quality records, statuses, approvals, or lifecycle transitions.
---

# Fit-Flow QMS Domain Model

All entities below are derived from the actual models in `backend/qc/models/`. Where something is ambiguous or missing, it is explicitly flagged — do not invent defaults for flagged items.

---

## Entity Map Overview

```
Customer ─────────────────────────────┐
  └── CustomerEmail (TO/CC)           │
  └── Template (POM master)           │
       └── TemplatePOM                │
  └── StyleMaster ───────────────────►│
       └── SampleComment             │
            └── SampleCommentImage   │
       └── StyleLink                 │
  └── Inspection (Sample Eval) ──────►│
       └── Measurement               │
            └── MeasurementSample    │
       └── InspectionImage           │
  └── FinalInspection ───────────────►│
       └── FinalInspectionDefect     │
       └── FinalInspectionSizeCheck  │
       └── FinalInspectionMeasurement│
            └── FinalInspectionMeasurementSample
       └── FinalInspectionImage      │

Factory ──────────────────────────────┘
  └── StyleMaster (optional FK)

User ──► UserProfile (user_type)
      └── OTPVerification
      └── FilterPreset

EmailOutbox (outgoing email log)
```

---

## 1. User & Role Entities

### `UserProfile`
- Linked 1:1 to Django `User` via `post_save` signal (auto-created).
- `user_type` choices: `'qa'`, `'quality_head'`, `'quality_supervisor'`, `'merchandiser'`.
- Superuser bypasses all role checks (treated as `'admin'`).
- **No versioning, no approval workflow.**

### `OTPVerification`
- Temporary record for password reset OTPs.
- Fields: `user`, `otp_code` (6-digit), `created_at`, `expires_at`, `is_used`.
- Lifecycle: Created on reset request → `is_used=True` on successful verify.
- **Hard-deleted** after use (no soft-delete). ⚠️ See audit gap below.

---

## 2. Master Data Entities

### `Customer`
- UUID PK. Fields: `name`, `created_at`, `created_by`.
- No workflow states. No soft-delete. **Hard-deleted.**
- Related: `CustomerEmail` (TO/CC), `Template`, `Inspection`, `FinalInspection`, `StyleMaster`.

### `CustomerEmail`
- Belongs to `Customer`. Fields: `contact_name`, `email`, `email_type` (`'to'` / `'cc'`).
- On update: entire email list is deleted and recreated (delete-and-recreate pattern).

### `Factory`
- UUID PK. Fields: `name` (unique), `address`, `contact_person`, `created_at`, `updated_at`.
- No workflow states. No soft-delete. **Hard-deleted.**

### `Template` / `TemplatePOM`
- `Template`: UUID PK, belongs to optional `Customer`. Fields: `name` (unique), `description`, `created_at`, `created_by`.
- `TemplatePOM`: ordered list of Point of Measure rows with `default_tol`, `default_std`.
- No workflow states. On update: POMs are deleted and recreated.

### `FilterPreset`
- Per-user saved filter configurations (JSON). No workflow states.

---

## 3. Sample Evaluation (`Inspection`)

**The primary "QA inspection record"** for garment samples at various development stages.

### Key Fields
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `style`, `color`, `po_number`, `factory` | CharField | Free-text identifiers |
| `stage` | CharField (choices) | See workflow below |
| `template` | FK → Template | SET_NULL |
| `customer` | FK → Customer | SET_NULL |
| `decision` | CharField (choices) | QA internal verdict |
| `customer_decision` | CharField (choices) | Customer's verdict |
| `is_draft` | BooleanField | True = incomplete, not finalized |
| `created_by` | FK → User | SET_NULL, stamped on create |
| `created_at`, `updated_at` | DateTimeField | Auto-set |

### Stage Choices (Garment Development Lifecycle)
`Dev` → `Proto` → `Fit` → `SMS` → `Size Set` → `PPS` → `Shipment Sample`

> ⚠️ **No enforced state machine** — any stage value can be set at any time via the API. There is no transition guard preventing backward movement (e.g., SMS → Proto). Ask whether guards should be added before implementing them.

### QA Decision Choices (`decision`)
`Accepted` | `Rejected` | `Represent`

### Customer Decision Choices (`customer_decision`)
`Accepted` | `Rejected` | `Revision Requested` | `Accepted with Comments` | `Held Internally`

### Draft vs Finalized
- `is_draft=True`: Excluded from the main `list` endpoint. Accessible via `/inspections/drafts/` (own drafts only).
- `is_draft=False`: Published — visible to all authenticated users.
- No explicit "finalize" action endpoint — the client sets `is_draft=False` on update.

### PDF & Email
- PDF: `GET /inspections/{pk}/pdf/` — rejected for drafts.
- Email: `POST /inspections/{pk}/send_email/` — rejected for drafts.

### Children (CASCADE on delete)
- `Measurement` → `MeasurementSample` (dynamic POM grid rows with per-sample values)
- `InspectionImage` (inspection photos with captions)

### Soft Delete?
**No.** `Inspection` records are hard-deleted when `DELETE /inspections/{pk}/` is called. There is no `is_deleted` / `deleted_at` field. ⚠️ Flagged as audit gap — see `audit-trail-requirements` skill.

---

## 4. Final Inspection (`FinalInspection`)

**Shipment audit record** based on ISO 2859-1 AQL standards.

### Key Fields
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `customer` | FK → Customer | SET_NULL |
| `order_no`, `style_no`, `color` | CharField | Order identifiers |
| `supplier`, `factory` | CharField | Free-text |
| `inspection_date` | DateField | Required |
| `inspection_attempt` | CharField | `'1st'`, `'2nd'`, `'3rd'` |
| `aql_standard` | CharField | `'strict'` (0/1.5/2.5) or `'standard'` (0/2.5/4.0) |
| `sample_size` | PositiveIntegerField | Auto-calculated from `presented_qty` |
| `critical_found`, `major_found`, `minor_found` | PositiveIntegerField | Defect counts |
| `max_allowed_critical/major/minor` | PositiveIntegerField | Calculated on save |
| `result` | CharField | `'Pending'` / `'Pass'` / `'Fail'` |
| `is_draft` | BooleanField | Same draft/finalized semantics as `Inspection` |
| `created_by` | FK → User | SET_NULL |

### Auto-Calculated on `save()`
1. `aql_standard` sets `aql_critical / aql_major / aql_minor` values.
2. `sample_size` is calculated from `presented_qty` (or `total_order_qty`) via `calculate_sample_size()`.
3. `max_allowed_*` are looked up from the AQL table via `get_aql_limits()`.
4. `result` is determined by comparing `*_found` vs `max_allowed_*`.

### Defect Totals — Auto-Aggregated
`FinalInspectionDefect.save()` and `.delete()` both call `_update_parent_totals()` inside a `transaction.atomic()` block to keep `critical_found`, `major_found`, `minor_found` consistent.

### Children (CASCADE on delete)
- `FinalInspectionDefect` (severity: Critical/Major/Minor, with optional photo)
- `FinalInspectionSizeCheck` (color/size quantity matrix)
- `FinalInspectionMeasurement` → `FinalInspectionMeasurementSample`
- `FinalInspectionImage` (categorised: Packaging, Labeling, Defect, General, Measurement, On-Site Test)

### Soft Delete?
**No.** Hard-deleted. ⚠️ Flagged as audit gap.

---

## 5. Style Cycle (`StyleMaster` / `SampleComment`)

**Product development lifecycle tracker** — follows a garment from initial PO through all sample review stages.

### `StyleMaster`
- UUID PK. Links a `po_number` + `style_name` to a `Customer` and `Factory`.
- Fields: `po_number`, `style_name`, `color`, `season`, `customer`, `factory`, `created_by`, timestamps.
- Children: `SampleComment` (review stages), `StyleLink` (reference URLs).

### `SampleComment`
**The core workflow entity in the Style Cycle.**

#### Status Choices (Workflow States)
| Status | Meaning |
|---|---|
| `pending` | Awaiting review |
| `in_review` | Under active review |
| `approved` | Customer approved this sample |
| `rejected` | Customer rejected |
| `revised` | Revision required |

> ⚠️ **No enforced state machine** — any status can be set to any value via API. Transitions are not guarded (e.g., `approved` → `rejected` is allowed). Ask whether transition guards are required before adding them.

#### Sample Type Choices
`Fit Sample` | `PP Sample` | `Size Set` | `SMS` | `Shipment Sample` | `Proto`

#### `sample_number` Auto-Increment
On create, `sample_number` is auto-incremented per `(style, sample_type)` combination. The first Proto comment is `sample_number=1`, the second Proto is `2`, etc. Fit Sample starts its own counter from 1.

#### Section Timestamps
Each comment section (`comments_fit`, `comments_workmanship`, etc.) has a corresponding `*_edited_at` field updated automatically in `save()` when that section's text changes.

#### Children
- `SampleCommentImage` (categorised: general, fit, workmanship, wash, fabric, accessories)

### `StyleLink`
Simple URL bookmark linked to a `StyleMaster`. No workflow.

---

## 6. Email Infrastructure

### `EmailOutbox`
- Append-only outgoing email log.
- Status: `PENDING` → `SENT` or `FAILED`.
- Never hard-deleted (records retained for diagnostics). Binary attachments are **not** stored; only metadata (filename, subject, recipients).

---

## 7. AQL Calculation Functions

Two pure functions in `qc/models/final_inspection.py` (also mirrored in `frontend-next/lib/aqlCalculations.ts`):
- `calculate_sample_size(order_qty)` → sample size integer per ISO 2859-1 Level II.
- `get_aql_limits(sample_size, aql_level)` → acceptance number (Ac).

> ⚠️ The frontend and backend AQL tables **are not identical** — the frontend table (`aqlCalculations.ts`) includes AQL level `1.0` and `6.5` which the backend table does not have. Confirm whether the backend needs to be extended before using these levels.

---

## 8. What is Confirmed Missing / Ambiguous — Ask Before Proceeding

| # | Issue | Status |
|---|---|---|
| 1 | No soft-delete on `Inspection` or `FinalInspection` | No `deleted_at` field exists; hard deletes are used. Confirm whether to add soft-delete. |
| 2 | No state machine transition guards | Both `Inspection.stage` and `SampleComment.status` accept any value freely. Confirm whether guards are needed. |
| 3 | No versioning / change history | No `history` table or django-simple-history. Ask whether version tracking is required. |
| 4 | No formal approval/signature step | No `approved_by`, `approved_at`, or digital signature field on any record. Confirm whether required. |
| 5 | `Inspection.factory` is a CharField | It stores factory name as free text, not a FK to `Factory`. Confirm whether this is intentional. |
| 6 | `FinalInspection.factory` and `.supplier` are both CharFields | Same as above. No FK constraint to `Factory` model. |
| 7 | Backend AQL table missing `1.0` and `6.5` levels | Frontend has them; backend does not. Confirm which is correct. |
| 8 | `StyleMasterViewSet` permission is `IsAuthenticated` only | Merchandisers can create/edit styles — is this intentional? |
