from rest_framework import serializers
from django.utils import timezone
from qc.models import (
    Inspection,
    Measurement,
    MeasurementSample,
    InspectionImage,
    Template,
    Customer,
)


class MeasurementSampleSerializer(serializers.ModelSerializer):
    value = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = MeasurementSample
        fields = ['id', 'index', 'value']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if mutable_data.get('value') == '' or mutable_data.get('value') == 'null':
            mutable_data['value'] = None
        return super().to_internal_value(mutable_data)


class MeasurementSerializer(serializers.ModelSerializer):
    samples = MeasurementSampleSerializer(many=True, required=False, default=list)
    std = serializers.FloatField(required=False, allow_null=True)
    tol = serializers.FloatField(required=False, default=0.0)
    pom_name = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Measurement
        fields = ['id', 'pom_name', 'tol', 'std', 'status', 'samples']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if not mutable_data.get('pom_name'):
            mutable_data['pom_name'] = 'Unspecified'
        if mutable_data.get('std') == '' or mutable_data.get('std') == 'null':
            mutable_data['std'] = None
        if mutable_data.get('tol') == '' or mutable_data.get('tol') == 'null':
            mutable_data['tol'] = 0.0
        return super().to_internal_value(mutable_data)


class InspectionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionImage
        fields = ["id", "caption", "image", "uploaded_at"]


class InspectionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Inspection
        fields = [
            "id", "style", "color", "po_number", "factory", "stage", "template", "customer", "customer_name",
            "remarks", "decision", "created_at", "updated_at", "created_by_username",
            "customer_decision", "customer_feedback_comments", "customer_feedback_date",
            "is_draft"
        ]


class InspectionCopySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    measurements = MeasurementSerializer(many=True, read_only=True)
    images = InspectionImageSerializer(many=True, read_only=True)

    class Meta:
        model = Inspection
        fields = [
            "id", "style", "color", "po_number", "factory", "stage", "template", "customer", "customer_name",
            # Customer Comments by Category
            "customer_remarks", "customer_fit_comments", "customer_workmanship_comments",
            "customer_wash_comments", "customer_fabric_comments", "customer_accessories_comments",
            "customer_comments_addressed",
            # QA Comments by Category
            "qa_fit_comments", "qa_workmanship_comments",
            "qa_wash_comments", "qa_fabric_comments", "qa_accessories_comments",
            # Fabric Checks
            "fabric_handfeel", "fabric_pilling",
            # Dynamic Accessories
            "accessories_data",
            # General
            "remarks", "decision", "created_at", "updated_at", "measurements", "images",
            "customer_decision", "customer_feedback_comments", "customer_feedback_date",
            "is_draft"
        ]


class InspectionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    measurements = MeasurementSerializer(many=True, required=False, default=list)
    images = InspectionImageSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    style = serializers.CharField(required=False, allow_blank=True, default="")
    decision = serializers.CharField(required=False, allow_blank=True, default="Pending")
    template = serializers.PrimaryKeyRelatedField(queryset=Template.objects.all(), required=False, allow_null=True)
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Inspection
        fields = [
            "id", "style", "color", "po_number", "factory", "stage", "template", "customer", "customer_name",
            # Customer Comments by Category
            "customer_remarks", "customer_fit_comments", "customer_workmanship_comments",
            "customer_wash_comments", "customer_fabric_comments", "customer_accessories_comments",
            "customer_comments_addressed",
            # QA Comments by Category
            "qa_fit_comments", "qa_workmanship_comments",
            "qa_wash_comments", "qa_fabric_comments", "qa_accessories_comments",
            # Fabric Checks
            "fabric_handfeel", "fabric_pilling",
            # Dynamic Accessories
            "accessories_data",
            # General
            "remarks", "decision", "created_at", "updated_at", "measurements", "images",
            "created_by_username",
            "customer_decision", "customer_feedback_comments", "customer_feedback_date",
            "is_draft"
        ]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Clean template
        tmpl = mutable_data.get('template')
        if tmpl == '' or tmpl == 'null':
            mutable_data['template'] = None
        elif isinstance(tmpl, str) and not tmpl.isdigit():
            obj = Template.objects.filter(name__iexact=tmpl).first()
            if obj:
                mutable_data['template'] = obj.pk

        # Clean customer (UUID or name string)
        cust = mutable_data.get('customer')
        if cust == '' or cust == 'null':
            mutable_data['customer'] = None
        elif isinstance(cust, str):
            import uuid
            try:
                uuid.UUID(cust)
            except ValueError:
                obj = Customer.objects.filter(name__iexact=cust).first()
                if not obj:
                    obj = Customer.objects.create(name=cust)
                mutable_data['customer'] = obj.pk

        # Clean factory (UUID or name string)
        fact = mutable_data.get('factory')
        if fact == '' or fact == 'null':
            mutable_data['factory'] = None
        elif isinstance(fact, str):
            import uuid
            try:
                uuid.UUID(fact)
            except ValueError:
                from qc.models import Factory
                obj = Factory.objects.filter(name__iexact=fact).first()
                if not obj:
                    obj = Factory.objects.create(name=fact)
                mutable_data['factory'] = obj.pk

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        measurements_data = validated_data.pop("measurements", [])
        inspection = Inspection.objects.create(**validated_data)
        for m_data in measurements_data:
            samples_data = m_data.pop("samples", [])
            measurement = Measurement.objects.create(inspection=inspection, **m_data)
            for s_data in samples_data:
                MeasurementSample.objects.create(measurement=measurement, **s_data)
        return inspection

    def update(self, instance, validated_data):
        measurements_data = validated_data.pop("measurements", None)

        if 'customer_decision' in validated_data or 'customer_feedback_comments' in validated_data:
            instance.customer_feedback_date = timezone.now()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if measurements_data is not None:
            instance.measurements.all().delete()
            for m_data in measurements_data:
                samples_data = m_data.pop("samples", [])
                measurement = Measurement.objects.create(inspection=instance, **m_data)
                for s_data in samples_data:
                    MeasurementSample.objects.create(measurement=measurement, **s_data)
        return instance
