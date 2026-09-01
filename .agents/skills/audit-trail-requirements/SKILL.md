---
name: audit-trail-requirements
description: >-
  Audit trail rules for Fit-Flow: which tables and actions must be logged,
  what an audit log entry must capture, and the confirmed soft-delete policy.
  Use this skill when adding, modifying, or deleting any quality record,
  or when implementing logging/history on any domain entity.
---

# Fit-Flow Audit Trail Requirements

This document records what currently exists and what is explicitly required. Where a requirement is not yet implemented, it is flagged — do not silently implement it; confirm the approach first.

---

## 1. Current State of Audit Logging (As-Found)

### What Exists Today
- **`EmailOutbox` model** — append-only log of all outgoing email attempts. Retained indefinitely. Status transitions: `PENDING` → `SENT` / `FAILED`. Error messages recorded. ✅
- **`created_at` / `updated_at` timestamps** — present on: `Inspection`, `FinalInspection`, `StyleMaster`, `SampleComment`, `Customer`, `Factory`, `Template`, `FilterPreset`, `EmailOutbox`. ✅
- **`created_by` FK** — present on: `Inspection`, `FinalInspection`, `StyleMaster`, `SampleComment`, `Customer`, `Template`. ✅
- **Section-level edit timestamps on `SampleComment`** — `general_edited_at`, `fit_edited_at`, `workmanship_edited_at`, `wash_edited_at`, `fabric_edited_at`, `accessories_edited_at` — updated automatically in `save()` when that section changes. ✅
- **`customer_feedback_date`** — timestamped when `customer_decision` is recorded on `Inspection`. ✅

### What Does NOT Exist Today
- ❌ No dedicated `AuditLog` table capturing before/after field values.
- ❌ No django-simple-history or django-audit-log package installed.
- ❌ No soft-delete (`is_deleted` / `deleted_at`) on `Inspection`, `FinalInspection`, `Customer`, `Factory`, `StyleMaster`, `Template`. **Hard deletes are used.**
- ❌ No logging of which user deleted a record or when.
- ❌ No recording of state transition events (e.g., who moved `SampleComment.status` from `pending` to `approved`).

---

## 2. Required Audit Rules (What Must Be True)

The following rules define what MUST hold for this system to be auditable. Where a rule is not yet mechanically enforced, it is marked **[OPEN]** — ask before implementing.

### A. Records That Must Never Be Hard-Deleted

| Table | Current Behaviour | Required Behaviour | Status |
|---|---|---|---|
| `Inspection` | Hard delete via `DELETE /inspections/{pk}/` | Soft-delete preferred for audit integrity | **[OPEN]** — confirm before adding `is_deleted` |
| `FinalInspection` | Hard delete | Same | **[OPEN]** |
| `EmailOutbox` | Never deleted (retained) | Already correct ✅ | ✅ |
| `SampleComment` | Hard delete via CASCADE on `StyleMaster` delete | Should be retained | **[OPEN]** |
| `OTPVerification` | Hard deleted after use | Acceptable for security (transient secret) | Acceptable |

> ⚠️ Until soft-delete is implemented and confirmed, **AI agents must not call `.delete()` on `Inspection` or `FinalInspection` records** in any new code without asking the user first.

### B. Actor, Action, and Timestamp Capture

For any code that modifies a quality record, the following must be captured and persist:

| Field | Must Capture | Source |
|---|---|---|
| `actor` | `request.user` (authenticated user) | Django `perform_create` / `perform_update` |
| `action` | `created` / `updated` / `deleted` (or field-level) | Determined by the view action |
| `timestamp` | `timezone.now()` at time of action | Auto-set via `auto_now_add` or explicit set |
| `before_value` | The previous field values (for updates) | **[OPEN]** — not captured today |
| `after_value` | The new field values | **[OPEN]** — not captured today |
| `target_record` | Model name + UUID | **[OPEN]** — no cross-model audit table |

Until a formal `AuditLog` model exists, the minimum acceptable practice is:
1. **Never overwrite `created_by`** on existing records during update.
2. **Never bypass `perform_create()`** — it is what stamps `created_by=request.user`.
3. Log critical state changes (at minimum: `Inspection.decision`, `FinalInspection.result`, `SampleComment.status`) using Django's `logging` module until a proper audit table is built.

### C. Immutable Fields

These fields must never be modified after initial creation:
- `Inspection.created_by`, `Inspection.created_at`
- `FinalInspection.created_by`, `FinalInspection.created_at`
- `SampleComment.created_by`, `SampleComment.created_at`
- `StyleMaster.created_by`, `StyleMaster.created_at`
- `EmailOutbox` — the entire record is append-only after creation.

Serializers must declare these as `read_only_fields` or exclude them from writeable fields.

### D. Which Actions Must Be Logged

When a full `AuditLog` is eventually implemented, the minimum required events are:

| Entity | Events to Log |
|---|---|
| `Inspection` | Created, Updated (especially `decision` change), Deleted |
| `FinalInspection` | Created, Updated (especially `result` change), Deleted |
| `SampleComment` | Created, Updated (especially `status` change) |
| `Customer` | Created, Updated, Deleted |
| `Template` | Created, Updated, Deleted |
| `EmailOutbox` | Status transition to `SENT` or `FAILED` |

---

## 3. Implementing an AuditLog — Design Constraints (When Approved)

When you are explicitly asked to add audit logging, follow these constraints:

1. **Create `qc/models/audit.py`** with an `AuditLog` model:
   ```python
   class AuditLog(models.Model):
       id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
       actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
       action = models.CharField(max_length=20)          # 'created', 'updated', 'deleted'
       model_name = models.CharField(max_length=100)     # e.g. 'Inspection'
       object_id = models.CharField(max_length=36)       # UUID as string
       field_name = models.CharField(max_length=100, blank=True)
       before_value = models.TextField(blank=True)
       after_value = models.TextField(blank=True)
       timestamp = models.DateTimeField(auto_now_add=True)
       ip_address = models.GenericIPAddressField(null=True, blank=True)

       class Meta:
           ordering = ['-timestamp']
           indexes = [models.Index(fields=['model_name', 'object_id'])]
   ```
2. **Never hard-delete `AuditLog` rows** — they are the permanent record.
3. **Write audit entries in `perform_create` / `perform_update` / `perform_destroy`** in ViewSets — not in model `save()` to avoid double-logging from signals.
4. **Async or synchronous**: Write synchronously in the same transaction as the data change; do not use Celery/background tasks for audit entries.

---

## 4. Key Open Questions — Answer Before Implementing

1. Should `Inspection` and `FinalInspection` be soft-deleted (add `is_deleted` / `deleted_at`) or hard-deleted? (**[OPEN]**)
2. Is a formal `AuditLog` table required now, or is the current timestamp-based approach sufficient for the near term? (**[OPEN]**)
3. Are there regulatory or ISO compliance requirements (e.g., ISO 9001 record retention periods) that must be honoured? (**[OPEN]**)
4. Should the customer-facing system log `customer_decision` changes as an immutable audit trail (e.g., customer said "Approved" then changed to "Revision Required")? (**[OPEN]**)
