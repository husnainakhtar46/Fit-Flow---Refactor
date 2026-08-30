import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from qc.models import StyleMaster, SampleComment, SampleCommentImage, StyleLink
from qc.serializers import (
    StyleMasterSerializer,
    StyleMasterListSerializer,
    SampleCommentSerializer,
    SampleCommentImageSerializer,
    StyleLinkSerializer,
)
from qc.utils import process_and_compress_image

logger = logging.getLogger(__name__)


class StyleMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for Style Cycle management."""
    queryset = StyleMaster.objects.all()
    serializer_class = StyleMasterSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_number', 'style_name', 'customer__name', 'season', 'factory__name']
    ordering_fields = ['created_at', 'po_number', 'style_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = StyleMaster.objects.select_related('customer', 'factory', 'created_by').prefetch_related('comments').order_by('-created_at')
        if self.action in ['retrieve', 'update', 'partial_update']:
            queryset = queryset.prefetch_related('comments', 'links')
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        factory_id = self.request.query_params.get('factory')
        if factory_id:
            queryset = queryset.filter(factory_id=factory_id)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return StyleMasterListSerializer
        return StyleMasterSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def by_po(self, request):
        po_number = request.query_params.get('po_number', '').strip()
        if not po_number:
            return Response({'error': 'po_number query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            style = StyleMaster.objects.prefetch_related('comments', 'links').get(po_number__iexact=po_number)
            serializer = StyleMasterSerializer(style)
            return Response(serializer.data)
        except StyleMaster.DoesNotExist:
            pass

        contains_matches = StyleMaster.objects.filter(po_number__icontains=po_number).select_related('customer')[:10]
        suggestions = []
        for s in contains_matches:
            suggestions.append({
                'id': str(s.id),
                'po_number': s.po_number,
                'style_name': s.style_name,
                'color': s.color,
                'customer_name': s.customer.name if s.customer else None,
            })

        if suggestions:
            return Response({
                'exact_match': False,
                'suggestions': suggestions,
                'searched_po': po_number
            }, status=status.HTTP_200_OK)

        return Response({'error': f'No style found with PO number: {po_number}', 'suggestions': []}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        style = self.get_object()
        if request.method == 'GET':
            comments = style.comments.prefetch_related('images').order_by('-created_at')
            serializer = SampleCommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = SampleCommentSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(style=style, created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        style = self.get_object()
        serializer = SampleCommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(style=style, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_link(self, request, pk=None):
        style = self.get_object()
        serializer = StyleLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(style=style)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def latest_comments(self, request, pk=None):
        style = self.get_object()
        latest_comment = style.comments.order_by('-created_at').first()
        if latest_comment:
            serializer = SampleCommentSerializer(latest_comment)
            return Response(serializer.data)
        return Response({'message': 'No comments found for this style'}, status=status.HTTP_404_NOT_FOUND)


class SampleCommentViewSet(viewsets.ModelViewSet):
    queryset = SampleComment.objects.all()
    serializer_class = SampleCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SampleComment.objects.select_related('style', 'created_by').prefetch_related('images').order_by('-created_at')
        style_id = self.request.query_params.get('style')
        if style_id:
            queryset = queryset.filter(style_id=style_id)
        sample_type = self.request.query_params.get('sample_type')
        if sample_type:
            queryset = queryset.filter(sample_type=sample_type)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='upload_image')
    def upload_image(self, request, pk=None):
        return self.upload_images(request, pk)

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        comment = self.get_object()
        files = request.FILES.getlist('images') or request.FILES.getlist('image')
        if not files and 'image' in request.FILES:
            files = [request.FILES['image']]
        category = request.data.get('category', 'general')
        caption = request.data.get('caption', '')

        if not files:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for f in files:
            try:
                compressed_file, _ = process_and_compress_image(f)
                img = SampleCommentImage.objects.create(
                    comment=comment,
                    image=compressed_file,
                    caption=caption,
                    category=category,
                )
                created.append(SampleCommentImageSerializer(img).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Image upload failed: {e}", exc_info=True)
                return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(created, status=status.HTTP_201_CREATED)


class SampleCommentImageViewSet(viewsets.ModelViewSet):
    queryset = SampleCommentImage.objects.all()
    serializer_class = SampleCommentImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SampleCommentImage.objects.select_related('comment').order_by('uploaded_at')
        comment_id = self.request.query_params.get('comment')
        if comment_id:
            queryset = queryset.filter(comment_id=comment_id)
        return queryset


class StyleLinkViewSet(viewsets.ModelViewSet):
    queryset = StyleLink.objects.all()
    serializer_class = StyleLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = StyleLink.objects.select_related('style').order_by('label')
        style_id = self.request.query_params.get('style')
        if style_id:
            queryset = queryset.filter(style_id=style_id)
        return queryset
