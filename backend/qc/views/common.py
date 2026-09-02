from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from qc.models import Customer, Factory, Template, FilterPreset, Inspection, FinalInspection, FinalInspectionDefect
from qc.serializers import (
    CustomerSerializer,
    CustomerEmailSerializer,
    FactorySerializer,
    TemplateSerializer,
    FilterPresetSerializer,
    InspectionListSerializer,
)
from qc.permissions import IsQualityHeadOrAdmin, CanManageTemplates, CanViewDashboard


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsQualityHeadOrAdmin]

    def get_queryset(self):
        return Customer.objects.all()

    @action(detail=True, methods=["post"])
    def add_email(self, request, pk=None):
        customer = self.get_object()
        serializer = CustomerEmailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FactoryViewSet(viewsets.ModelViewSet):
    queryset = Factory.objects.all().order_by('-created_at')
    serializer_class = FactorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [CanManageTemplates]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'customer__name']

    def get_queryset(self):
        queryset = Template.objects.all()
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


class FilterPresetViewSet(viewsets.ModelViewSet):
    serializer_class = FilterPresetSerializer

    def get_queryset(self):
        return FilterPreset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        factory_name = request.query_params.get('factory_name')

        # Evaluation Analytics
        eval_qs = Inspection.objects.all()
        if start_date:
            eval_qs = eval_qs.filter(created_at__date__gte=start_date)
        if end_date:
            eval_qs = eval_qs.filter(created_at__date__lte=end_date)
        if customer_id:
            eval_qs = eval_qs.filter(customer_id=customer_id)
        if factory_name:
            import uuid
            try:
                uuid.UUID(str(factory_name))
                eval_qs = eval_qs.filter(Q(factory_id=factory_name) | Q(factory__name__iexact=factory_name))
            except ValueError:
                eval_qs = eval_qs.filter(factory__name__iexact=factory_name)

        total_inspections = eval_qs.count()
        pass_count = eval_qs.filter(decision="Accepted").count()
        fail_count = eval_qs.exclude(decision="Accepted").count()
        pass_rate = (pass_count / total_inspections * 100) if total_inspections > 0 else 0

        recent_inspections = eval_qs.select_related('customer', 'template').order_by("-created_at")[:5]
        recent_serializer = InspectionListSerializer(recent_inspections, many=True)

        inspections_by_stage = eval_qs.values('stage').annotate(count=Count('id')).order_by('-count')
        inspections_by_customer = eval_qs.values('customer__name').annotate(count=Count('id')).order_by('-count')
        monthly_trend = eval_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month')
        internal_decisions = eval_qs.values('decision').annotate(count=Count('id'))
        customer_decisions = eval_qs.values('customer_decision').annotate(count=Count('id'))

        # Final Inspection Analytics
        fi_qs = FinalInspection.objects.all()
        if start_date:
            fi_qs = fi_qs.filter(inspection_date__gte=start_date)
        if end_date:
            fi_qs = fi_qs.filter(inspection_date__lte=end_date)
        if customer_id:
            fi_qs = fi_qs.filter(customer_id=customer_id)
        if factory_name:
            import uuid
            try:
                uuid.UUID(str(factory_name))
                fi_qs = fi_qs.filter(Q(factory_id=factory_name) | Q(factory__name__iexact=factory_name))
            except ValueError:
                fi_qs = fi_qs.filter(factory__name__iexact=factory_name)

        fi_total = fi_qs.count()
        fi_pass = fi_qs.filter(result='Pass').count()
        fi_fail = fi_qs.filter(result='Fail').count()
        fi_pass_rate = (fi_pass / fi_total * 100) if fi_total > 0 else 0

        fi_monthly_pass = fi_qs.filter(result='Pass').annotate(
            month=TruncMonth('inspection_date')
        ).values('month').annotate(count=Count('id')).order_by('month')

        fi_monthly_fail = fi_qs.filter(result='Fail').annotate(
            month=TruncMonth('inspection_date')
        ).values('month').annotate(count=Count('id')).order_by('month')

        fi_by_customer = fi_qs.values('customer__name').annotate(
            pass_count=Count('id', filter=Q(result='Pass')),
            fail_count=Count('id', filter=Q(result='Fail'))
        ).order_by('-pass_count')[:10]

        defect_qs = FinalInspectionDefect.objects.all()
        if start_date:
            defect_qs = defect_qs.filter(final_inspection__inspection_date__gte=start_date)
        if end_date:
            defect_qs = defect_qs.filter(final_inspection__inspection_date__lte=end_date)
        fi_top_defects = defect_qs.values('description').annotate(
            total=Count('id')
        ).order_by('-total')[:10]

        return Response({
            "total_inspections": total_inspections,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "pass_rate": round(pass_rate, 1),
            "recent_inspections": recent_serializer.data,
            "inspections_by_stage": list(inspections_by_stage),
            "inspections_by_customer": list(inspections_by_customer),
            "monthly_trend": list(monthly_trend),
            "internal_decisions": list(internal_decisions),
            "customer_decisions": list(customer_decisions),
            "fi_total": fi_total,
            "fi_pass": fi_pass,
            "fi_fail": fi_fail,
            "fi_pass_rate": round(fi_pass_rate, 1),
            "fi_monthly_pass": list(fi_monthly_pass),
            "fi_monthly_fail": list(fi_monthly_fail),
            "fi_by_customer": list(fi_by_customer),
            "fi_top_defects": list(fi_top_defects),
        })
