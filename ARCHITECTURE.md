# Fit-Flow QMS — Architecture Map & Developer Guide

Welcome to the **Fit-Flow Quality Management System (QMS)** codebase. This document is a complete architectural reference designed for developers to quickly understand the structure, file responsibilities, data flows, and design conventions across the backend and frontend.

---

## 1. Project Overview & Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 18/19, TypeScript, Tailwind CSS, `@tanstack/react-query`, Dexie.js (IndexedDB), `@ducanh2912/next-pwa` | Modern, responsive PWA with offline drafting, dynamic tables, TSV spreadsheet paste, and real-time AQL verification. |
| **Backend** | Django 4.x/5.x, Django REST Framework (DRF), `djangorestframework-simplejwt`, ReportLab, Pillow, SQLite/PostgreSQL | Modular REST API with role-based access control (RBAC), OTP password recovery, and multi-page PDF generation. |
| **Architectural Rules** | **Strict ≤ 300–350 lines per file** | Every frontend and backend file is scoped to a single responsibility for maximum maintainability and readability. |

---

## 2. Master Directory Map

```
Fit Flow - Refactor/
├── ARCHITECTURE.md                  # This file - Complete architecture guide
├── check-line-counts.js             # Utility to verify all files are ≤ 350 lines
│
├── backend/                         # Django REST Framework Backend
│   ├── manage.py
│   ├── quality_check/               # Project Root & Settings
│   │   ├── __init__.py
│   │   ├── asgi.py & wsgi.py
│   │   ├── urls.py
│   │   └── settings/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       └── local.py
│   └── qc/                          # Quality Control Core App
│       ├── models/                  # Decomposed Domain Models
│       ├── serializers/             # Modular DRF Serializers
│       ├── views/                   # Specialized ViewSets & Endpoints
│       ├── services/pdf/            # ReportLab PDF Engines
│       ├── tests/                   # Automated Test Suite (19 tests)
│       ├── auth_urls.py & urls.py
│       ├── filters.py & admin.py
│       ├── otp_utils.py & utils.py
│       └── apps.py
│
└── frontend-next/                   # Next.js 15 App Router Frontend
    ├── package.json
    ├── tsconfig.json & next.config.ts
    ├── tailwind.config.ts
    ├── public/                      # Static assets, icons, manifest, service worker
    │   ├── icons/
    │   ├── manifest.json
    │   └── sw.js
    ├── app/                         # Next.js Route Handlers & Pages
    │   ├── (auth)/                  # Public Auth Routes (Login, Password Reset)
    │   ├── (app)/                   # Protected App Shell & Feature Pages
    │   ├── layout.tsx & globals.css
    │   └── providers.tsx
    ├── features/                    # Modular Feature Slices (Hooks, Tables, Modals)
    │   ├── evaluation/
    │   ├── final-inspection/
    │   ├── style-cycle/
    │   ├── dashboard/
    │   ├── templates/
    │   ├── customers/
    │   ├── factories/
    │   ├── customer-feedback/
    │   └── inspection-filters/
    ├── components/                  # Shared & Reusable UI Components
    │   ├── layout/                  # Shell layout (Sidebar, MobileNav, Headers)
    │   ├── shared/                  # Common widgets (Pagination, Selects, Filters, Sync)
    │   ├── inspection/              # Inspection-specific widgets (AQLCard, Defects, Images)
    │   ├── pdf/                     # Client-side PDF layouts & renderers
    │   └── ui/                      # Base shadcn/ui primitive components
    ├── hooks/                       # Reusable Custom React Hooks
    ├── lib/                         # Core Utilities (API client, Auth RBAC, Offline DB, AQL)
    └── utils/                       # Date formatters & helpers
```

---

## 3. Backend Architecture Map (`backend/`)

The backend is partitioned by domain and responsibility:

### `backend/quality_check/settings/`
- **`base.py`**: Core Django & DRF settings, JWT lifetime (`SIMPLE_JWT`), CORS headers, installed apps, static/media path configurations.
- **`local.py`**: Local development overrides (SQLite database defaults, local debug mode).
- **`__init__.py`**: Dynamically exports local settings.

### `backend/qc/models/` (Data Entities)
- **`core.py`**: Base inspection records (`Inspection`), defect classifications (`Defect`), and attached evaluation photos (`InspectionImage`).
- **`template.py`**: Reusable measurement templates (`Template`) and their points of measure (`TemplatePOM`).
- **`evaluation.py`**: Sample measurement records (`Measurement`), wash care tests (`WashCareEvaluation`), and accessory checks (`AccessoryEvaluation`).
- **`final_inspection.py`**: Final inspection audit (`FinalInspection`), defect counts (`FinalInspectionDefect`), carton/color size breakdowns (`SizeBreakdown`), and garment photos (`FinalInspectionImage`).
- **`style_cycle.py`**: Product development lifecycle (`StyleCycle`), timeline stage comments (`SampleComment`), and stage photos (`CommentImage`).
- **`__init__.py`**: Re-exports all models so Django migrations and foreign keys work seamlessly.

### `backend/qc/serializers/` (Data Serialization & Validation)
- **`auth.py`**: `CustomTokenObtainPairSerializer` — returns JWT access/refresh tokens along with `user_id`, `username`, `user_type`, and `is_superuser`.
- **`common.py`**: Serializers for `Customer`, `CustomerEmail`, `Factory`, and `InspectionImage`.
- **`evaluation.py`**: Serializers for `Measurement`, `WashCareEvaluation`, `AccessoryEvaluation`, and full `InspectionSerializer`.
- **`final_inspection.py`**: Serializers for `FinalInspectionDefect`, `SizeBreakdown`, `FinalInspectionImage`, and `FinalInspectionSerializer`.
- **`style_cycle.py`**: Serializers for `CommentImage`, `SampleComment`, and `StyleCycleSerializer`.
- **`__init__.py`**: Clean package export.

### `backend/qc/views/` (API Endpoints & Controllers)
- **`auth.py`**: `CustomTokenObtainPairView`, `PasswordResetRequestView`, `PasswordResetVerifyView`.
- **`common.py`**: `CustomerViewSet`, `FactoryViewSet`, `TemplateViewSet`.
- **`evaluation.py`**: `InspectionViewSet` (includes `/drafts/`, `/upload_image/`, `/pdf/`, `/send_email/`).
- **`final_inspection.py`**: `FinalInspectionViewSet` (includes `/upload_image/`, `/pdf/`, `/send_email/`).
- **`style_cycle.py`**: `StyleCycleViewSet`, `SampleCommentViewSet`, `CommentImageViewSet`.
- **`__init__.py`**: Clean package export.

### `backend/qc/services/pdf/` (PDF Engine)
- **`evaluation_pdf.py`**: Generates multi-page ReportLab sample evaluation reports with tabular POM measurements, tolerance deviation color coding, and embedded images.
- **`final_inspection_pdf.py`**: Generates ISO 2859-1 final inspection reports with AQL verdict badges, defect summaries, carton breakdown, and photo galleries.

### `backend/qc/` (Utilities & Helpers)
- **`otp_utils.py`**: Secure SHA-256 HMAC 6-digit OTP generation and time-based expiration validation.
- **`utils.py`**: Standard deviation calculations, fraction-to-decimal rounding, and numeric helpers.
- **`filters.py`**: `django-filters` classes for date ranges, stages, decisions, customers, and factories.
- **`tests/`**: Unit test suite covering AQL calculations, OTP workflows, PDF generation, and CRUD operations.

---

## 4. Frontend Architecture Map (`frontend-next/`)

### `app/` (Routing & App Shell)
- **`app/(auth)/login/page.tsx`**: Login screen with JWT storage and redirect.
- **`app/(auth)/forgot-password/page.tsx`**: Email prompt for OTP password reset.
- **`app/(auth)/verify-reset-password/page.tsx`**: 6-digit OTP verification and password update form.
- **`app/(app)/layout.tsx`**: Authenticated app shell containing sidebar navigation, mobile header, and offline status bar.
- **`app/(app)/page.tsx`**: Root route — automatically redirects authenticated users to `/evaluation`.
- **`app/(app)/evaluation/page.tsx`**: Sample Evaluation route entry.
- **`app/(app)/final-inspections/page.tsx`**: Final Inspection route entry.
- **`app/(app)/style-cycle/page.tsx`**: Style Cycle timeline route entry.
- **`app/(app)/dashboard/page.tsx`**: KPI Analytics and Charts route entry.
- **`app/(app)/customer-feedback/page.tsx`**: External Customer Approval & Feedback route entry.
- **`app/(app)/templates/page.tsx`**: Style Measurement Templates management route entry.
- **`app/(app)/customers/page.tsx`**: Customer Directory & Email Notification Lists entry.
- **`app/(app)/factories/page.tsx`**: Manufacturing Facilities directory entry.
- **`app/(app)/resources/page.tsx`**: Centralized master data hub navigation.

---

### `features/` (Domain-Driven Feature Modules)

#### 1. `features/evaluation/` (Sample Evaluation Module)
- **`types.ts`**: TypeScript interfaces for evaluations, measurements, wash care, accessories, and images.
- **`useMeasurementGrid.ts`**: Dynamic POM measurement grid logic, Excel/TSV clipboard paste handler, keyboard navigation, and tolerance deviation checker.
- **`useEvaluationDrafts.ts`**: Offline draft autosaving (Dexie.js) and server draft sync.
- **`useEvaluationForm.ts`**: Form orchestration, TanStack Query hooks, mutations, offline submission queue, and PDF download handlers.
- **`MeasurementTable.tsx`**: Dynamic POM measurement table UI.
- **`CommentSection.tsx`**: Internal QA comments and customer feedback sync.
- **`FabricAccessories.tsx`**: Fabric quality checks and accessories checklist.
- **`ImageGallery.tsx`**: Garment photo dropzones (Front, Back, Wash Label, Details).
- **`EvaluationListView.tsx`**: Evaluation report table, search, filters, server drafts badge, and PDF dispatch.
- **`EvaluationFormView.tsx`**: Modal dialog assembling all evaluation subcomponents.

#### 2. `features/final-inspection/` (Final Inspection Module)
- **`types.ts`**: Interfaces for Final Inspection, defects, size breakdown, and AQL calculations.
- **`useFIGrid.ts`**: Measurement grid logic with Excel copy/paste support for final inspections.
- **`useFIDrafts.ts`**: Draft persistence hook for final inspections.
- **`useFinalInspection.ts`**: AQL reactive calculations, mutations, offline queueing, and PDF dispatch.
- **`GeneralInfoSection.tsx`**: PO number, Style lookup, inspection stage, AQL level, code letter.
- **`SizeBreakdown.tsx`**: Carton and color/size quantity matrix table.
- **`FIMeasurementChart.tsx`**: Measurement audit table with sample deviations.
- **`DefectSection.tsx`**: Critical, Major, and Minor defect counters + real-time AQL verdict card.
- **`FIShipmentRemarks.tsx`**: Packaging, labeling, barcode checklist, and overall verdict.
- **`FinalInspectionListView.tsx`**: Searchable inspection records table with PDF and email actions.
- **`FinalInspectionFormView.tsx`**: Comprehensive modal dialog form.

#### 3. `features/style-cycle/` (Style Cycle Module)
- **`types.ts`**: Type definitions for style cycles, sample stages (Proto, Fit, SMS, Pre-Prod, Top), and comments.
- **`useStyleCycle.ts`**: Queries and mutations for styles, comments, and image uploads.
- **`CommentImageTiles.tsx`**: Stage photo gallery with thumbnail previews and lightbox modal.
- **`CommentEditForm.tsx`**: Dialog form to add/edit stage feedback, fit comments, and photos.
- **`SampleCommentCard.tsx`**: Chronological timeline card representing a sample review stage.
- **`StyleDetailView.tsx`**: Full style header with revision history and stage timeline.
- **`StyleListView.tsx`**: Grid of style cards with customer filtering and creation modal.

#### 4. `features/dashboard/` (Analytics Module)
- **`types.ts`**: Metric and chart interfaces.
- **`StatCard.tsx`**: KPI metrics card (Total Inspections, Pass Rate, Defect Rates).
- **`EvalAnalytics.tsx`**: Evaluation analytics with stage distribution pie chart and customer volume bar chart.
- **`FinalInspAnalytics.tsx`**: Final inspection trends, pass/fail ratios, and defect Pareto analysis.
- **`DashboardPage.tsx`**: Main dashboard view with date range filter and customer/factory selectors.

#### 5. `features/templates/` (POM Templates Module)
- **`types.ts`**: Template and POM interfaces.
- **`POMTable.tsx`**: Point of Measure table with Excel TSV paste support.
- **`TemplateForm.tsx`**: Modal dialog for creating and editing POM templates.
- **`TemplatesPage.tsx`**: Templates list table with customer filtering and pagination.

#### 6. `features/customers/` (Customers Module)
- **`EmailList.tsx`**: Multi-recipient TO/CC email notification tag editor.
- **`CustomerForm.tsx`**: Customer creation and edit modal.
- **`CustomersPage.tsx`**: Customer registry table with email badges and CRUD actions.

#### 7. `features/factories/` (Factories Module)
- **`FactoriesPage.tsx`**: Factory directory with address details and management modal.

#### 8. `features/customer-feedback/` (Customer Feedback Module)
- **`CustomerFeedbackPage.tsx`**: Dedicated page for merchandisers to record customer decisions (Accepted, Rejected, Revision Requested).

#### 9. `features/inspection-filters/` (Shared Filter Module)
- **`InspectionFilters.tsx`**: Advanced filter bar with search, date ranges, stage multi-select, and preset filters.

---

### `lib/` (Core Libraries & Utilities)
- **`api.ts`**: Axios instance with automatic JWT Bearer injection and 401 token refresh interceptor.
- **`auth.ts`**: `useAuth()` hook providing role-based permissions (`qa`, `quality_head`, `quality_supervisor`, `merchandiser`, `admin`).
- **`aqlCalculations.ts`**: Pure mathematical implementation of ISO 2859-1 AQL standards (Sample size lookup, code letters, defect acceptance/rejection limits).
- **`db.ts`**: Dexie.js (IndexedDB) database for offline inspection storage, local draft saving, and master data caching.
- **`imageUtils.ts`**: Client-side image compression utility before upload.
- **`queryClient.ts`**: Global TanStack QueryClient with optimized caching defaults.
- **`utils.ts`**: `cn()` utility combining `clsx` and `tailwind-merge`.

---

### `components/` (Shared UI Components)
- **`layout/`**:
  - `Sidebar.tsx`: Desktop navigation bar with role-based link visibility.
  - `MobileHeader.tsx` & `MobileNav.tsx`: Bottom navigation and top bar for mobile devices.
  - `MobileSidebar.tsx`: Slide-out drawer menu.
- **`shared/`**:
  - `Pagination.tsx`: Standard pagination controller.
  - `SearchableSelect.tsx`: Type-to-search dropdown for customers and styles.
  - `MultiSelectFilter.tsx`: Multi-checkbox dropdown filter.
  - `DateRangePicker.tsx`: Calendar date interval picker.
  - `FilterPresets.tsx`: One-click filter presets (e.g. "This Week", "Pending Revisions").
  - `SyncManager.tsx`: Offline synchronization widget showing pending items with 1-click batch upload.
- **`inspection/`**:
  - `AQLResultCard.tsx`: Real-time pass/fail card with defect limits.
  - `DefectCounter.tsx`: Increment/decrement defect input widget.
  - `ImageUploader.tsx`: Multi-image file picker with compression.
  - `ShipmentDetails.tsx`: Carton and shipping specifications form section.
- **`pdf/`**:
  - `PDFReport.tsx` & `EvaluationPDFReport.tsx`: Client-side report previews and layouts.
- **`ui/`**:
  - Fully accessible shadcn/ui primitives (`Button`, `Input`, `Dialog`, `AlertDialog`, `Table`, `Badge`, `Card`, `Select`, `Textarea`, `Sheet`, `Toaster`).

---

## 5. Key Workflows & Data Flows

### A. Offline Inspection Workflow
```
[User is Offline]
       │
       ▼
[Fills Evaluation / Final Inspection]
       │
       ▼
[IndexedDB: db.inspections.add()] ──► Status: 'pending_sync'
       │
[Network Reconnects]
       │
       ▼
[SyncManager triggers batch sync] ──► POST /api/inspections/
       │
       ▼
[Server returns 201 Created] ─────► IndexedDB record removed
```

### B. Excel / TSV Measurement Paste Flow
```
[User copies rows from Excel / Google Sheets]
       │
       ▼
[Pastes into POM or Measurement Grid cell]
       │
       ▼
[Clipboard event parses tab '\t' & newline '\n']
       │
       ▼
[useFieldArray updates existing rows & appends new POM rows automatically]
```

### C. AQL Verification Engine
```
[User enters Order Quantity (e.g. 5,000 pcs)]
       │
       ▼
[calculateSampleSize() -> 200 pcs, Code Letter 'L']
       │
       ▼
[calculateDefectLimits() -> Max Critical: 0, Max Major: 10, Max Minor: 14]
       │
       ▼
[User logs defect counts in DefectSection]
       │
       ▼
[Real-time calculateVerdict() -> 'PASS' / 'FAIL' / 'PENDING']
```

---

## 6. How to Run & Develop Locally

### Backend Setup (PowerShell):
```powershell
cd "backend"

# Activate the centralized virtual environment:
& "D:\Office\Scripts\.venv\Scripts\Activate.ps1"

# Or run commands directly with the venv python executable:
# 1. Install dependencies
& "D:\Office\Scripts\.venv\Scripts\python.exe" -m pip install -r requirements.txt

# 2. Run migrations
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py migrate

# 3. Run automated tests (19 tests)
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py test

# 4. Start local development server
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py runserver 8000
```

### Frontend Setup:
```powershell
cd "frontend-next"

# Install dependencies
npm install

# Run TypeScript validation
npx tsc --noEmit

# Start Next.js development server
npm run dev

# Run Production Build
npm run build
```

---

## 7. Developer Guidelines

1. **Keep Files Small**: Maintain the strict **≤ 300–350 line limit** per file. If a component or module grows, extract sub-forms, tables, or custom hooks.
2. **Type Safety**: Always use TypeScript types defined in each feature's `types.ts`. Avoid using `any` when explicit types are available.
3. **Role-Based Guards**: Always verify permissions using `useAuth()` before rendering action buttons (e.g. delete, edit, create).
4. **Offline First**: When creating new inspection forms, route submissions through the Dexie.js offline check when `!navigator.onLine`.
