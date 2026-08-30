from rest_framework import serializers
from qc.models import (
    FinalInspection,
    FinalInspectionDefect,
    FinalInspectionSizeCheck,
    FinalInspectionImage,
    FinalInspectionMeasurement,
    FinalInspectionMeasurementSample,
)


class FinalInspectionMeasurementSampleSerializer(serializers.ModelSerializer):
    value = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = FinalInspectionMeasurementSample
        fields = ['id', 'index', 'value']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if mutable_data.get('value') == '' or mutable_data.get('value') == 'null':
            mutable_data['value'] = None
        return super().to_internal_value(mutable_data)


class FinalInspectionMeasurementSerializer(serializers.ModelSerializer):
    samples = FinalInspectionMeasurementSampleSerializer(many=True, required=False, default=list)
    tol = serializers.FloatField(required=False, default=0.0)
    spec = serializers.FloatField(required=False, default=0.0)
    pom_name = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = FinalInspectionMeasurement
        fields = ['id', 'pom_name', 'tol', 'spec', 'size_name', 'samples']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if not mutable_data.get('pom_name'):
            mutable_data['pom_name'] = 'Unspecified'
        if 'std' in mutable_data and ('spec' not in mutable_data or mutable_data.get('spec') is None or mutable_data.get('spec') == ''):
            mutable_data['spec'] = mutable_data.pop('std')
        if mutable_data.get('spec') == '' or mutable_data.get('spec') == 'null' or mutable_data.get('spec') is None:
            mutable_data['spec'] = 0.0
        if mutable_data.get('tol') == '' or mutable_data.get('tol') == 'null' or mutable_data.get('tol') is None:
            mutable_data['tol'] = 0.0
        return super().to_internal_value(mutable_data)


class FinalInspectionDefectSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = FinalInspectionDefect
        fields = ['id', 'description', 'severity', 'count', 'photo', 'photo_url']

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url

    def to_internal_value(self, data):
        import base64
        import uuid
        from django.core.files.base import ContentFile

        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'type' in mutable_data and not mutable_data.get('severity'):
            mutable_data['severity'] = mutable_data.pop('type')
        if not mutable_data.get('severity'):
            mutable_data['severity'] = 'Major'
        else:
            sev = str(mutable_data['severity']).strip().capitalize()
            mutable_data['severity'] = sev if sev in ['Critical', 'Major', 'Minor'] else 'Major'

        if 'photo' in mutable_data and isinstance(mutable_data['photo'], str):
            photo_str = mutable_data['photo']
            if photo_str.startswith('data:image'):
                try:
                    format_part, img_str = photo_str.split(';base64,')
                    ext = format_part.split('/')[-1].split('+')[0]
                    if ext == 'jpeg':
                        ext = 'jpg'
                    file_name = f"defect_{uuid.uuid4().hex[:8]}.{ext}"
                    mutable_data['photo'] = ContentFile(base64.b64decode(img_str), name=file_name)
                except Exception:
                    mutable_data.pop('photo', None)
            elif not photo_str or photo_str.startswith('http') or photo_str.startswith('/media/'):
                mutable_data.pop('photo', None)

        return super().to_internal_value(mutable_data)


class FinalInspectionSizeCheckSerializer(serializers.ModelSerializer):
    difference = serializers.ReadOnlyField()
    deviation_percent = serializers.ReadOnlyField()

    class Meta:
        model = FinalInspectionSizeCheck
        fields = ['id', 'size', 'order_qty', 'packed_qty', 'difference', 'deviation_percent']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'inspected_qty' in mutable_data and 'packed_qty' not in mutable_data:
            mutable_data['packed_qty'] = mutable_data.pop('inspected_qty')
        return super().to_internal_value(mutable_data)


class FinalInspectionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalInspectionImage
        fields = ['id', 'image', 'caption', 'category', 'order', 'uploaded_at']


class FinalInspectionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = FinalInspection
        fields = [
            'id', 'order_no', 'style_no', 'color', 'inspection_attempt', 'customer', 'customer_name',
            'factory', 'supplier',
            'inspection_date', 'result', 'total_order_qty', 'sample_size',
            'created_at', 'updated_at', 'created_by_username', 'is_draft'
        ]


class FinalInspectionSerializer(serializers.ModelSerializer):
    defects = FinalInspectionDefectSerializer(many=True, required=False)
    size_checks = FinalInspectionSizeCheckSerializer(many=True, required=False)
    measurements = FinalInspectionMeasurementSerializer(many=True, required=False)
    images = FinalInspectionImageSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    max_allowed_critical = serializers.ReadOnlyField()
    max_allowed_major = serializers.ReadOnlyField()
    max_allowed_minor = serializers.ReadOnlyField()
    result = serializers.ReadOnlyField()

    order_no = serializers.CharField(required=False, allow_blank=True, default='')
    style_no = serializers.CharField(required=False, allow_blank=True, default='')
    inspection_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = FinalInspection
        fields = [
            'id', 'customer', 'customer_name', 'supplier', 'factory',
            'inspection_date', 'order_no', 'style_no', 'color', 'inspection_attempt',
            'total_order_qty', 'presented_qty', 'sample_size',
            'aql_standard', 'aql_critical', 'aql_major', 'aql_minor',
            'critical_found', 'major_found', 'minor_found',
            'max_allowed_critical', 'max_allowed_major', 'max_allowed_minor',
            'result', 'total_cartons', 'selected_cartons',
            'carton_length', 'carton_width', 'carton_height',
            'gross_weight', 'net_weight',
            'quantity_check', 'workmanship', 'packing_method',
            'marking_label', 'data_measurement', 'hand_feel',
            'remarks', 'created_at', 'updated_at', 'created_by', 'created_by_username',
            'defects', 'size_checks', 'images', 'measurements', 'is_draft'
        ]

    def to_internal_value(self, data):
        from django.utils import timezone
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Field aliases
        if 'po_number' in mutable_data and not mutable_data.get('order_no'):
            mutable_data['order_no'] = mutable_data.pop('po_number')
        if 'style' in mutable_data and not mutable_data.get('style_no'):
            mutable_data['style_no'] = mutable_data.pop('style')
        if 'order_quantity' in mutable_data and not mutable_data.get('total_order_qty'):
            mutable_data['total_order_qty'] = mutable_data.pop('order_quantity')
        if 'defects_data' in mutable_data and 'defects' not in mutable_data:
            mutable_data['defects'] = mutable_data.pop('defects_data')
        if 'size_breakdowns' in mutable_data and 'size_checks' not in mutable_data:
            mutable_data['size_checks'] = mutable_data.pop('size_breakdowns')

        if not mutable_data.get('inspection_date'):
            mutable_data['inspection_date'] = timezone.now().date()

        cust = mutable_data.get('customer')
        if cust == '' or cust == 'null':
            mutable_data['customer'] = None
        elif isinstance(cust, str):
            import uuid
            try:
                uuid.UUID(cust)
            except ValueError:
                from qc.models import Customer
                obj = Customer.objects.filter(name__iexact=cust).first()
                if not obj:
                    obj = Customer.objects.create(name=cust)
                mutable_data['customer'] = obj.pk

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        defects_data = validated_data.pop('defects', [])
        size_checks_data = validated_data.pop('size_checks', [])
        measurements_data = validated_data.pop('measurements', [])

        final_inspection = FinalInspection.objects.create(**validated_data)

        for defect_data in defects_data:
            FinalInspectionDefect.objects.create(final_inspection=final_inspection, **defect_data)

        for size_check_data in size_checks_data:
            FinalInspectionSizeCheck.objects.create(final_inspection=final_inspection, **size_check_data)

        for m_data in measurements_data:
            samples_data = m_data.pop('samples', [])
            measurement = FinalInspectionMeasurement.objects.create(final_inspection=final_inspection, **m_data)
            for s_data in samples_data:
                FinalInspectionMeasurementSample.objects.create(measurement=measurement, **s_data)

        return final_inspection

    def update(self, instance, validated_data):
        defects_data = validated_data.pop('defects', None)
        size_checks_data = validated_data.pop('size_checks', None)
        measurements_data = validated_data.pop('measurements', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if defects_data is not None:
            instance.defects.all().delete()
            for defect_data in defects_data:
                FinalInspectionDefect.objects.create(final_inspection=instance, **defect_data)

        if size_checks_data is not None:
            instance.size_checks.all().delete()
            for size_check_data in size_checks_data:
                FinalInspectionSizeCheck.objects.create(final_inspection=instance, **size_check_data)

        if measurements_data is not None:
            instance.measurements.all().delete()
            for m_data in measurements_data:
                samples_data = m_data.pop('samples', [])
                measurement = FinalInspectionMeasurement.objects.create(final_inspection=instance, **m_data)
                for s_data in samples_data:
                    FinalInspectionMeasurementSample.objects.create(measurement=measurement, **s_data)

        return instance
