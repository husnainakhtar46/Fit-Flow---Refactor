import uuid
from django.db import models, transaction
from django.contrib.auth import get_user_model
from .core import Customer, Factory

User = get_user_model()


def get_aql_limits(sample_size, aql_level):
    """
    Returns max allowed defects based on ISO 2859-1 AQL tables.
    Returns the acceptance number (Ac) for the given sample size and AQL level.
    """
    aql_table = {
        (2, 0.0): 0, (2, 1.5): 0, (2, 2.5): 0, (2, 4.0): 0,
        (3, 0.0): 0, (3, 1.5): 0, (3, 2.5): 0, (3, 4.0): 0,
        (5, 0.0): 0, (5, 1.5): 0, (5, 2.5): 0, (5, 4.0): 0,
        (8, 0.0): 0, (8, 1.5): 0, (8, 2.5): 0, (8, 4.0): 1,
        (13, 0.0): 0, (13, 1.5): 0, (13, 2.5): 1, (13, 4.0): 1,
        (20, 0.0): 0, (20, 1.5): 1, (20, 2.5): 1, (20, 4.0): 2,
        (32, 0.0): 0, (32, 1.5): 1, (32, 2.5): 2, (32, 4.0): 3,
        (50, 0.0): 0, (50, 1.5): 2, (50, 2.5): 3, (50, 4.0): 5,
        (80, 0.0): 0, (80, 1.5): 3, (80, 2.5): 5, (80, 4.0): 7,
        (125, 0.0): 0, (125, 1.5): 5, (125, 2.5): 7, (125, 4.0): 10,
        (200, 0.0): 0, (200, 1.5): 7, (200, 2.5): 10, (200, 4.0): 14,
        (315, 0.0): 0, (315, 1.5): 10, (315, 2.5): 14, (315, 4.0): 21,
        (500, 0.0): 1, (500, 1.5): 14, (500, 2.5): 21, (500, 4.0): 21,
        (800, 0.0): 1, (800, 1.5): 21, (800, 2.5): 21, (800, 4.0): 21,
        (1250, 0.0): 2, (1250, 1.5): 21, (1250, 2.5): 21, (1250, 4.0): 21,
    }
    return aql_table.get((sample_size, aql_level), 0)


def calculate_sample_size(order_qty):
    """
    Calculate sample size based on total order quantity per ISO 2859-1 Level II.
    """
    if order_qty <= 8:
        return 2
    elif order_qty <= 15:
        return 3
    elif order_qty <= 25:
        return 5
    elif order_qty <= 50:
        return 8
    elif order_qty <= 90:
        return 13
    elif order_qty <= 150:
        return 20
    elif order_qty <= 280:
        return 32
    elif order_qty <= 500:
        return 50
    elif order_qty <= 1200:
        return 80
    elif order_qty <= 3200:
        return 125
    elif order_qty <= 10000:
        return 200
    elif order_qty <= 35000:
        return 315
    elif order_qty <= 150000:
        return 500
    elif order_qty <= 500000:
        return 800
    else:
        return 1250


class FinalInspection(models.Model):
    """Final Inspection Report for shipment audits based on AQL standards."""
    RESULT_CHOICES = [
        ('Pending', 'Pending'),
        ('Pass', 'Pass'),
        ('Fail', 'Fail'),
    ]
    WORKMANSHIP_CHOICES = [
        ('Pass', 'Pass'),
        ('Fail', 'Fail'),
        ('NA', 'N/A'),
    ]
    INSPECTION_ATTEMPT_CHOICES = [
        ('1st', '1st Inspection'),
        ('2nd', '2nd Inspection'),
        ('3rd', '3rd Inspection'),
    ]
    AQL_STANDARD_CHOICES = [
        ('strict', 'Strict (0/1.5/2.5)'),
        ('standard', 'Standard (0/2.5/4.0)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='final_inspections')
    supplier = models.CharField(max_length=255, blank=True)
    factory = models.ForeignKey(Factory, null=True, blank=True, on_delete=models.SET_NULL, related_name='final_inspections')
    style_master = models.ForeignKey('qc.StyleMaster', null=True, blank=True, on_delete=models.SET_NULL, related_name='final_inspections')
    inspection_date = models.DateField()
    order_no = models.CharField(max_length=255)
    style_no = models.CharField(max_length=255)
    color = models.CharField(max_length=255, blank=True)
    inspection_attempt = models.CharField(max_length=20, choices=INSPECTION_ATTEMPT_CHOICES, default='1st')

    total_order_qty = models.PositiveIntegerField(default=0)
    presented_qty = models.PositiveIntegerField(default=0)
    aql_standard = models.CharField(max_length=20, choices=AQL_STANDARD_CHOICES, default='standard')
    sample_size = models.PositiveIntegerField(default=0)
    aql_critical = models.FloatField(default=0.0)
    aql_major = models.FloatField(default=2.5)
    aql_minor = models.FloatField(default=4.0)

    critical_found = models.PositiveIntegerField(default=0)
    major_found = models.PositiveIntegerField(default=0)
    minor_found = models.PositiveIntegerField(default=0)

    max_allowed_critical = models.PositiveIntegerField(default=0)
    max_allowed_major = models.PositiveIntegerField(default=0)
    max_allowed_minor = models.PositiveIntegerField(default=0)

    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='Pending')

    total_cartons = models.PositiveIntegerField(default=0)
    selected_cartons = models.PositiveIntegerField(default=0)
    carton_length = models.FloatField(default=0.0)
    carton_width = models.FloatField(default=0.0)
    carton_height = models.FloatField(default=0.0)
    gross_weight = models.FloatField(default=0.0)
    net_weight = models.FloatField(default=0.0)

    quantity_check = models.BooleanField(default=False)
    workmanship = models.CharField(max_length=10, choices=WORKMANSHIP_CHOICES, default='NA')
    packing_method = models.CharField(max_length=10, choices=WORKMANSHIP_CHOICES, default='NA')
    marking_label = models.CharField(max_length=10, choices=WORKMANSHIP_CHOICES, default='NA')
    data_measurement = models.CharField(max_length=10, choices=WORKMANSHIP_CHOICES, default='NA')
    hand_feel = models.CharField(max_length=10, choices=WORKMANSHIP_CHOICES, default='NA')

    remarks = models.TextField(blank=True)
    is_draft = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def calculate_aql_limits(self):
        self.max_allowed_critical = get_aql_limits(self.sample_size, self.aql_critical)
        self.max_allowed_major = get_aql_limits(self.sample_size, self.aql_major)
        self.max_allowed_minor = get_aql_limits(self.sample_size, self.aql_minor)

    def update_result(self):
        if (
            self.critical_found > self.max_allowed_critical
            or self.major_found > self.max_allowed_major
            or self.minor_found > self.max_allowed_minor
        ):
            self.result = 'Fail'
        else:
            self.result = 'Pass'

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def save(self, *args, **kwargs):
        self.aql_critical = 0.0  # Always enforce 0 critical allowed

        if not self.sample_size and self.presented_qty:
            self.sample_size = calculate_sample_size(self.presented_qty)
        elif not self.sample_size and self.total_order_qty:
            self.sample_size = calculate_sample_size(self.total_order_qty)

        self.calculate_aql_limits()
        self.update_result()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"FIR-{self.order_no} - {self.style_no} ({self.result})"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['order_no']),
            models.Index(fields=['result']),
            models.Index(fields=['inspection_date']),
            models.Index(fields=['is_deleted']),
        ]


class FinalInspectionDefect(models.Model):
    SEVERITY_CHOICES = [('Critical', 'Critical'), ('Major', 'Major'), ('Minor', 'Minor')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    final_inspection = models.ForeignKey(FinalInspection, related_name='defects', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='Minor')
    count = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to='final_inspection_defects/', null=True, blank=True)

    def _update_parent_totals(self):
        inspection = FinalInspection.objects.select_for_update().get(id=self.final_inspection_id)
        inspection.critical_found = inspection.defects.filter(severity='Critical').aggregate(
            total=models.Sum('count'))['total'] or 0
        inspection.major_found = inspection.defects.filter(severity='Major').aggregate(
            total=models.Sum('count'))['total'] or 0
        inspection.minor_found = inspection.defects.filter(severity='Minor').aggregate(
            total=models.Sum('count'))['total'] or 0
        inspection.save()

    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)
            self._update_parent_totals()

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            super().delete(*args, **kwargs)
            self._update_parent_totals()

    def __str__(self):
        return f"{self.description} ({self.severity}) x{self.count}"

    class Meta:
        ordering = ['severity', 'description']


class FinalInspectionSizeCheck(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    final_inspection = models.ForeignKey(FinalInspection, related_name='size_checks', on_delete=models.CASCADE)
    color = models.CharField(max_length=100, blank=True, default='')
    size = models.CharField(max_length=50)
    order_qty = models.PositiveIntegerField(default=0)
    packed_qty = models.PositiveIntegerField(default=0)

    @property
    def difference(self):
        return self.packed_qty - self.order_qty

    @property
    def deviation_percent(self):
        if self.order_qty == 0:
            return 0.0
        return round((self.difference / self.order_qty) * 100, 2)

    def __str__(self):
        return f"{self.final_inspection.order_no} - {self.color} Size {self.size}"

    class Meta:
        ordering = ['color', 'size']


class FinalInspectionImage(models.Model):
    CATEGORY_CHOICES = [
        ('Packaging', 'Packaging'),
        ('Labeling', 'Labeling'),
        ('Defect', 'Defect'),
        ('General', 'General'),
        ('Measurement', 'Measurement'),
        ('On-Site Test', 'On-Site Test'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    final_inspection = models.ForeignKey(FinalInspection, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='final_inspection_images/')
    caption = models.CharField(max_length=255, default='Final Inspection Image')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='General')
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.final_inspection.order_no} - {self.caption}"

    class Meta:
        ordering = ['order', 'uploaded_at']


class FinalInspectionMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    final_inspection = models.ForeignKey(FinalInspection, related_name='measurements', on_delete=models.CASCADE)
    color = models.CharField(max_length=100, blank=True, default='')
    pom_name = models.CharField(max_length=255)
    tol = models.FloatField(default=0.0)
    spec = models.FloatField(default=0.0)
    size_name = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.pom_name} ({self.color} - {self.size_name}) - {self.final_inspection.order_no}"

    class Meta:
        ordering = ['id']


class FinalInspectionMeasurementSample(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    measurement = models.ForeignKey(FinalInspectionMeasurement, related_name='samples', on_delete=models.CASCADE)
    index = models.PositiveIntegerField(help_text="Sample number (1, 2, 3...)")
    value = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['index']
        unique_together = ['measurement', 'index']

    def __str__(self):
        return f"S{self.index}: {self.value}"
