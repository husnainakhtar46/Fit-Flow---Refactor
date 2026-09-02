from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import EmailMessage
from django.conf import settings
from django.http import FileResponse
from django.db.models import Prefetch

from qc.models import Inspection, InspectionImage
from qc.serializers import (
    InspectionSerializer,
    InspectionListSerializer,
    InspectionCopySerializer,
)
from qc.filters import InspectionFilter
from qc.services.pdf_generator import generate_pdf_buffer
from qc.permissions import CanEditEvaluation, CanAddCustomerFeedback
from qc.utils import process_and_compress_image


class InspectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Evaluation/Inspection reports with role-based permissions."""
    queryset = Inspection.objects.all()
    serializer_class = InspectionSerializer
    permission_classes = [CanEditEvaluation]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = InspectionFilter
    ordering_fields = ['created_at', 'style', 'decision', 'stage']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Inspection.objects.select_related('customer', 'template', 'created_by', 'factory', 'style_master').order_by("-created_at")

        user = getattr(self.request, 'user', None)
        user_type = getattr(getattr(user, 'profile', None), 'user_type', None)
        is_admin_or_head = user_type in ['admin', 'quality_head'] or getattr(user, 'is_staff', False)
        include_deleted = self.request.query_params.get('include_deleted', '').lower() == 'true'

        if not (is_admin_or_head and include_deleted):
            queryset = queryset.filter(is_deleted=False)

        if self.action == 'list':
            queryset = queryset.filter(is_draft=False)
        if self.action != 'list' or self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'measurements',
                Prefetch('images', queryset=InspectionImage.objects.only('id', 'caption'))
            )
        return queryset

    def perform_destroy(self, instance):
        user = getattr(self.request, 'user', None)
        user_type = getattr(getattr(user, 'profile', None), 'user_type', None)
        is_admin_or_head = user_type in ['admin', 'quality_head'] or getattr(user, 'is_staff', False)
        hard = self.request.query_params.get('hard', '').lower() == 'true' or instance.is_deleted

        if is_admin_or_head and hard:
            instance.delete()
        else:
            instance.soft_delete()

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        inspection = self.get_object()
        inspection.restore()
        return Response({"status": "restored", "id": str(inspection.id)})

    def get_serializer_class(self):
        if self.action == 'list':
            return InspectionListSerializer
        if self.action == 'retrieve':
            return InspectionCopySerializer
        return InspectionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("==== SERIALIZER VALIDATION ERRORS ====")
            print(serializer.errors)
            print("======================================")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        inspection = self.get_object()
        if inspection.is_draft:
            return Response({"error": "Cannot generate PDF for a draft inspection."}, status=status.HTTP_400_BAD_REQUEST)
        buffer = generate_pdf_buffer(inspection)
        return FileResponse(buffer, filename=f"{inspection.style}_Report.pdf", content_type="application/pdf")

    @action(detail=False, methods=["get"])
    def drafts(self, request):
        drafts = Inspection.objects.filter(
            is_draft=True, created_by=request.user
        ).select_related('customer', 'template', 'created_by').order_by('-updated_at')
        serializer = InspectionListSerializer(drafts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def upload_image(self, request, pk=None):
        inspection = self.get_object()
        image_file = request.FILES.get("image")
        caption = request.data.get("caption", "Inspection Image")

        if not image_file:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            compressed_file, _ = process_and_compress_image(image_file)
            InspectionImage.objects.create(
                inspection=inspection,
                image=compressed_file,
                caption=caption
            )
            return Response({"status": "Image uploaded and compressed"}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def send_email(self, request, pk=None):
        inspection = self.get_object()

        if inspection.customer:
            to_emails = list(inspection.customer.emails.filter(email_type='to').values_list('email', flat=True))
            cc_emails = list(inspection.customer.emails.filter(email_type='cc').values_list('email', flat=True))
        else:
            to_emails = []
            cc_emails = []

        if not to_emails:
            return Response({"error": "No 'To' recipients found. Add at least one 'To' email to the Customer first."}, status=status.HTTP_400_BAD_REQUEST)

        if inspection.is_draft:
            return Response({"error": "Cannot send email for a draft inspection. Please finalize it first."}, status=status.HTTP_400_BAD_REQUEST)

        date_str = inspection.created_at.strftime('%Y-%m-%d')
        subject = f"{inspection.customer.name if inspection.customer else 'N/A'} - PO: {inspection.po_number} - Style: {inspection.style} - Color: {inspection.color or 'N/A'} - {date_str} - Decision: {inspection.decision}"

        body = (
            f"Dear Team,\n\n"
            f"Please find attached the sample evaluation report against the titled style.\n\n"
            f"Style: {inspection.style}\n"
            f"PO Number: {inspection.po_number}\n"
            f"Stage: {inspection.stage}\n"
            f"Decision: {inspection.decision}\n\n"
            f"Thank you."
        )

        buffer = generate_pdf_buffer(inspection)
        filename = f"{inspection.style}_{inspection.po_number}_Report.pdf"

        from qc.gmail_service import queue_email
        queue_email(
            to_emails=to_emails,
            subject=subject,
            body=body,
            attachment_bytes=buffer.getvalue(),
            attachment_filename=filename,
            cc_emails=cc_emails if cc_emails else None,
        )
        return Response({
            "queued": True,
            "to": to_emails,
            "cc": cc_emails,
            "message": "Email queued. It will be delivered in the background.",
        })

    @action(detail=True, methods=["patch"], permission_classes=[CanAddCustomerFeedback])
    def update_customer_feedback(self, request, pk=None):
        from django.utils import timezone
        inspection = self.get_object()

        allowed_fields = ['customer_decision', 'customer_feedback_comments']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not data:
            return Response({"error": "No valid feedback fields provided"}, status=status.HTTP_400_BAD_REQUEST)

        for field, value in data.items():
            setattr(inspection, field, value)

        inspection.customer_feedback_date = timezone.now()
        inspection.save()

        return Response({
            "id": str(inspection.id),
            "customer_decision": inspection.customer_decision,
            "customer_feedback_comments": inspection.customer_feedback_comments,
            "customer_feedback_date": str(inspection.customer_feedback_date),
        })
