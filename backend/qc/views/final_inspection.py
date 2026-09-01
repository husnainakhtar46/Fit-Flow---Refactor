from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse

from qc.filters import FinalInspectionFilter
from qc.models import (
    FinalInspection,
    FinalInspectionImage,
    calculate_sample_size,
    get_aql_limits,
)
from qc.serializers import (
    FinalInspectionSerializer,
    FinalInspectionListSerializer,
    FinalInspectionImageSerializer,
)
from qc.permissions import CanEditFinalInspection
from qc.services.pdf_generator import generate_final_inspection_pdf
from qc.utils import process_and_compress_image


class FinalInspectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Final Inspection Reports with AQL-based shipment audits.
    """
    queryset = FinalInspection.objects.all()
    serializer_class = FinalInspectionSerializer
    permission_classes = [CanEditFinalInspection]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = FinalInspectionFilter
    search_fields = ['order_no', 'style_no', 'factory', 'supplier', 'customer__name']
    ordering_fields = ['created_at', 'inspection_date', 'result', 'order_no']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = FinalInspection.objects.select_related('customer', 'created_by').order_by('-created_at')

        if self.action in ['retrieve', 'update', 'partial_update', 'pdf']:
            queryset = queryset.prefetch_related('defects', 'size_checks', 'images', 'measurements__samples')

        if self.action == 'list':
            queryset = queryset.filter(is_draft=False)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return FinalInspectionListSerializer
        return FinalInspectionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        final_inspection = self.get_object()
        image_file = request.FILES.get('image')
        caption = request.data.get('caption', 'Final Inspection Image')
        category = request.data.get('category', 'General')
        order = request.data.get('order', 0)

        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            compressed_file, _ = process_and_compress_image(image_file)
            img_obj = FinalInspectionImage.objects.create(
                final_inspection=final_inspection,
                image=compressed_file,
                caption=caption,
                category=category,
                order=int(order)
            )
            serializer = FinalInspectionImageSerializer(img_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def drafts(self, request):
        drafts = FinalInspection.objects.filter(
            is_draft=True, created_by=request.user
        ).select_related('customer', 'created_by').order_by('-updated_at')
        serializer = FinalInspectionListSerializer(drafts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def calculate_aql(self, request):
        try:
            qty = int(request.data.get('qty', 0))
            standard = request.data.get('standard', 'standard')
            critical_found = int(request.data.get('critical', 0))
            major_found = int(request.data.get('major', 0))
            minor_found = int(request.data.get('minor', 0))

            sample_size = calculate_sample_size(qty)

            if standard == 'strict':
                aql_critical, aql_major, aql_minor = 0.0, 1.5, 2.5
            else:
                aql_critical, aql_major, aql_minor = 0.0, 2.5, 4.0

            max_critical = get_aql_limits(sample_size, aql_critical)
            max_major = get_aql_limits(sample_size, aql_major)
            max_minor = get_aql_limits(sample_size, aql_minor)

            result = "Pass"
            if (
                critical_found > max_critical
                or major_found > max_major
                or minor_found > max_minor
            ):
                result = "Fail"

            return Response({
                "sample_size": sample_size,
                "limits": {
                    "critical": max_critical,
                    "major": max_major,
                    "minor": max_minor
                },
                "result": result,
                "standard_used": standard
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        final_inspection = self.get_object()
        buffer = generate_final_inspection_pdf(final_inspection)
        filename = f"FIR_{final_inspection.order_no}_{final_inspection.style_no}.pdf"
        return FileResponse(buffer, filename=filename, content_type='application/pdf')

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        from django.core.mail import EmailMessage
        from django.conf import settings

        final_inspection = self.get_object()

        if final_inspection.customer:
            to_emails = list(final_inspection.customer.emails.filter(email_type='to').values_list('email', flat=True))
            cc_emails = list(final_inspection.customer.emails.filter(email_type='cc').values_list('email', flat=True))
        else:
            to_emails = []
            cc_emails = []

        if not to_emails:
            return Response(
                {"error": "No 'To' recipients found. Add at least one 'To' email to the Customer first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if final_inspection.is_draft:
            return Response(
                {"error": "Cannot send email for a draft inspection. Please finalize it first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        date_str = (
            final_inspection.inspection_date.strftime('%Y-%m-%d')
            if final_inspection.inspection_date
            else final_inspection.created_at.strftime('%Y-%m-%d')
        )
        subject = f"FIR: {final_inspection.customer.name if final_inspection.customer else 'N/A'} - Order: {final_inspection.order_no} - Style: {final_inspection.style_no} - {date_str} - Result: {final_inspection.result}"

        body = (
            f"Dear Team,\n\n"
            f"Please find attached the Final Inspection Report (FIR) against the titled order.\n\n"
            f"Order No: {final_inspection.order_no}\n"
            f"Style No: {final_inspection.style_no}\n"
            f"Color: {final_inspection.color or 'N/A'}\n"
            f"Total Order Qty: {final_inspection.total_order_qty}\n"
            f"Sample Size: {final_inspection.sample_size} pcs\n"
            f"Result: {final_inspection.result}\n\n"
            f"Thank you."
        )

        buffer = generate_final_inspection_pdf(final_inspection)
        filename = f"FIR_{final_inspection.order_no}_{final_inspection.style_no}.pdf"

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
