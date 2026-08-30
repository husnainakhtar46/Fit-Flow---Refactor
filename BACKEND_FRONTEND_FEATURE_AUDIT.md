# Fit-Flow QMS — Backend vs Frontend Feature Gap Analysis & Audit

This document provides a complete audit comparing the **Django Backend Serializers & Models** against the **Next.js 15 Frontend UI Components**. It highlights backend data fields, endpoints, and workflows that exist in the API layer and their integration status with the frontend UI.

---

## 1. Summary Matrix

| Domain Module | Backend Serializer / Model | Feature Description | Status | Target Frontend Files |
|---|---|---|---|---|
| **Style Cycle** | `StyleMasterSerializer.factory`, `factory_name` | Factory selector when creating/editing Style Master and factory filter | ✅ **Integrated** | `StyleFormModal.tsx`, `StyleDetailView.tsx`, `StyleListView.tsx` |
| **Style Cycle** | `StyleLinkSerializer`, `StyleLinkViewSet`, `StyleMasterSerializer.links` | External Style Links (Tech Packs, 3D CLO viewers, Google Drive, PLM URLs) | ✅ **Integrated** | `StyleLinksCard.tsx`, `StyleDetailView.tsx` |
| **Final Inspection** | `FinalInspectionSerializer.carton_length/width/height`, `gross/net_weight` | Carton Dimensions (L × W × H) and Gross/Net Weight specifications | ✅ **Integrated** | `features/final-inspection/FIShipmentRemarks.tsx` |
| **Final Inspection** | `quantity_check`, `workmanship`, `packing_method`, `marking_label`, `data_measurement`, `hand_feel` | 6 Standard ISO 2859-1 shipment conformity checklist dropdowns (`Pass` / `Fail` / `NA`) | ✅ **Integrated** | `features/final-inspection/FIShipmentRemarks.tsx` |
| **Final Inspection** | `FinalInspectionSerializer.inspection_attempt`, `supplier` | Inspection Attempt (`1st`, `2nd`, `3rd (Re-inspection)`) and Supplier/Vendor name | ✅ **Integrated** | `features/final-inspection/GeneralInfoSection.tsx` |
| **Final Inspection** | `FinalInspectionDefectSerializer.photo` | Direct per-defect photo evidence upload | ✅ **Integrated** | `features/final-inspection/DefectSection.tsx` |
| **Sample Evaluation** | `InspectionSerializer.customer_remarks` | Top-level Customer Feedback Summary box | ✅ **Integrated** | `features/evaluation/CommentSection.tsx` |
| **Sample Evaluation** | `InspectionCopySerializer` | 1-Click "Duplicate / Copy as New" inspection action | ✅ **Integrated** | `features/evaluation/EvaluationListView.tsx`, `useEvaluationForm.ts` |
| **Master Data** | `FactorySerializer.contact_person` | Factory contact person name & title in form and registry table | ✅ **Integrated** | `features/factories/FactoriesPage.tsx` |
| **Master Data** | `TemplateSerializer.description` | POM Template description / notes input | ✅ **Integrated** | `features/templates/TemplateForm.tsx`, `TemplatesPage.tsx` |

---

## 2. Detailed Module Breakdown

### A. Style Cycle Module (`backend/qc/serializers/style_cycle.py`)

#### 1. Factory Selector on Style Master (Status: ✅ Integrated)
- **Backend Implementation**:
  - Model: `StyleMaster.factory` (ForeignKey to `Factory`).
  - Serializer: `StyleMasterSerializer.factory` and `factory_name`.
  - ViewSet Filter: `StyleMasterViewSet.get_queryset()` filters by `?factory=<id>`.
- **Frontend Integration**:
  - `StyleFormModal.tsx`: Added "Manufacturing Factory" dropdown alongside customer.
  - `StyleDetailView.tsx`: Displays factory badge in header, plus factory selector in inline editing mode.
  - `StyleListView.tsx`: Displays factory badge on style cards, plus factory filter dropdown in search header.

#### 2. External Style Links (`StyleLink`) (Status: ✅ Integrated)
- **Backend Implementation**:
  - Model: `StyleLink` (`id`, `style`, `label`, `url`, `created_at`).
  - Serializer: `StyleLinkSerializer` nested inside `StyleMasterSerializer.links`.
  - ViewSet & Actions: `StyleLinkViewSet` (`/style-links/`), and `@action(detail=True, methods=['post']) def add_link(...)` on `StyleMasterViewSet`.
- **Frontend Integration**:
  - `StyleLinksCard.tsx`: Dedicated card on the right-hand side of `StyleDetailView.tsx`.
  - Enables adding title + URL for Tech Packs, 3D CLO fitting viewers, artwork folders, and PLM links.
  - Auto-normalizes URLs with `https://`, shows domain previews, opens in new tab (`target="_blank"`), and supports 1-click removal.

---

### B. Final Inspection Module (`backend/qc/serializers/final_inspection.py`)

#### 1. Carton Dimensions & Weights (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: `carton_length`, `carton_width`, `carton_height`, `gross_weight`, `net_weight`.
  - ReportLab PDF: These fields are automatically rendered in the official `FIR_{order_no}_{style_no}.pdf` header table.
- **Frontend Target**:
  - Add Carton Dimensions (L × W × H) and Gross/Net weight fields to `features/final-inspection/FIShipmentRemarks.tsx`.

#### 2. Standardized ISO Shipment Quality Conformity Checklists (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: 6 standardized checklist fields (`quantity_check`, `workmanship`, `packing_method`, `marking_label`, `data_measurement`, `hand_feel`) with choices `['Pass', 'Fail', 'NA']`.
- **Frontend Target**:
  - Update `features/final-inspection/FIShipmentRemarks.tsx` to bind directly to these 6 backend enum fields.

#### 3. Supplier Name & Inspection Attempt (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: `supplier` (CharField) and `inspection_attempt` (`1st Inspection`, `2nd Inspection`, `3rd Inspection`).
- **Frontend Target**:
  - Add inputs in `features/final-inspection/GeneralInfoSection.tsx`.

#### 4. Individual Defect Photo Evidence (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model: `FinalInspectionDefect.photo` (`models.ImageField(upload_to='final_inspection_defects/')`).
  - Serializer: `FinalInspectionDefectSerializer.photo`.
- **Frontend Target**:
  - Add optional thumbnail dropzone per defect row in `features/final-inspection/DefectSection.tsx`.

---

### C. Sample Evaluation Module (`backend/qc/serializers/evaluation.py`)

#### 1. Top-Level Customer Remarks Summary (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: `customer_remarks` ("Customer Feedback Summary") separate from category feedback.
- **Frontend Target**:
  - Add summary textarea in `features/evaluation/CommentSection.tsx`.

#### 2. Duplicate / Copy Inspection Flow (Status: ⏳ Pending)
- **Backend Implementation**:
  - Serializer: `InspectionCopySerializer` returns full POM tables, measurements, and tolerances optimized for cloning.
- **Frontend Target**:
  - Add a "Duplicate as New" action button in `features/evaluation/EvaluationListView.tsx`.

---

### D. Master Data & Resources (`backend/qc/serializers/common.py`)

#### 1. Factory Contact Person (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: `Factory.contact_person`.
- **Frontend Target**:
  - Add input and column in `features/factories/FactoriesPage.tsx`.

#### 2. Measurement Template Description (Status: ⏳ Pending)
- **Backend Implementation**:
  - Model & Serializer: `Template.description`.
- **Frontend Target**:
  - Add description textarea in `features/templates/TemplateForm.tsx`.
