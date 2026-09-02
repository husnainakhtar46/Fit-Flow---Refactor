from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from qc.models import (
    Customer,
    Factory,
    Inspection,
    FinalInspection,
    FinalInspectionDefect,
    StyleMaster,
)
from qc.serializers import (
    InspectionSerializer,
    InspectionCopySerializer,
    FinalInspectionSerializer,
)
from qc.filters import InspectionFilter, FinalInspectionFilter
from qc.views import DashboardView, StyleMasterViewSet
from qc.auth_views import RequestOTPView

User = get_user_model()


class QARemediationTests(TestCase):
    """Test suite covering the 11 QA remediation fixes and StyleMaster FK improvements."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="qa_lead",
            email="lead@example.com",
            password="password123",
        )
        self.user.profile.user_type = "quality_head"
        self.user.profile.save()
        self.factory_obj = Factory.objects.create(name="Apex Textiles")
        self.customer = Customer.objects.create(name="Zara Global")
        self.style_master = StyleMaster.objects.create(
            style_name="Linen Shirt",
            po_number="PO-LS-2024",
            color="Olive Green",
            customer=self.customer,
            factory=self.factory_obj,
        )
        self.req_factory = APIRequestFactory()

    def test_inspection_search_filter_with_factory_and_style_master(self):
        """Search query must safely filter across factory name and style master without FieldError."""
        insp = Inspection.objects.create(
            customer=self.customer,
            factory=self.factory_obj,
            style_master=self.style_master,
            style="Linen Shirt",
            po_number="PO-LS-2024",
            stage="Proto",
        )
        filterset = InspectionFilter(data={'search': 'Apex'}, queryset=Inspection.objects.all())
        self.assertIn(insp, list(filterset.qs))

        filterset2 = InspectionFilter(data={'search': 'Linen'}, queryset=Inspection.objects.all())
        self.assertIn(insp, list(filterset2.qs))

    def test_dashboard_factory_filter_with_string_name(self):
        """DashboardView must handle raw factory string names without raising UUID ValidationError."""
        request = self.req_factory.get('/api/dashboard/', {'factory_name': 'Apex Textiles'})
        force_authenticate(request, user=self.user)
        view = DashboardView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)

    def test_final_inspection_defect_clearing_resets_verdict_to_pass(self):
        """Clearing defects on a failed final inspection must reset defect counts and update result to Pass."""
        fins = FinalInspection.objects.create(
            customer=self.customer,
            factory=self.factory_obj,
            inspection_date=date.today(),
            order_no="ORD-901",
            style_no="STY-901",
            sample_size=50,
            total_order_qty=500,
            presented_qty=500,
            critical_found=1,
            major_found=2,
            minor_found=1,
            result="Fail",
        )
        FinalInspectionDefect.objects.create(
            final_inspection=fins,
            description="Broken seam",
            severity="Critical",
            count=1,
        )

        update_data = {
            "defects": [],
        }
        serializer = FinalInspectionSerializer(instance=fins, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_fins = serializer.save()

        self.assertEqual(updated_fins.critical_found, 0)
        self.assertEqual(updated_fins.major_found, 0)
        self.assertEqual(updated_fins.minor_found, 0)
        self.assertEqual(updated_fins.result, "Pass")

    def test_style_master_auto_link_by_po_and_attribute_inheritance(self):
        """Providing only po_number should auto-link StyleMaster and fill style, color, customer, factory."""
        data = {
            "po_number": "PO-LS-2024",
            "stage": "Fit",
        }
        serializer = InspectionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()

        self.assertEqual(instance.style_master_id, self.style_master.id)
        self.assertEqual(instance.style, "Linen Shirt")
        self.assertEqual(instance.color, "Olive Green")
        self.assertEqual(instance.customer_id, self.customer.id)
        self.assertEqual(instance.factory_id, self.factory_obj.id)

    def test_inspection_copy_serializer_includes_style_master_fields(self):
        """InspectionCopySerializer used for retrieve must expose style_master, style_master_name, factory_name."""
        insp = Inspection.objects.create(
            customer=self.customer,
            factory=self.factory_obj,
            style_master=self.style_master,
            style="Linen Shirt",
            po_number="PO-LS-2024",
            stage="Proto",
        )
        serializer = InspectionCopySerializer(insp)
        self.assertEqual(serializer.data["style_master"], self.style_master.id)
        self.assertEqual(serializer.data["style_master_name"], "Linen Shirt")
        self.assertEqual(serializer.data["factory_name"], "Apex Textiles")

    def test_request_otp_prevents_email_enumeration(self):
        """Non-existent email must return HTTP 200 with generic message."""
        request = self.req_factory.post('/api/auth/request-otp/', {'email': 'unknown@domain.com'})
        view = RequestOTPView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.data)

    def test_style_master_inspections_action(self):
        """StyleMasterViewSet inspections action returns linked sample and final inspections."""
        Inspection.objects.create(
            customer=self.customer,
            style_master=self.style_master,
            style="Linen Shirt",
            po_number="PO-LS-2024",
            stage="Proto",
        )
        FinalInspection.objects.create(
            customer=self.customer,
            style_master=self.style_master,
            inspection_date=date.today(),
            order_no="PO-LS-2024",
            style_no="Linen Shirt",
            sample_size=32,
        )
        view = StyleMasterViewSet.as_view({'get': 'inspections'})
        request = self.req_factory.get(f'/api/styles/{self.style_master.id}/inspections/')
        force_authenticate(request, user=self.user)
        response = view(request, pk=str(self.style_master.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['evaluations']), 1)
        self.assertEqual(len(response.data['final_inspections']), 1)
