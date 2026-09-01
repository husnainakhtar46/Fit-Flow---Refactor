---
name: nextjs-conventions
description: >-
  Precise conventions for the Fit-Flow Next.js 15 frontend, extracted directly
  from the live codebase. Covers routing, server/client component boundary,
  data-fetching patterns, form validation, styling, state management, and
  the offline-first PWA architecture. Use this skill when writing or reviewing
  any frontend code in frontend-next/.
---

# Fit-Flow Next.js Conventions

These conventions are derived from reading the actual code in `frontend-next/`. Match existing patterns exactly.

---

## 1. Router & Framework Versions

| Concern | Actual Version / Choice |
|---|---|
| Framework | Next.js 15 (App Router) — **not** Pages Router |
| React | React 19 |
| TypeScript | 5.7 |
| Styling | Tailwind CSS 3.4 |
| UI primitives | shadcn/ui (Radix UI) in `components/ui/` |
| Icons | `lucide-react` |
| Charts | `recharts` |

---

## 2. Route Structure (`app/`)

```
app/
├── (auth)/                   # Public routes — no auth required
│   ├── login/page.tsx
│   ├── forgot-password/page.tsx
│   └── verify-reset-password/page.tsx
├── (app)/                    # Protected routes — authenticated users only
│   ├── layout.tsx            # App shell: Sidebar + MobileHeader + offline bar
│   ├── page.tsx              # Redirects to /evaluation
│   ├── evaluation/page.tsx
│   ├── final-inspections/page.tsx
│   ├── style-cycle/page.tsx
│   ├── dashboard/page.tsx
│   ├── customer-feedback/page.tsx
│   ├── templates/page.tsx
│   ├── customers/page.tsx
│   ├── factories/page.tsx
│   └── resources/page.tsx
├── layout.tsx                # Root layout (wraps providers.tsx)
└── providers.tsx             # TanStack QueryClient provider
```

**Rule**: Page files (`page.tsx`) are **thin shells** — they import and render the feature view component only. All logic lives in `features/`.

---

## 3. Server vs Client Component Boundary

- **Server components** (`'use server'` or no directive): `app/` page files, root `layout.tsx`.
- **Client components** (`'use client'`): All feature components, all hooks, all components that use state, effects, browser APIs, or event handlers.
- `'use client'` is already declared at the top of all interactive files — always add it when a file uses `useState`, `useEffect`, `useQuery`, `useMutation`, event handlers, or browser-only APIs.

---

## 4. Data Fetching — TanStack Query v5

**All server data fetching goes through TanStack Query v5 (`@tanstack/react-query`).**  No `fetch()` calls in components, no `useEffect` for data loading, no SWR, no server actions for data fetching.

### A. Query Key Convention (Hierarchical Arrays)
```typescript
['inspections', 'list', filters]         // list with filters
['inspections', 'detail', inspectionId]  // single record
['inspections', 'drafts']                // drafts sub-resource
['customers', 'list']
['templates', 'by-customer', customerId]
['final-inspections', 'list', filters]
['styles', 'list', { customer, factory }]
['sample-comments', 'by-style', styleId]
['dashboard', filters]
```

### B. Mutation Pattern with Cache Invalidation
```typescript
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data: InspectionFormData) => api.post('/api/inspections/', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
    toast.success('Inspection created successfully');
  },
  onError: (error: AxiosError<{ error: string }>) => {
    const msg = error.response?.data?.error || error.message || 'Failed to save';
    toast.error(msg);
  },
});
```

### C. QueryClient Config
Global instance in `lib/queryClient.ts`. Do not create additional `QueryClient` instances.

---

## 5. HTTP Client — Axios (`lib/api.ts`)

- Single Axios instance exported as `api` from `lib/api.ts`.
- Base URL: `process.env.NEXT_PUBLIC_API_URL` → falls back to `http://localhost:8000`.
- **Request interceptor**: Injects `Authorization: Bearer <access_token>` from `localStorage`.
- **Response interceptor**: On 401, attempts silent token refresh via `POST /api/token/refresh/`; on failure, clears localStorage and redirects to `/login`.
- **Rule**: All API calls go through `api` from `lib/api.ts`. Never import Axios directly in feature code.

---

## 6. Form Validation — React Hook Form + Zod

- **Library**: `react-hook-form` v7 + `@hookform/resolvers/zod` + `zod` v3.
- Declare a Zod schema for every complex form; pass it to `useForm` via `zodResolver`.
- Never trust raw `request.data` — always validate through the Zod schema before calling a mutation.

---

## 7. State Management

- **Server state**: TanStack Query (cache + mutations).
- **Form state**: React Hook Form (`useForm`, `useFieldArray`).
- **UI state** (modals open, selected rows, etc.): local `useState` within the component or feature hook.
- **Auth state**: `useAuth()` from `lib/auth.ts` (reads from `localStorage`; no global context or Zustand).
- **Offline data**: Dexie.js (`lib/db.ts`) for IndexedDB.
- There is **no Redux, Zustand, or Context API** for global state — do not introduce them.

---

## 8. Auth & RBAC — `useAuth()` from `lib/auth.ts`

```typescript
const { canEditEvaluation, canAddCustomerFeedback, userType, isAuthenticated } = useAuth();
```

Always guard action buttons and mutating UI with the appropriate permission:
```tsx
{auth.canEditEvaluation && (
  <Button onClick={handleEdit}>Edit</Button>
)}
```

Auth state is derived from `localStorage` on mount. Keys stored: `access_token`, `refresh_token`, `user_type`, `is_superuser`, `user_id`.

---

## 9. Offline-First PWA — Dexie.js (`lib/db.ts`)

Database: `FitFlowDB` v4, tables:

| Table | Type | Key | Purpose |
|---|---|---|---|
| `inspections` | `OfflineInspection` | `++id` | Full pending-sync records |
| `customers` | `CachedCustomer` | `id` | Master data cache |
| `factories` | `CachedFactory` | `id` | Master data cache |
| `templates` | `CachedTemplate` | `id` | Master data cache |
| `drafts` | `DraftEntry` | `draftKey` | In-progress form auto-saves |

Draft key convention: `eval_draft_${serverId || 'new'}` / `fi_draft_${serverId || 'new'}`

Offline submission check:
```typescript
if (!navigator.onLine) {
  await db.inspections.add({ formData, images, createdAt: Date.now(), status: 'pending_sync', type: 'evaluation' });
  toast.info('Saved offline. Will sync when online.');
  return;
}
```

Sync UI: `components/shared/SyncManager.tsx`

---

## 10. Styling — Tailwind CSS

- **No inline `style` props** unless Tailwind cannot express the value (e.g. dynamic pixel widths).
- **Mobile-first**: Start with mobile styles, then `md:`, `lg:` breakpoints.
- **Class merging**: Always use `cn()` from `lib/utils.ts` (`clsx` + `tailwind-merge`) when combining conditional class strings.
- **Colour system**: Use Tailwind CSS variables defined in `tailwind.config.ts` (shadcn/ui theme tokens like `primary`, `muted`, `destructive`, etc.).

---

## 11. Toast Notifications — `sonner`

Always use `sonner` for user feedback:
```typescript
import { toast } from 'sonner';
toast.success('Saved successfully');
toast.error('Failed to upload');
toast.info('Saved offline. Will sync when online.');
```
Never use `alert()`, `console.log` for user-facing messages, or browser `confirm()`.

---

## 12. Feature Module Structure

Each feature in `features/<feature-name>/` must follow this layout:
```
features/<feature>/
├── types.ts            ← All TypeScript interfaces for this feature
├── use<Feature>.ts     ← TanStack Query hooks, mutations, offline queue
├── use<Feature>Grid.ts ← Measurement grid / paste logic (if applicable)
├── <Feature>ListView.tsx  ← Data table / list
├── <Feature>FormView.tsx  ← Modal / form editor
└── <SubSection>.tsx    ← Individual form sections (≤ 250 lines each)
```

---

## 13. Open Questions / Known Gaps

1. **JWT stored in localStorage** — tokens are exposed to XSS. HttpOnly cookies are not used. This is an intentional trade-off for PWA offline support. Do not change this without an explicit decision.
2. **No Jest or Playwright tests** — there is no frontend test suite. If adding tests, confirm the framework choice before creating test files.
3. **No Next.js API Route Handlers** — the frontend makes no use of `app/api/` routes. All mutations go directly to the Django backend. Do not create API routes without discussion.
4. **`canViewResources`** is only for `quality_head` — confirm before exposing it to other roles.
