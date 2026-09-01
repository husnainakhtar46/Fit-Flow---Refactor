---
name: db-migration-safety
description: >-
  Rules for reviewing and writing Django migrations safely in Fit-Flow.
  Covers: destructive migration detection, column/table rename/drop rules,
  reversibility requirements, confirmation protocol for non-local databases,
  and migration naming conventions. Use this skill whenever generating,
  reviewing, or applying any Django migration.
---

# Fit-Flow Database Migration Safety Rules

The project currently has 36 migrations (`0001_initial` through `0036_*`) in `backend/qc/migrations/`. SQLite is used locally; PostgreSQL is used in production via `DATABASE_URL`. Always treat migrations as a permanent, append-only history.

---

## 1. Migration Environment Rules

### A. Local vs Production Database Check
**Before running any migration, identify the target database:**

```powershell
# Check which database will be used
# If DATABASE_URL env var is set → PostgreSQL (production or staging)
# If DATABASE_URL is not set     → SQLite local db.sqlite3

# Always run migrations against local first:
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py migrate
```

> ⚠️ **BLOCK**: If `DATABASE_URL` is set in the environment, you are targeting a non-local database. **Stop and ask the user for explicit confirmation** before running `migrate`. State:
> 1. The database URL host (without credentials).
> 2. Which migrations will be applied.
> 3. Whether a backup exists.

### B. Dry-Run Check Before Every Migration Run
Always run `--plan` before applying migrations:
```powershell
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py migrate --plan
```
Review the output for any destructive operations before proceeding.

---

## 2. Destructive Operation Rules

### A. Dropping a Column — BLOCKED
Never generate or apply a migration that drops a column without:
1. Verifying no application code references the column.
2. Getting explicit user confirmation naming the column and the reason.
3. Checking that the column has no data that must be archived first.

The existing migrations show that **columns have only ever been added, never dropped**. Maintain this discipline.

### B. Renaming a Column — BLOCKED (unless `RenameField` with backwards compatibility)
Column renames generate a `RenameField` operation. This is only safe if:
- No raw SQL queries reference the old name.
- All serializers, filters, and admin files are updated in the same PR.
- The migration is tested locally with both SQLite and a PostgreSQL-compatible migration check.

> If in doubt, use `db_column='old_name'` to preserve the DB column name while changing the Python attribute name.

### C. Dropping a Table — BLOCKED
Never generate a migration that removes an entire model without:
1. Explicit user confirmation naming the model.
2. Confirmation that all data has been migrated or is safe to discard.
3. A data backup or export step completed before applying.

### D. Changing `null=False` on an Existing Column — REQUIRES REVIEW
Adding a `NOT NULL` constraint to a column that already has rows can fail on PostgreSQL. Always:
1. Provide a `default` value in the migration.
2. Or run a data migration first to fill existing nulls.
3. Test on a clone of production data if possible.

---

## 3. Migration Reversibility

Every new migration must be reversible where technically possible:

- `AddField` → reversible (Django handles `RemoveField` in reverse).
- `AlterField` → reversible if the previous field definition is known.
- `CreateModel` → reversible (`DeleteModel` in reverse).
- `RunPython` migrations → **must define a `reverse_code` function** (not `RunPython.noop` for data migrations).
- `RenameField` / `RenameModel` → reversible; Django generates the inverse automatically.

```python
# Required pattern for RunPython:
def forwards(apps, schema_editor):
    ...

def backwards(apps, schema_editor):
    ...  # MUST be implemented, not omitted

class Migration(migrations.Migration):
    operations = [
        migrations.RunPython(forwards, backwards),
    ]
```

---

## 4. Migration Naming Convention

The project uses the default Django sequential naming: `NNNN_<description>.py`.

The existing naming patterns seen in this repo:
- `0020_userprofile.py` — model addition
- `0021_dynamic_samples.py` — structural change
- `0028_inspection_is_draft_inspection_updated_at.py` — field additions named after fields

**Rule**: Keep description names concise and human-readable. Use underscores. Reference the model or field being changed, not the ticket number.

---

## 5. What to Check Before Generating a Migration

Run `makemigrations --dry-run --check` to validate changes without writing files:
```powershell
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py makemigrations --dry-run --check
```

Also run `migrate --plan` to see what would be applied:
```powershell
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py migrate --plan
```

---

## 6. Raw SQL — Prohibited by Default

**Do not use `migrations.RunSQL()` or raw SQL queries** (`cursor.execute()`) unless:
1. There is a specific ORM limitation that cannot be worked around.
2. You have explicit user approval.
3. The SQL is parameterised (no string formatting of user input into SQL).
4. The SQL is tested on both SQLite and PostgreSQL (syntax differences exist).

---

## 7. Current Migration History Reference

| Migration | What It Did |
|---|---|
| `0001_initial` | Initial schema |
| `0005_*` | Added `contact_name`, `email_type` to `CustomerEmail` |
| `0008_*` | Added `customer` FK to `Template` |
| `0009_*` | Added `FilterPreset` |
| `0010_*` | Added `customer_decision` and feedback fields to `Inspection` |
| `0012_*` | Added `FinalInspection`, `FinalInspectionDefect`, related |
| `0014_*` | Added `FinalInspectionMeasurement` |
| `0018_*` | Added `inspection_attempt` to `FinalInspection` |
| `0019_*` | Added `accessories_data` (JSONField) and fabric check fields |
| `0020_*` | Added `UserProfile` |
| `0021_*` | Added `MeasurementSample` (dynamic samples) |
| `0022_*` | Added `StyleMaster`, `SampleComment`, `CommentImage` |
| `0026_*` | Added `Factory` model |
| `0028_*` | Added `is_draft`, `updated_at` to `Inspection` |
| `0029_*` | Added `is_draft`, `updated_at` to `FinalInspection` |
| `0032_*` | Added `OTPVerification` |
| `0035_*` | Added `EmailOutbox` |
| `0036_*` | Altered `FinalInspectionSizeCheck` options |

---

## 8. Squashing Migrations

Do not squash migrations without explicit user approval. The current 36-migration history is clean and reversible — squashing introduces risk without clear benefit unless the test suite becomes slow.

---

## 9. Summary Checklist Before Any Migration Work

- [ ] Confirmed target database is local (SQLite) or got explicit approval for non-local
- [ ] Ran `makemigrations --dry-run --check` — no unexpected changes
- [ ] Ran `migrate --plan` — reviewed all operations
- [ ] No `RemoveField`, `DeleteModel`, or `RenameField` without user confirmation
- [ ] All `RunPython` migrations have both `forwards` and `backwards` functions
- [ ] No raw SQL without approval
- [ ] Migration name is descriptive and follows `NNNN_description` convention
- [ ] All tests still pass after migration: `python manage.py test`
