# Fit-Flow QMS — AI Agent Directives & Repository Rules

These rules apply to all AI agents operating within this repository. Follow these constraints unconditionally to ensure the codebase remains clean, performant, and **effortlessly maintainable by human developers**.

---

## 1. The 350-Line Hard Rule & Exception Protocol

### A. Core File Size Limit (≤ 300–350 Lines)
- Every Python (`.py`), TypeScript (`.ts`), and React (`.tsx`) file must remain strictly under **300–350 lines**.
- If a component, view, or service grows close to this limit, **decompose it**:
  - Frontend: Extract sub-form sections, custom hooks (`use*.ts`), or shared components.
  - Backend: Partition models into `qc/models/`, serializers into `qc/serializers/`, views into `qc/views/`, and services into `qc/services/`.

### B. Mandatory User Permission for Rare Exceptions
> ⚠️ **Exception Protocol**: In rare and unavoidable cases where a file must strictly exceed 350 lines (e.g. dense ReportLab canvas drawing, monolithic ISO calculation tables, or tightly-coupled interactive multi-step canvases where splitting degrades performance or readability), the AI agent **MUST NOT** proceed silently.
>
> **The AI agent MUST stop and ask the user for explicit permission**, stating:
> 1. The target file and its expected line count.
> 2. The technical reason why decomposition is unfeasible or suboptimal.
> 3. Confirmation from the user to proceed with exceeding the line limit.

---

## 2. Architectural Structure

### Frontend (`frontend-next/`)
- **Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS + TanStack Query v5 + Dexie.js**.
- Place all domain logic in `features/<feature-name>/` (`types.ts`, `use<Feature>.ts`, `<Feature>ListView.tsx`, `<Feature>FormView.tsx`).
- Place reusable UI primitives in `components/ui/` (shadcn/ui) and domain widgets in `components/inspection/` or `components/shared/`.
- No raw `any` types. All API payloads and form states must have explicit TypeScript interfaces.
- Handle offline drafts via Dexie.js (`lib/db.ts`) and batch upload via `components/shared/SyncManager.tsx`.
- Real-time ISO 2859-1 AQL computations must use pure functions from `lib/aqlCalculations.ts`.

### Backend (`backend/`)
- **Django 5.x + Django REST Framework + SimpleJWT + ReportLab + Pillow**.
- Domain-partitioned directory structure: `qc/models/`, `qc/serializers/`, `qc/views/`, `qc/services/pdf/`.
- Zero N+1 queries: every `get_queryset()` must use `select_related()` for ForeignKey/OneToOne and `prefetch_related()` for reverse relations and ManyToMany.
- Enforce Role-Based Access Control (RBAC) via `qc/permissions.py` (`qa`, `quality_head`, `quality_supervisor`, `merchandiser`, `admin`).
- PDF generation must use `qc/services/pdf/` engines with in-memory `io.BytesIO()` buffers.

---

## 3. Human Maintainability & Clean Code Standards

1. **Self-Documenting Code**: Use descriptive variable and function names. Avoid cryptic abbreviations.
2. **JSDoc & Docstrings**: Include concise docstrings on all backend ViewSets/actions and frontend hooks/complex algorithms.
3. **Structured Errors**: Return JSON error objects `{"error": "message"}` on the backend and show `sonner` toasts (`toast.error(...)`) on the frontend.
4. **Preserve Documentation Integrity**: Keep `ARCHITECTURE.md` and skill files up to date whenever modifying structural flows.

---

## 4. Verification Commands

Always run these verification commands before marking a task complete:

```powershell
# 1. Line Count Check (Must pass with 0 files > 350 lines unless user approved)
node check-line-counts.js

# 2. Frontend TypeScript Typecheck
cd frontend-next
npx tsc --noEmit
cd ..

# 3. Backend Test Suite
cd backend
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py test
cd ..
```

---

## 5. Specialized Skills

For in-depth step-by-step guides and patterns, refer to:
- Frontend Skill: [`.agents/skills/fitflow-frontend/SKILL.md`](file:///d:/Coding/Fit%20Flow%20-%20Refactor/.agents/skills/fitflow-frontend/SKILL.md)
- Backend Skill: [`.agents/skills/fitflow-backend/SKILL.md`](file:///d:/Coding/Fit%20Flow%20-%20Refactor/.agents/skills/fitflow-backend/SKILL.md)
