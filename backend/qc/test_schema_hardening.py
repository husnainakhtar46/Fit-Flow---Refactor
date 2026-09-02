import io
from datetime import date
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from qc.models import (
    Customer,
    CustomerEmail,
    Inspection,
    FinalInspection,
    StyleMaster,
)
from qc.serializers import InspectionSerializer, FinalInspectionSerializer

User = get_user_model()


class SchemaHardeningTests(TestCase):
    """Tests for CustomerEmail uniqueness, soft delete, and StyleMaster linking."""

    def setUp(self):
        self.user = User.objects.create_user(username="testqc", password="password")
        self.customer = Customer.objects.create(name="Zara Global")

    def test_customer_email_uniqueness(self):
        """CustomerEmail must enforce unique_together on customer and email."""
        CustomerEmail.objects.create(
            customer=self.customer,
            email="qc@zara.com",
            contact_name="Lead QA"
        )
        with self.assertRaises(IntegrityError):
            CustomerEmail.objects.create(
                customer=self.customer,
                email="qc@zara.com",
                contact_name="Duplicate QA"
            )

    def test_inspection_soft_delete_and_restore(self):
        """Inspection soft_delete sets is_deleted and deleted_at; restore clears them."""
        inspection = Inspection.objects.create(
            customer=self.customer,
            style="Denim Jacket",
            po_number="PO-991",
            stage="Proto"
        )
        self.assertFalse(inspection.is_deleted)
        self.assertIsNone(inspection.deleted_at)

        inspection.soft_delete()
        inspection.refresh_from_db()
        self.assertTrue(inspection.is_deleted)
        self.assertIsNotNone(inspection.deleted_at)

        inspection.restore()
        inspection.refresh_from_db()
        self.assertFalse(inspection.is_deleted)
        self.assertIsNone(inspection.deleted_at)

    def test_final_inspection_soft_delete_and_restore(self):
        """FinalInspection soft_delete sets is_deleted and deleted_at; restore clears them."""
        fins = FinalInspection.objects.create(
            customer=self.customer,
            inspection_date=date.today(),
            order_no="FIR-992",
            style_no="STYLE-992",
            sample_size=50
        )
        self.assertFalse(fins.is_deleted)
        self.assertIsNone(fins.deleted_at)

        fins.soft_delete()
        fins.refresh_from_db()
        self.assertTrue(fins.is_deleted)
        self.assertIsNotNone(fins.deleted_at)

        fins.restore()
        fins.refresh_from_db()
        self.assertFalse(fins.is_deleted)
        self.assertIsNone(fins.deleted_at)

    def test_style_master_serializer_linking(self):
        """Serializers should automatically link to StyleMaster by style name."""
        style = StyleMaster.objects.create(
            style_name="Summer Dress",
            po_number="PO-SD-101",
            customer=self.customer
        )

        data = {
            "customer": str(self.customer.id),
            "style": "Summer Dress",
            "po_number": "PO-SD-101",
            "stage": "Proto",
        }
        serializer = InspectionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.style_master_id, style.id)

    def test_inspection_delete_image_action(self):
        """InspectionViewSet delete_image action removes image from inspection."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from qc.models import InspectionImage
        from rest_framework.test import APIClient

        inspection = Inspection.objects.create(
            customer=self.customer,
            style="Shirt",
            po_number="PO-102",
            stage="Proto",
            created_by=self.user,
        )
        fake_image = SimpleUploadedFile("test.jpg", b"fake image bytes", content_type="image/jpeg")
        img = InspectionImage.objects.create(inspection=inspection, image=fake_image, caption="Detail View")

        client = APIClient()
        client.force_authenticate(user=self.user)
        res = client.post(f"/api/inspections/{inspection.id}/delete_image/", {"image_id": str(img.id)}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(InspectionImage.objects.filter(id=img.id).exists())

    def test_evaluation_pdf_multi_page_images(self):
        """Evaluation PDF generator must paginate multiple attached images across pages smoothly."""
        from PIL import Image as PILImage
        from django.core.files.uploadedfile import SimpleUploadedFile
        from qc.models import InspectionImage
        from qc.services.pdf.evaluation_pdf import generate_pdf_buffer

        inspection = Inspection.objects.create(
            customer=self.customer,
            style="Multi-photo Dress",
            po_number="PO-PDF-1",
            stage="Proto",
            created_by=self.user,
        )

        for i in range(6):
            img_buf = io.BytesIO()
            pil_img = PILImage.new("RGB", (100, 100), color="blue")
            pil_img.save(img_buf, format="JPEG")
            img_buf.seek(0)
            upload = SimpleUploadedFile(f"photo_{i}.jpg", img_buf.getvalue(), content_type="image/jpeg")
            InspectionImage.objects.create(inspection=inspection, image=upload, caption=f"Photo #{i+1}")

        pdf_buffer = generate_pdf_buffer(inspection)
        self.assertIsNotNone(pdf_buffer)
        pdf_bytes = pdf_buffer.getvalue()
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 1000)


