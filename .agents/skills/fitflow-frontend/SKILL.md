---
name: fitflow-frontend
description: >-
  Expert engineering rules and workflows for building and maintaining the Fit-Flow QMS Frontend
  (Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, TanStack Query v5, Dexie.js offline sync,
  shadcn/ui, and ISO 2859-1 AQL verification). Use this skill whenever creating, modifying, refactoring,
  or debugging frontend code in frontend-next/.
---

# Fit-Flow QMS — Frontend AI Agent Skill & Maintainability Guide

This skill governs all frontend development within `frontend-next/`. Every AI agent working on this codebase must follow these standards to guarantee that the application remains modular, strictly typed, performant, and **instantly understandable for human engineers working on the project at any later stage**.

---

## 1. Golden Architectural Laws

### A. Strict File Size Limit (≤ 300–350 Lines)
- **Hard Limit**: Every TypeScript (`.ts`) and React (`.tsx`) file must remain strictly under **300–350 lines**.
- **Single Responsibility Principle (SRP)**: Each file must do one thing well.
  - If a form view grows, split it into sub-sections (e.g. `GeneralInfoSection.tsx`, `DefectSection.tsx`, `MeasurementTable.tsx`).
  - If grid or calculation logic grows, extract it into a custom hook (e.g. `useMeasurementGrid.ts`, `useFIGrid.ts`).
  - Extract reusable UI widgets to `components/shared/` or `components/inspection/`.
- **Exception Protocol (Rare Cases)**:
  > In rare, exceptional cases where a file cannot logically be decomposed below 350 lines (e.g. highly coupled interactive multi-step canvases or dense mathematical matrix parsers where splitting causes severe abstraction overhead), the agent **MUST NOT** silently exceed the limit. The agent **MUST prompt the user and obtain explicit permission** with a clear technical justification before creating or expanding such a file.

### B. Feature-Slice Directory Structure
Place all domain-specific logic in `features/<feature-name>/`. Never scatter feature logic across unrelated directories.

```
frontend-next/
├── app/                         # Routing shell only (App Router)
│   ├── (auth)/                  # Public auth routes (login, password reset)
│   └── (app)/                   # Authenticated app routes & page entries
├── features/                    # Domain-driven feature slices
│   └── <feature-name>/          # e.g., evaluation, final-inspection, style-cycle
│       ├── types.ts             # Feature TypeScript interfaces & types ONLY
│       ├── use<Feature>.ts      # TanStack Query hooks, state, mutations, offline queue
│       ├── use<Feature>Grid.ts  # Specialized grid/table/paste logic (if applicable)
│       ├── <Feature>ListView.tsx# Main data table / list presentation
│       ├── <Feature>FormView.tsx# Master form modal / editor
│       └── <SubSection>.tsx     # Scoped form sections (≤ 250 lines each)
├── components/                  # Cross-feature reusable UI
│   ├── ui/                      # Base shadcn/ui primitives (Button, Dialog, Table, etc.)
│   ├── shared/                  # Reusable widgets (Pagination, Selects, SyncManager)
│   ├── inspection/              # Domain widgets (AQLResultCard, DefectCounter, ImageUploader)
│   └── layout/                  # Navigation layout (Sidebar, MobileNav, Headers)
├── hooks/                       # Cross-feature custom React hooks
├── lib/                         # Core infrastructure (api.ts, auth.ts, db.ts, aqlCalculations.ts)
└── utils/                       # Pure stateless helpers & formatters
```

---

## 2. TypeScript & Type Safety Discipline

1. **Zero `any` Tolerance**:
   - Every API payload, form state, and helper return value must have an explicit interface defined in `features/<feature>/types.ts` or `lib/`.
   - Never use `as any` or `@ts-ignore` to suppress compiler diagnostics.
2. **Nullable Safety & Optional Chaining**:
   - Always handle `null` and `undefined` safely when reading API responses.
   - Use standard TypeScript utility types (`Partial<T>`, `Omit<T, K>`, `Pick<T, K>`) rather than re-declaring duplicated types.
3. **Form Validation with Zod & React Hook Form**:
   - When building complex multi-field forms, declare a Zod schema matching the feature types to validate before submitting.

---

## 3. State Management & TanStack Query v5 Patterns

1. **Predictable Query Keys**:
   - Use hierarchical, array-based query keys to allow granular cache invalidation:
   ```typescript
   // Query Keys Convention
   ['inspections', 'list', filters]
   ['inspections', 'detail', inspectionId]
   ['inspections', 'drafts']
   ['customers', 'list']
   ['templates', 'by-customer', customerId]
   ```
2. **Mutations & Cache Invalidation**:
   - Always invalidate relevant query caches in `onSuccess` handlers:
   ```typescript
   const queryClient = useQueryClient();
   
   const createMutation = useMutation({
     mutationFn: (data: InspectionFormData) => api.post('/api/inspections/', data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['inspections'] });
       toast.success('Inspection created successfully');
     },
     onError: (error: any) => {
       const msg = error.response?.data?.error || error.message || 'Failed to save';
       toast.error(msg);
     }
   });
   ```
3. **Client vs Server Component Boundaries**:
   - Mark interactive feature components and hooks with `'use client';` at the top of the file.
   - Keep page routes (`app/(app)/**/page.tsx`) lightweight shells that render the feature view component.

---

## 4. Offline-First & Dexie.js (IndexedDB) Architecture

The application is a Progressive Web App (PWA) that allows QAs to conduct inspections on factory floors with zero internet connectivity.

1. **Database Schema (`lib/db.ts`)**:
   - Stores offline inspections in `db.inspections` with `status: 'pending_sync'`.
   - Persists in-progress form drafts in `db.drafts` with key `draftKey`.
   - Caches master data (Customers, Factories, Templates) in `db.customers`, `db.factories`, `db.templates`.
2. **Draft Auto-Saving Pattern**:
   - Auto-save form drafts locally with debounce (e.g. 500ms–1000ms):
   ```typescript
   await saveDraftLocally({
     draftKey: `eval_draft_${formId || 'new'}`,
     formData: currentValues,
     imageSlots: images,
     updatedAt: Date.now(),
     formType: 'evaluation',
   });
   ```
3. **Submission Offline Fallback**:
   - Check network status before submitting:
   ```typescript
   if (!navigator.onLine) {
     await db.inspections.add({
       formData,
       images,
       createdAt: Date.now(),
       status: 'pending_sync',
       type: 'evaluation',
     });
     toast.info('Saved offline. Will sync automatically when online.');
     return;
   }
   ```
4. **Syncing**:
   - Use `components/shared/SyncManager.tsx` to display pending offline records with batch retry capabilities.

---

## 5. Domain-Specific Engineering Workflows

### A. Excel / TSV Spreadsheet Paste Workflow
- QAs frequently copy Point of Measure (POM) rows from Excel or Google Sheets.
- Parse `clipboardData.getData('text')` by splitting rows on `\n` and cells on `\t`.
- Dynamically match existing rows or use `useFieldArray` to append newly pasted measurements.
- Always sanitize and convert numeric strings, replacing invalid values with empty strings or zero defaults.

### B. ISO 2859-1 AQL Calculation Engine (`lib/aqlCalculations.ts`)
- Never hardcode AQL threshold numbers inside UI components.
- Always use the pure functions from `lib/aqlCalculations.ts`:
  - `calculateSampleSize(orderQty)` → Returns `{ sampleSize, codeLetter }`
  - `calculateDefectLimits(sampleSize, majorLevel)` → Returns `{ critical, major, minor }`
  - `calculateVerdict(...)` → Returns `'Pass' | 'Fail' | 'Pending'`
- Compute verdicts reactively as defect counters update.

### C. Client-Side Image Compression (`lib/imageUtils.ts`)
- QAs upload high-resolution inspection photos.
- Always run images through `browser-image-compression` (max size ~1MB, max width/height 1600px) prior to upload to prevent network bottlenecks and backend timeouts.

### D. Role-Based Access Control (RBAC) in UI
- Use `useAuth()` from `lib/auth.ts`.
- Roles: `'qa'`, `'quality_head'`, `'quality_supervisor'`, `'merchandiser'`, `'admin'`.
- Always hide or disable action buttons (Delete, Edit, Customer Feedback, Master Data) if the current user lacks permission.

---

## 6. Human Maintainability & Clean Code Checklist

To make sure a human developer reading this code 6 months from now can immediately understand and modify it:

1. **Clear, Intent-Revealing Names**:
   - Bad: `const [d, setD] = useState([]);` | `const hdl = () => ...;`
   - Good: `const [defects, setDefects] = useState<DefectItem[]>([]);` | `const handleMeasurementPaste = ...;`
2. **Self-Documenting Code & JSDoc**:
   - Add concise JSDoc comments to hooks, utilities, and complex calculation blocks explaining *why* a specific business rule exists.
3. **Consistent User Feedback**:
   - Use `sonner` (`toast.success()`, `toast.error()`, `toast.info()`) for all async actions.
   - Always display loading skeletons or spinner indicators during queries and mutations.
4. **Accessible shadcn/ui Components**:
   - Use Radix UI primitives encapsulated in `components/ui/`.
   - Ensure proper dialog closures, ARIA labels on icon buttons, and responsive layouts on mobile devices (`md:` / `lg:` Tailwind breakpoints).

---

## 7. Anti-Patterns to Avoid

- ❌ **No Monolithic Forms**: Never put all form fields, tables, modals, and query mutations in a single 600-line file.
- ❌ **No Direct Axios Calls in Components**: Always route HTTP requests through custom TanStack Query hooks or `lib/api.ts`.
- ❌ **No Magic Numbers**: Move fixed constants (AQL tables, tolerance bounds, stage lists) into dedicated constant files or `types.ts`.
- ❌ **No Raw LocalStorage Access**: Always use `lib/auth.ts` or structured storage wrappers so auth state changes remain synchronized.
- ❌ **No Unhandled Promises**: Always handle `.catch()` or use `try/catch` blocks in async handlers.

---

## 8. Verification & QA Commands

Always run these verification commands before completing any task:
```powershell
cd "frontend-next"

# 1. Verify TypeScript types compile cleanly with zero errors
npx tsc --noEmit

# 2. Verify all files adhere to the strict line count limit (≤ 350 lines)
cd ..
node check-line-counts.js
```
