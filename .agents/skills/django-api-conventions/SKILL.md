---
name: django-api-conventions
description: >-
  Precise conventions for the Fit-Flow Django REST API, extracted directly from
  the live codebase. Covers serializer patterns, ViewSet structure, URL naming,
  error response shape, pagination, and which permission classes are actually used.
  Use this skill when writing or reviewing any backend API code.
---

# Fit-Flow Django API Conventions

These conventions are derived from reading the actual code in `backend/qc/`. Do not invent alternatives — match existing patterns exactly.

---

## 1. Auth & Session Strategy

- **Auth method**: JWT via `djangorestframework-simplejwt`.
  - Tokens obtained at `POST /api/token/` via `CustomTokenObtainPairView`.
  - Token refresh at `POST /api/token/refresh/`.
  - Access token lifetime: **1 day** (`SIMPLE_JWT` in `settings/base.py`).
  - Clients store tokens in `localStorage` (keys: `access_token`, `refresh_token`, `user_type`, `is_superuser`, `user_id`).
- **Login response payload** (`CustomTokenObtainPairSerializer`):
  ```json
  { "access": "...", "refresh": "...", "username": "...", "user_id": "...", "is_superuser": false, "user_type": "qa" }
  ```
- **Global DRF defaults** (`REST_FRAMEWORK` in `base.py`):
  - Authentication: `JWTAuthentication`
  - Permission: `IsAuthenticated` (global default; endpoints override per domain)
  - Pagination: `PageNumberPagination`, `PAGE_SIZE = 10`

---

## 2. URL Naming & Router Registration

All ViewSets are registered on a single `DefaultRouter` in `quality_check/urls.py`. The router is mounted at both `/` and `/api/` for backwards compatibility — do not remove either mount.

```python
router.register(r"customers",             CustomerViewSet)
router.register(r"templates",             TemplateViewSet)
router.register(r"inspections",           InspectionViewSet)
router.register(r"filter-presets",        FilterPresetViewSet, basename="filterpreset")
router.register(r"final-inspections",     FinalInspectionViewSet)
router.register(r"factories",             FactoryViewSet)
router.register(r"styles",                StyleMasterViewSet)
router.register(r"sample-comments",       SampleCommentViewSet)
router.register(r"sample-comment-images", SampleCommentImageViewSet)
router.register(r"style-links",           StyleLinkViewSet)
```

Non-router views:
```
POST /api/token/            → CustomTokenObtainPairView
POST /api/token/refresh/    → TokenRefreshView
GET  /api/dashboard/        → DashboardView
/api/auth/                  → qc.auth_urls (OTP password reset)
```

---

## 3. Serializer Patterns

### A. File Placement
| Domain | File |
|---|---|
| Auth JWT payload | `qc/serializers/auth.py` |
| Customer, Factory, Template, FilterPreset | `qc/serializers/common.py` |
| Inspection, Measurement, MeasurementSample | `qc/serializers/evaluation.py` |
| FinalInspection + all child records | `qc/serializers/final_inspection.py` |
| StyleMaster, SampleComment, StyleLink | `qc/serializers/style_cycle.py` |
| Package re-export | `qc/serializers/__init__.py` |

### B. Nested Write Pattern (Delete & Recreate)
All nested writes use full replacement in `update()` — **not** incremental patching:
```python
def update(self, instance, validated_data):
    children_data = validated_data.pop("measurements", None)
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    instance.save()
    if children_data is not None:
        instance.measurements.all().delete()
        for item in children_data:
            Measurement.objects.create(inspection=instance, **item)
    return instance
```
> Clients must always resend the full children array on every update.

### C. List vs Detail Serializers
Every complex resource has two serializers:
- `*ListSerializer` — lightweight, no nested children. Used for `list` action.
- `*Serializer` (full) — all nested data. Used for `retrieve`, `create`, `update`.
```python
def get_serializer_class(self):
    if self.action == 'list':
        return InspectionListSerializer
    return InspectionSerializer
```

### D. `to_internal_value()` Input Normalisation
Serializers normalise ambiguous input before calling `super()`:
- `""` or `"null"` string → `None` for nullable FK/float fields.
- Customer field accepts UUID **or** a name string (auto-creates `Customer` if not found).
- Template field accepts UUID **or** name string (lookup only, no auto-create).

### E. Error Response Shape
Always return a structured JSON error envelope:
```python
return Response({"error": "Descriptive message"}, status=status.HTTP_400_BAD_REQUEST)
```
Never return raw strings or unstructured dicts for error conditions.

---

## 4. ViewSet Structure

### A. Eager Loading — Zero N+1 Rule
Every `get_queryset()` must `select_related()` all ForeignKey/OneToOne fields and `prefetch_related()` reverse relations. Conditionally skip deep prefetches on `list` action:
```python
def get_queryset(self):
    qs = Inspection.objects.select_related('customer', 'template', 'created_by').order_by("-created_at")
    if self.action != 'list':
        qs = qs.prefetch_related(
            'measurements',
            Prefetch('images', queryset=InspectionImage.objects.only('id', 'caption'))
        )
    return qs
```

### B. `perform_create` — Always Stamp `created_by`
```python
def perform_create(self, serializer):
    serializer.save(created_by=self.request.user)
```

### C. Custom Actions in Use
| ViewSet | `@action` name | Methods | Relative URL |
|---|---|---|---|
| `InspectionViewSet` | `pdf` | GET | `/{pk}/pdf/` |
| `InspectionViewSet` | `drafts` | GET | `/drafts/` |
| `InspectionViewSet` | `upload_image` | POST | `/{pk}/upload_image/` |
| `InspectionViewSet` | `send_email` | POST | `/{pk}/send_email/` |
| `InspectionViewSet` | `update_customer_feedback` | PATCH | `/{pk}/update_customer_feedback/` |
| `FinalInspectionViewSet` | `pdf` | GET | `/{pk}/pdf/` |
| `FinalInspectionViewSet` | `drafts` | GET | `/drafts/` |
| `FinalInspectionViewSet` | `upload_image` | POST | `/{pk}/upload_image/` |
| `FinalInspectionViewSet` | `send_email` | POST | `/{pk}/send_email/` |
| `FinalInspectionViewSet` | `calculate_aql` | POST | `/calculate_aql/` |
| `StyleMasterViewSet` | `by_po` | GET | `/by_po/?po_number=...` |
| `StyleMasterViewSet` | `comments` | GET/POST | `/{pk}/comments/` |
| `SampleCommentViewSet` | `upload_image` | POST | `/{pk}/upload_image/` |

---

## 5. Filtering & Search

`InspectionFilter` (`qc/filters.py`, `django-filters` `FilterSet`):
- `date_from`, `date_to` — date range on `created_at`
- `decision`, `stage` — `MultipleChoiceFilter`
- `customer` — `UUIDFilter` on `customer__id`
- `factory` — `CharFilter`, exact match
- `search` — custom method: `icontains` across `style`, `po_number`, `customer__name`, `created_by__username`, `factory`

`FinalInspectionViewSet` — inline query-param filtering in `get_queryset()` (no `FilterSet`):
- `customer` (UUID), `result`, `date_from`, `date_to`

`StyleMasterViewSet` — DRF `SearchFilter` across: `po_number`, `style_name`, `customer__name`, `season`, `factory__name`

---

## 6. Image Upload Pattern

1. Accept `multipart/form-data` POST.
2. Call `process_and_compress_image(image_file)` from `qc/utils.py`.
3. Create model instance directly (no additional serializer validation for image fields).
4. Return `201 Created` with serialised image data or `{"status": "Image uploaded and compressed"}`.

---

## 7. Email Dispatch Pattern

Email sent via `qc/gmail_service.py` → `queue_email()`. Writes `EmailOutbox` row (`PENDING`) and sends in a background thread. API always returns immediately:
```json
{ "queued": true, "to": [...], "cc": [...], "message": "Email queued." }
```

---

## 8. Permission Classes Reference

Defined in `qc/permissions.py`. Helper `get_user_type(user)` reads `user.profile.user_type` (falls back to `'qa'`; superuser → `'admin'`).

| Class | Who can mutate | Who can read |
|---|---|---|
| `CanEditEvaluation` | `qa` (own only), `quality_head`, `quality_supervisor` | Everyone authenticated |
| `CanEditFinalInspection` | `qa` (own only), `quality_head`, `quality_supervisor` | Everyone authenticated |
| `CanAddCustomerFeedback` | `merchandiser` only | Everyone authenticated |
| `IsQualityHeadOrAdmin` | `quality_head`, superuser | Everyone authenticated |
| `CanManageTemplates` | `quality_head`, superuser | All except `merchandiser` |
| `IsQualityStaff` | `qa`, `quality_head`, `quality_supervisor` | Same |
| `IsMerchandiser` | `merchandiser`, superuser | Same |
| `CanViewDashboard` | — | `quality_head`, `quality_supervisor`, superuser |

---

## 9. Open Questions / Known Gaps

1. **No `FinalInspectionFilter` class** — filtering is inline in `get_queryset()`. Ask before adding a `FilterSet`.
2. **No rate limiting** on any endpoint — do not silently add it; discuss the mechanism first.
3. **`StyleMasterViewSet` uses `IsAuthenticated` only** — no domain-specific permission class. Intentional or oversight? Confirm before changing.
4. **`SampleCommentViewSet` also `IsAuthenticated` only** — same question as above.
