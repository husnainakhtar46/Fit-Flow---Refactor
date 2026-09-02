# qc/filters.py
import django_filters
from django.db import models
from .models import Inspection, FinalInspection


class InspectionFilter(django_filters.FilterSet):
    """
    Advanced filtering for Inspection model
    Supports: date ranges, decision, stage, customer, and text search
    """
    # Date range filters
    created_at_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='From Date')
    created_at_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='To Date')
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='gte', label='From Date')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='lte', label='To Date')
    
    # Choice filters
    decision = django_filters.MultipleChoiceFilter(
        choices=Inspection.DECISION_CHOICES,
        label='Decision'
    )
    stage = django_filters.MultipleChoiceFilter(
        choices=Inspection.STAGE_CHOICES,
        label='Stage'
    )
    
    # Customer & Style Master filters
    customer = django_filters.UUIDFilter(field_name='customer__id', label='Customer')
    style_master = django_filters.UUIDFilter(field_name='style_master__id', label='Style Master')
    
    # Factory filter supporting UUID or Name
    factory = django_filters.CharFilter(method='filter_factory', label='Factory')

    # Text search across multiple fields
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    def filter_factory(self, queryset, name, value):
        if not value:
            return queryset
        import uuid
        try:
            uuid.UUID(str(value))
            return queryset.filter(models.Q(factory_id=value) | models.Q(factory__name__iexact=value))
        except ValueError:
            return queryset.filter(factory__name__icontains=value)

    def filter_search(self, queryset, name, value):
        """Search across style, po_number, customer name, created_by username, factory, and style master"""
        if not value:
            return queryset
        return queryset.filter(
            models.Q(style__icontains=value) |
            models.Q(po_number__icontains=value) |
            models.Q(customer__name__icontains=value) |
            models.Q(created_by__username__icontains=value) |
            models.Q(factory__name__icontains=value) |
            models.Q(style_master__style_name__icontains=value)
        )
    
    class Meta:
        model = Inspection
        fields = ['decision', 'stage', 'customer', 'style_master', 'factory', 'created_at_after', 'created_at_before', 'search']


class FinalInspectionFilter(django_filters.FilterSet):
    """
    Filtering for Final Inspection model
    """
    customer = django_filters.UUIDFilter(field_name='customer__id', label='Customer')
    style_master = django_filters.UUIDFilter(field_name='style_master__id', label='Style Master')
    factory = django_filters.CharFilter(method='filter_factory', label='Factory')
    date_from = django_filters.DateFilter(field_name='inspection_date', lookup_expr='gte', label='From Date')
    date_to = django_filters.DateFilter(field_name='inspection_date', lookup_expr='lte', label='To Date')
    result = django_filters.ChoiceFilter(choices=[('Pending', 'Pending'), ('Pass', 'Pass'), ('Fail', 'Fail')], label='Result')

    def filter_factory(self, queryset, name, value):
        if not value:
            return queryset
        import uuid
        try:
            uuid.UUID(str(value))
            return queryset.filter(models.Q(factory_id=value) | models.Q(factory__name__iexact=value))
        except ValueError:
            return queryset.filter(factory__name__icontains=value)

    class Meta:
        model = FinalInspection
        fields = ['customer', 'style_master', 'factory', 'result', 'date_from', 'date_to']
