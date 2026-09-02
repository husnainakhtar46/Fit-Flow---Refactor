from rest_framework import serializers
from django.db import transaction, models
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
    color = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = FinalInspectionMeasurement
        fields = ['id', 'color', 'pom_name', 'tol', 'spec', 'size_name', 'samples']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if not mutable_data.get('pom_name'):
            mutable_data['pom_name'] = 'Unspecified'
        if 'std' in mutable_data and ('spec' not in mutable_data or mutable_data.get('spec') is None or mutable_data.get('spec') == ''):
            mutable_data['spec'] = mutable_data.pop('std')
        if not mutable_data.get('spec') or mutable_data.get('spec') == 'null':
            mutable_data['spec'] = 0.0
        if not mutable_data.get('tol') or mutable_data.get('tol') == 'null':
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
        sev = str(mutable_data.pop('type', None) or mutable_data.get('severity') or 'Major').strip().capitalize()
        mutable_data['severity'] = sev if sev in ['Critical', 'Major', 'Minor'] else 'Major'

        photo_str = mutable_data.get('photo')
        if isinstance(photo_str, str):
            if photo_str.startswith('data:image'):
                try:
                    format_part, img_str = photo_str.split(';base64,')
                    ext = 'jpg' if 'jpeg' in format_part else format_part.split('/')[-1].split('+')[0]
                    mutable_data['photo'] = ContentFile(base64.b64decode(img_str), name=f"defect_{uuid.uuid4().hex[:8]}.{ext}")
                except Exception:
                    mutable_data.pop('photo', None)
            elif not photo_str or photo_str.startswith(('http', '/media/')):
                mutable_data.pop('photo', None)

        return super().to_internal_value(mutable_data)


class FinalInspectionSizeCheckSerializer(serializers.ModelSerializer):
    difference = serializers.ReadOnlyField()
    deviation_percent = serializers.ReadOnlyField()
    color = serializers.CharField(required=False, allow_blank=True, default="")
    inspected_qty = serializers.IntegerField(source='packed_qty', required=False)

    class Meta:
        model = FinalInspectionSizeCheck
        fields = ['id', 'color', 'size', 'order_qty', 'packed_qty', 'inspected_qty', 'difference', 'deviation_percent']

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
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    style_master_name = serializers.CharField(source='style_master.style_name', read_only=True)
    style = serializers.SerializerMethodField()
    po_number = serializers.CharField(source='order_no', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = FinalInspection
        fields = [
            'id', 'order_no', 'po_number', 'style_no', 'style', 'style_master', 'style_master_name',
            'color', 'inspection_attempt', 'customer', 'customer_name',
            'factory', 'factory_name', 'supplier',
            'inspection_date', 'result', 'total_order_qty', 'sample_size',
            'created_at', 'updated_at', 'created_by_username', 'is_draft', 'is_deleted', 'deleted_at'
        ]

    def get_style(self, obj):
        if obj.style_master:
            return obj.style_master.style_name
        return obj.style_no


class FinalInspectionSerializer(serializers.ModelSerializer):
    defects = FinalInspectionDefectSerializer(many=True, required=False)
    size_checks = FinalInspectionSizeCheckSerializer(many=True, required=False)
    measurements = FinalInspectionMeasurementSerializer(many=True, required=False)
    images = FinalInspectionImageSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    style_master_name = serializers.CharField(source='style_master.style_name', read_only=True)
    style = serializers.SerializerMethodField()
    po_number = serializers.CharField(source='order_no', read_only=True)

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
            'id', 'customer', 'customer_name', 'supplier', 'factory', 'factory_name', 'style_master', 'style_master_name',
            'inspection_date', 'order_no', 'po_number', 'style_no', 'style', 'color', 'inspection_attempt',
            'total_order_qty', 'presented_qty', 'sample_size', 'aql_standard', 'aql_critical', 'aql_major', 'aql_minor',
            'critical_found', 'major_found', 'minor_found', 'max_allowed_critical', 'max_allowed_major', 'max_allowed_minor',
            'result', 'total_cartons', 'selected_cartons', 'carton_length', 'carton_width', 'carton_height',
            'gross_weight', 'net_weight', 'quantity_check', 'workmanship', 'packing_method', 'marking_label',
            'data_measurement', 'hand_feel', 'remarks', 'created_at', 'updated_at', 'created_by', 'created_by_username',
            'defects', 'size_checks', 'images', 'measurements', 'is_draft', 'is_deleted', 'deleted_at'
        ]

    def get_style(self, obj):
        if obj.style_master:
            return obj.style_master.style_name
        return obj.style_no

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
        if cust in ('', 'null'):
            mutable_data['customer'] = None
        elif isinstance(cust, str):
            import uuid
            try:
                uuid.UUID(cust)
            except ValueError:
                from qc.models import Customer
                obj = Customer.objects.filter(name__iexact=cust).first() or Customer.objects.create(name=cust)
                mutable_data['customer'] = obj.pk

        fact = mutable_data.get('factory')
        if fact in ('', 'null'):
            mutable_data['factory'] = None
        elif isinstance(fact, str):
            import uuid
            try:
                uuid.UUID(fact)
            except ValueError:
                from qc.models import Factory
                obj = Factory.objects.filter(name__iexact=fact).first() or Factory.objects.create(name=fact)
                mutable_data['factory'] = obj.pk

        # Clean style_master (UUID or resolve from order/style)
        sm = mutable_data.get('style_master')
        matched_sm = None
        if sm == '' or sm == 'null':
            mutable_data['style_master'] = None
        elif isinstance(sm, str):
            import uuid
            try:
                uuid.UUID(sm)
            except ValueError:
                from qc.models import StyleMaster
                matched_sm = StyleMaster.objects.filter(models.Q(style_name__iexact=sm) | models.Q(po_number__iexact=sm)).first()
                mutable_data['style_master'] = matched_sm.pk if matched_sm else None

        if not mutable_data.get('style_master'):
            from qc.models import StyleMaster
            po = (mutable_data.get('order_no') or mutable_data.get('po_number') or '').strip()
            st = (mutable_data.get('style_no') or mutable_data.get('style') or '').strip()
            if po:
                matched_sm = StyleMaster.objects.filter(po_number__iexact=po).first()
            if not matched_sm and st:
                matched_sm = StyleMaster.objects.filter(style_name__iexact=st).first()
            if matched_sm:
                mutable_data['style_master'] = matched_sm.pk

        if mutable_data.get('style_master') and not matched_sm:
            from qc.models import StyleMaster
            matched_sm = StyleMaster.objects.filter(pk=mutable_data['style_master']).first()

        if matched_sm:
            if not mutable_data.get('style_no'):
                mutable_data['style_no'] = matched_sm.style_name
            if not mutable_data.get('order_no'):
                mutable_data['order_no'] = matched_sm.po_number
            if not mutable_data.get('color') and matched_sm.color:
                mutable_data['color'] = matched_sm.color
            if not mutable_data.get('customer') and matched_sm.customer_id:
                mutable_data['customer'] = matched_sm.customer_id
            if not mutable_data.get('factory') and matched_sm.factory_id:
                mutable_data['factory'] = matched_sm.factory_id

        return super().to_internal_value(mutable_data)

    def validate(self, data):
        """Server-side AQL integrity guard rejecting negative defect counts."""
        for field in ('critical_found', 'major_found', 'minor_found'):
            value = data.get(field)
            if value is not None and value < 0:
                raise serializers.ValidationError({field: 'Defect count cannot be negative.'})
        data.pop('result', None)
        return data

    def _save_size_checks(self, final_inspection, size_checks_data):
        if not size_checks_data:
            return
        import uuid
        objs = [
            FinalInspectionSizeCheck(id=sc.get('id') or uuid.uuid4(), final_inspection=final_inspection, **{k: v for k, v in sc.items() if k != 'id'})
            for sc in size_checks_data
        ]
        FinalInspectionSizeCheck.objects.bulk_create(objs)

    def _save_measurements(self, final_inspection, measurements_data):
        if not measurements_data:
            return
        import uuid
        meas_objs, samples_by_id = [], []
        for m_data in measurements_data:
            m_copy = dict(m_data)
            samples = m_copy.pop('samples', [])
            meas_id = m_copy.pop('id', None) or uuid.uuid4()
            meas_objs.append(FinalInspectionMeasurement(id=meas_id, final_inspection=final_inspection, **m_copy))
            samples_by_id.append((meas_id, samples))

        FinalInspectionMeasurement.objects.bulk_create(meas_objs)
        all_samples = [
            FinalInspectionMeasurementSample(id=s.get('id') or uuid.uuid4(), measurement_id=m_id, **{k: v for k, v in s.items() if k != 'id'})
            for m_id, s_list in samples_by_id for s in s_list
        ]
        if all_samples:
            FinalInspectionMeasurementSample.objects.bulk_create(all_samples)

    def create(self, validated_data):
        defects_data = validated_data.pop('defects', [])
        size_checks_data = validated_data.pop('size_checks', [])
        measurements_data = validated_data.pop('measurements', [])

        with transaction.atomic():
            final_inspection = FinalInspection.objects.create(**validated_data)
            for defect_data in defects_data:
                FinalInspectionDefect.objects.create(final_inspection=final_inspection, **defect_data)
            self._save_size_checks(final_inspection, size_checks_data)
            self._save_measurements(final_inspection, measurements_data)
            return final_inspection

    def update(self, instance, validated_data):
        defects_data = validated_data.pop('defects', None)
        size_checks_data = validated_data.pop('size_checks', None)
        measurements_data = validated_data.pop('measurements', None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if defects_data is not None:
                instance.defects.all().delete()
                for defect_data in defects_data:
                    FinalInspectionDefect.objects.create(final_inspection=instance, **defect_data)
                if not defects_data:
                    instance.critical_found = 0
                    instance.major_found = 0
                    instance.minor_found = 0
                    instance.save()

            if size_checks_data is not None:
                instance.size_checks.all().delete()
                self._save_size_checks(instance, size_checks_data)

            if measurements_data is not None:
                instance.measurements.all().delete()
                self._save_measurements(instance, measurements_data)

            return instance
