# Fit-Flow QMS — AI Agent Directives & Repository Rules

These rules apply to **all AI agents** operating within this repository. Follow every constraint unconditionally to keep the codebase clean, secure, performant, and **effortlessly maintainable by human developers**.

---

## 1. The 350-Line Hard Rule & Exception Protocol

### A. Core File Size Limit (≤ 300–350 Lines)
- Every Python (`.py`), TypeScript (`.ts`), and React (`.tsx`) file must remain strictly under **300–350 lines**.
- If a component, view, or service grows close to this limit, **decompose it**:
  - Frontend: Extract sub-form sections, custom hooks (`use*.ts`), or shared components.
  - Backend: Partition into `qc/models/`, `qc/serializers/`, `qc/views/`, `qc/services/`.

### B. Mandatory User Permission for Rare Exceptions
> ⚠️ **Exception Protocol**: In rare and unavoidable cases where a file must strictly exceed 350 lines (e.g. dense ReportLab canvas drawing, monolithic ISO calculation tables, or tightly-coupled interactive multi-step canvases where splitting degrades performance or readability), the AI agent **MUST NOT** proceed silently.
>
> **The AI agent MUST stop and ask the user for explicit permission**, stating:
> 1. The target file and its expected line count.
> 2. The technical reason why decomposition is unfeasible or suboptimal.
> 3. Confirmation from the user to proceed with exceeding the line limit.

---

## 2. Hard Guardrails — Require Explicit Confirmation Before Proceeding

The following actions are **blocked by default**. The agent must stop, describe what it intends to do, and get explicit user confirmation before executing:

### G1 — Database Migrations Against Non-Local Databases
- If `DATABASE_URL` is set in the environment, the target is a non-local (production/staging) PostgreSQL database.
- **Stop and state**: the target host, which migrations will apply, and whether a backup exists.
- Never run `python manage.py migrate` against production without user confirmation.
- Always run `python manage.py migrate --plan` locally first and share the plan output.

### G2 — Editing `.env` or `settings.py` Secrets
- Never add, remove, or modify values in `.env`, `.env.local`, `settings/base.py`, `settings/production.py` that contain or control secrets (`SECRET_KEY`, `DATABASE_URL`, OAuth credentials, email passwords).
- If a secret change is needed, describe what needs to change and let the user make the edit.

### G3 — Raw SQL or String-Formatted Queries
- Never use `cursor.execute()`, `migrations.RunSQL()`, or any f-string/format-string injection into SQL without explicit user approval.
- All queries must go through the Django ORM with parameterised inputs.

### G4 — Dropping or Renaming Database Columns/Tables
- Any migration that contains `RemoveField`, `DeleteModel`, `RenameField`, or `RenameModel` requires explicit user confirmation before the migration file is created or applied.
- State the field/table affected and the data impact.

### G5 — Deleting Quality Records
- Never call `.delete()` on `Inspection`, `FinalInspection`, `SampleComment`, or `Customer` records in any new business logic or scripts without asking first.
- The project has no soft-delete mechanism — hard deletes are permanent. See `audit-trail-requirements` skill.

### G6 — Scope Creep
- Do not modify files or modules outside the explicit scope of the current task, even if related issues are noticed.
- Note them as separate items to address later — never silently "fix" them in the same change.

### G7 — Ambiguous Requirements
- If a requirement, domain rule, or acceptance criterion is ambiguous, **stop and ask** rather than making a silent assumption and proceeding.
- Prefer the minimal correct change over a broader rewrite or "improvement" that was not requested.

---

## 3. Security Guardrails — Always Enforced, No Exceptions

### S1 — No Hardcoded Secrets
- No API keys, passwords, secret keys, OAuth tokens, or credentials anywhere in source code.
- All secrets must come from environment variables read via `os.getenv()` (backend) or `process.env.NEXT_PUBLIC_*` (frontend).
- `credentials.json` and `gmail-token.json` must remain in `.gitignore` and never be committed.

### S2 — All User Input Through Serializers / Zod Schemas
- Backend: Every mutation endpoint must validate input through a DRF serializer. Never trust `request.data` directly.
- Frontend: Every form submission must validate through a Zod schema before calling a mutation.
- No direct use of `request.data.get(field)` to write to a model without serializer validation.

### S3 — Permission Classes on Every Mutating Endpoint
- Every ViewSet and APIView that accepts POST/PUT/PATCH/DELETE must have an explicit `permission_classes` list.
- The global default (`IsAuthenticated`) is not sufficient for domain-sensitive endpoints — use the appropriate class from `qc/permissions.py`.
- Never use `permission_classes = []` on a mutating endpoint.

### S4 — No Hardcoded UUIDs, IDs, or Business Constants in Code
- AQL tables belong in `lib/aqlCalculations.ts` (frontend) and `qc/models/final_inspection.py` (backend). Do not inline them in components or views.
- Stage lists, role names, and status choices belong in model `choices` or `types.ts` — not scattered as magic strings.

---

## 4. Test & Build Verification — Required Before Marking Any Task Done

**Do not mark work complete** without showing actual passing output from all three commands:

```powershell
# 1. Line Count Check (must pass with 0 files > 350 lines unless user approved)
node check-line-counts.js

# 2. Frontend TypeScript Typecheck (zero errors required)
cd frontend-next
npx tsc --noEmit
cd ..

# 3. Backend Test Suite (all 19+ tests must pass)
cd backend
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py test
cd ..
```

Every backend change touching business logic must be accompanied by a corresponding test change. Asserting something "should work" is not a substitute for a passing test run.

---

## 5. Architectural Structure

### Frontend (`frontend-next/`)
- **Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS + TanStack Query v5 + Dexie.js**.
- Place all domain logic in `features/<feature-name>/` (`types.ts`, `use<Feature>.ts`, `<Feature>ListView.tsx`, `<Feature>FormView.tsx`).
- Place reusable UI primitives in `components/ui/` (shadcn/ui) and domain widgets in `components/inspection/` or `components/shared/`.
- No raw `any` types. All API payloads and form states must have explicit TypeScript interfaces.
- Handle offline drafts via Dexie.js (`lib/db.ts`) and batch upload via `components/shared/SyncManager.tsx`.
- Real-time ISO 2859-1 AQL computations must use pure functions from `lib/aqlCalculations.ts`.
- All HTTP calls go through the single Axios instance in `lib/api.ts`. Never import Axios directly in feature code.

### Backend (`backend/`)
- **Django 4.x/5.x + Django REST Framework + SimpleJWT + ReportLab + Pillow**.
- Domain-partitioned directory: `qc/models/`, `qc/serializers/`, `qc/views/`, `qc/services/pdf/`.
- Zero N+1 queries: every `get_queryset()` must use `select_related()` for FK/OneToOne and `prefetch_related()` for reverse/M2M relations.
- Enforce RBAC via `qc/permissions.py` (`qa`, `quality_head`, `quality_supervisor`, `merchandiser`, `admin`).
- PDF generation: in-memory `io.BytesIO()` buffers only; no temp files on disk.
- Error responses always: `{"error": "descriptive message"}` with the appropriate HTTP status code.

---

## 6. Human Maintainability & Clean Code Standards

1. **Self-Documenting Code**: Descriptive variable and function names. Avoid cryptic abbreviations.
2. **JSDoc & Docstrings**: Concise docstrings on all backend ViewSets/actions and frontend hooks/complex algorithms.
3. **Structured Errors**: `{"error": "message"}` on backend; `toast.error(...)` from `sonner` on frontend.
4. **Preserve Documentation Integrity**: Update `ARCHITECTURE.md` and relevant skill files whenever a structural flow changes.
5. **No Unused Imports**: Keep imports clean and free of circular dependencies.
6. **No Side-Effects in Model Properties**: `@property` methods must be lightweight calculations — never trigger DB queries or writes.

---

## 7. Specialized Skills Reference

Read the relevant skill before starting any domain-specific work:

| Skill | Path | When to Use |
|---|---|---|
| `fitflow-backend` | `.agents/skills/fitflow-backend/SKILL.md` | Any backend code |
| `fitflow-frontend` | `.agents/skills/fitflow-frontend/SKILL.md` | Any frontend code |
| `django-api-conventions` | `.agents/skills/django-api-conventions/SKILL.md` | Adding/modifying API endpoints, serializers, permissions |
| `nextjs-conventions` | `.agents/skills/nextjs-conventions/SKILL.md` | Adding/modifying routes, hooks, data fetching |
| `qms-domain-model` | `.agents/skills/qms-domain-model/SKILL.md` | Any work touching quality records, statuses, or workflows |
| `audit-trail-requirements` | `.agents/skills/audit-trail-requirements/SKILL.md` | Any work touching record lifecycle, deletion, or logging |
| `db-migration-safety` | `.agents/skills/db-migration-safety/SKILL.md` | Generating or applying any Django migration |
