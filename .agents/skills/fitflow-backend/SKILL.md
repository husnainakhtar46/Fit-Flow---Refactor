---
name: fitflow-backend
description: >-
  Expert engineering rules and workflows for building and maintaining the Fit-Flow QMS Backend
  (Django 5.x, Django REST Framework, SimpleJWT, ReportLab PDF generation, Pillow, and RBAC permissions).
  Use this skill whenever creating, modifying, refactoring, or debugging backend code in backend/.
---

# Fit-Flow QMS — Backend AI Agent Skill & Maintainability Guide

This skill governs all backend development within `backend/`. Every AI agent working on this codebase must follow these standards to guarantee that the REST API remains clean, performant, secure, and **instantly understandable for human engineers working on the project at any later stage**.

---

## 1. Golden Architectural Laws

### A. Strict File Size Limit (≤ 300–350 Lines)
- **Hard Limit**: Every Python (`.py`) file must remain strictly under **300–350 lines**.
- **Domain Partitioning**: Never dump multiple models, serializers, or views into monolithic files.
  - Models belong in `qc/models/<domain>.py` and must be exported via `qc/models/__init__.py`.
  - Serializers belong in `qc/serializers/<domain>.py` and must be exported via `qc/serializers/__init__.py`.
  - ViewSets belong in `qc/views/<domain>.py` and must be exported via `qc/views/__init__.py`.
  - PDF engines belong in `qc/services/pdf/<domain>_pdf.py`.
- **Exception Protocol (Rare Cases)**:
  > In rare, exceptional cases where a file cannot logically be decomposed below 350 lines (e.g. intricate multi-page ReportLab canvas renderers where breaking flowables across files introduces severe state coupling), the agent **MUST NOT** silently exceed the limit. The agent **MUST prompt the user and obtain explicit permission** with a clear technical justification before creating or expanding such a file.

### B. Master Directory Map
```
backend/
├── manage.py
├── quality_check/               # Project Root & Settings
│   ├── urls.py                  # Master URL routing & router registrations
│   └── settings/
│       ├── base.py              # Base Django, DRF, JWT, CORS configurations
│       ├── local.py             # Local dev settings (SQLite, Debug)
│       └── __init__.py          # Dynamic environment export
└── qc/                          # Core Quality Check Application
    ├── models/                  # Domain-partitioned data models
    │   ├── core.py              # Base Customer, Factory, InspectionImage
    │   ├── template.py          # POM Templates and points of measure
    │   ├── evaluation.py        # Sample evaluation & measurements
    │   ├── final_inspection.py  # Final inspection, defects, cartons
    │   ├── style_cycle.py       # Style master, stage comments, timeline
    │   └── __init__.py          # Clean module re-exports
    ├── serializers/             # Modular DRF serializers
    ├── views/                   # Specialized ViewSets & API endpoints
    ├── services/pdf/            # ReportLab PDF report generation engines
    ├── permissions.py           # Centralized RBAC permission classes
    ├── filters.py               # django-filters classes
    ├── otp_utils.py             # HMAC SHA-256 OTP utilities
    ├── utils.py                 # Math, image compression, formatting helpers
    └── tests.py                 # Automated unit test suite
```

---

## 2. DRF & ORM Best Practices (Zero N+1 Queries)

### A. Eager Loading Discipline in `get_queryset()`
Never allow database N+1 queries. Every ViewSet `get_queryset()` must explicitly eager-load related data:
```python
def get_queryset(self):
    queryset = Inspection.objects.select_related(
        'customer', 'template', 'created_by'
    ).order_by('-created_at')

    # Only prefetch nested children when retrieving single object or non-list actions
    if self.action != 'list':
        queryset = queryset.prefetch_related(
            'measurements__samples',
            Prefetch('images', queryset=InspectionImage.objects.only('id', 'caption', 'image'))
        )
    return queryset
```

### B. Specialized List vs Detail Serializers
- Use lightweight serializers for list endpoints (e.g., `InspectionListSerializer`) to omit bulky nested measurement grids and base64/image blobs.
- Use full serializers for retrieve/update endpoints (e.g., `InspectionSerializer`, `InspectionCopySerializer`).
- Implement dynamic serializer dispatch in ViewSets:
```python
def get_serializer_class(self):
    if self.action == 'list':
        return InspectionListSerializer
    return InspectionSerializer
```

### C. Clean ViewSet Actions
Use DRF `@action` decorators for non-CRUD endpoints:
```python
@action(detail=True, methods=['get'])
def pdf(self, request, pk=None):
    inspection = self.get_object()
    buffer = generate_pdf_buffer(inspection)
    return FileResponse(buffer, filename=f"{inspection.style}_Report.pdf", content_type="application/pdf")

@action(detail=False, methods=['get'])
def drafts(self, request):
    drafts = self.get_queryset().filter(is_draft=True, created_by=request.user)
    serializer = self.get_serializer(drafts, many=True)
    return Response(serializer.data)
```

---

## 3. Role-Based Access Control (RBAC) Architecture

All endpoints must enforce role permissions defined in `qc/permissions.py`:

| Role | Permitted Actions |
|---|---|
| **`admin` / Superuser** | Full access to all endpoints, configurations, and deletions. |
| **`quality_head`** | Full CRUD on Evaluations, Final Inspections, Customers, Factories, Templates, and Dashboard KPIs. |
| **`quality_supervisor`**| Edit all Evaluations and Final Inspections; manage Factories; view Dashboard KPIs. |
| **`qa`** | Create Inspections; Edit/Delete **only their own** inspections (`obj.created_by == user`). |
| **`merchandiser`** | Read-only inspection access; Record **Customer Feedback** decisions and comments; Manage Style Cycles. |

**Standard Permission Classes**:
- `CanEditEvaluation`
- `CanEditFinalInspection`
- `CanAddCustomerFeedback`
- `IsQualityHeadOrAdmin`
- `IsMerchandiser`
- `IsQualityStaff`
- `CanViewDashboard`
- `CanManageTemplates`

---

## 4. Domain-Specific Engineering Workflows

### A. ReportLab PDF Generation Engines (`qc/services/pdf/`)
1. **Separation**: Keep `evaluation_pdf.py` and `final_inspection_pdf.py` in `qc/services/pdf/`.
2. **Buffer Strategy**: Always generate PDFs in an in-memory `io.BytesIO()` buffer and return via Django `FileResponse`.
3. **Numbered Canvas**: Use a custom `NumberedCanvas` class to dynamically calculate and render "Page X of Y" footers and timestamp watermarks on the final canvas pass.
4. **Tolerance Deviation Styling**: Color-code measurements dynamically:
   - Green / Bold: within tolerance bounds (`std - tol` to `std + tol`).
   - Red / Warning: out of tolerance bounds.
5. **Image Embedding**: Scale images safely using Pillow before adding to the story flowable to prevent layout page overflows.

### B. Secure HMAC SHA-256 OTP Workflow (`qc/otp_utils.py`)
- Generate 6-digit numeric OTPs with a cryptographically secure SHA-256 HMAC digest.
- Enforce strict time-to-live (e.g. 10 minutes).
- Invalidate OTP immediately upon successful verification to prevent replay attacks.

### C. Image Uploads & Compression (`qc/utils.py`)
- Always process uploaded image files through `process_and_compress_image()` to normalize orientation (EXIF correction) and compress large JPEGs/PNGs to Web-friendly sizes before writing to storage.

### D. Data Integrity & Migration Standards
- Use UUID primary keys (`id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`) for core domain records.
- Set sensible `on_delete` behaviors:
  - `models.CASCADE` for owned child entities (`Measurement`, `Defect`, `SizeBreakdown`).
  - `models.SET_NULL` with `null=True, blank=True` for referenced master data (`Customer`, `Template`, `created_by`).
- Include audit timestamps (`created_at = models.DateTimeField(auto_now_add=True)`, `updated_at = models.DateTimeField(auto_now=True)`).

---

## 5. Human Maintainability & Clean Code Checklist

To make sure a human developer reading backend code can immediately understand and modify it:

1. **Explicit Docstrings**:
   - Every ViewSet, Model class, custom action, and service function must have a concise docstring explaining its purpose and permission rules.
2. **Clear Error Envelopes**:
   - Return structured error JSON payloads:
   ```python
   return Response({"error": "Descriptive reason for error"}, status=status.HTTP_400_BAD_REQUEST)
   ```
3. **Serializer Validation Logs**:
   - When handling nested writes in `.create()` or `.update()`, log or print validation errors clearly when debugging to prevent silent 400 failures.
4. **No Side-Effects in Properties**:
   - Model `@property` methods must be lightweight calculations and must never trigger database queries or write operations.

---

## 6. Anti-Patterns to Avoid

- ❌ **No Monolithic `views.py`**: Never combine evaluation, final inspection, templates, and styles into a single 800-line view file.
- ❌ **No Raw SQL Queries**: Use Django ORM queries with proper indexing and `select_related`/`prefetch_related`.
- ❌ **No Unprotected Endpoints**: Never leave mutation endpoints without authentication and permission classes.
- ❌ **No Hardcoded Server Paths**: Always use `django.conf.settings` (`MEDIA_ROOT`, `STATIC_ROOT`, `BASE_DIR`).
- ❌ **No Unused Imports**: Keep imports clean, sorted, and free of circular dependencies.

---

## 7. Verification & Test Commands

Always verify your backend changes using:
```powershell
cd "backend"

# 1. Run automated test suite
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py test

# 2. Check for missing or broken migrations
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py makemigrations --dry-run --check

# 3. Verify all files adhere to the strict line count limit (≤ 350 lines)
cd ..
node check-line-counts.js
```
