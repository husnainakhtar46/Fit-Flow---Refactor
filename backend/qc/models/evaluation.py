import uuid
from django.db import models
from django.contrib.auth import get_user_model
from .core import Customer, Factory
from .template import Template

User = get_user_model()


class Inspection(models.Model):
    STAGE_CHOICES = [
        ("Dev", "Dev"), ("Proto", "Proto"), ("Fit", "Fit"),
        ("SMS", "SMS"), ("Size Set", "Size Set"), ("PPS", "PPS"), ("Shipment Sample", "Shipment Sample")
    ]
    DECISION_CHOICES = [
        ("Accepted", "Accepted"), ("Rejected", "Rejected"), ("Represent", "Represent")
    ]
    CUSTOMER_DECISION_CHOICES = [
        ("Accepted", "Accepted"),
        ("Rejected", "Rejected"),
        ("Revision Requested", "Revision Requested"),
        ("Accepted with Comments", "Accepted with Comments"),
        ("Held Internally", "Held Internally"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    style = models.CharField(max_length=255, blank=True, default="")
    color = models.CharField(max_length=255, blank=True)
    po_number = models.CharField(max_length=255, blank=True)
    factory = models.ForeignKey(Factory, null=True, blank=True, on_delete=models.SET_NULL, related_name='evaluations')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default="Proto")
    template = models.ForeignKey(Template, null=True, blank=True, on_delete=models.SET_NULL)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL)

    # --- Customer Comments by Category (Previous Feedback) ---
    customer_remarks = models.TextField(blank=True, verbose_name="Customer Feedback Summary")
    customer_fit_comments = models.TextField(blank=True, verbose_name="Customer Fit Comments")
    customer_workmanship_comments = models.TextField(blank=True, verbose_name="Customer Workmanship Comments")
    customer_wash_comments = models.TextField(blank=True, verbose_name="Customer Wash Comments")
    customer_fabric_comments = models.TextField(blank=True, verbose_name="Customer Fabric Comments")
    customer_accessories_comments = models.TextField(blank=True, verbose_name="Customer Accessories Comments")
    customer_comments_addressed = models.BooleanField(default=False, help_text="Check if all customer points are resolved")

    # --- QA Evaluation Comments ---
    qa_fit_comments = models.TextField(blank=True, verbose_name="QA Fit Comments")
    qa_workmanship_comments = models.TextField(blank=True, verbose_name="QA Workmanship Comments")
    qa_wash_comments = models.TextField(blank=True, verbose_name="QA Wash Comments")
    qa_fabric_comments = models.TextField(blank=True, verbose_name="QA Fabric Comments")
    qa_accessories_comments = models.TextField(blank=True, verbose_name="QA Accessories Comments")

    # --- Fabric Checks ---
    HANDFEEL_CHOICES = [('OK', 'OK'), ('Not OK', 'Not OK')]
    PILLING_CHOICES = [('None', 'None'), ('Low', 'Low'), ('High', 'High')]
    fabric_handfeel = models.CharField(max_length=10, choices=HANDFEEL_CHOICES, default='OK', blank=True)
    fabric_pilling = models.CharField(max_length=10, choices=PILLING_CHOICES, default='None', blank=True)

    # --- Dynamic Accessories Checklist ---
    accessories_data = models.JSONField(default=list, blank=True)

    # General Remarks
    remarks = models.TextField(blank=True, verbose_name="General Remarks")

    # Customer Feedback Fields
    customer_decision = models.CharField(max_length=50, choices=CUSTOMER_DECISION_CHOICES, null=True, blank=True)
    customer_feedback_comments = models.TextField(blank=True, verbose_name="Customer Feedback Comments")
    customer_feedback_date = models.DateTimeField(null=True, blank=True)

    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, null=True, blank=True)
    is_draft = models.BooleanField(default=False, help_text="True if this inspection is a draft (incomplete, not finalized)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.style} - {self.color} ({self.created_at.date()})"


class Measurement(models.Model):
    """Measurement row for a POM (Point of Measure) in an Inspection."""
    STATUS_CHOICES = [("OK", "OK"), ("FAIL", "FAIL")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inspection = models.ForeignKey(Inspection, related_name="measurements", on_delete=models.CASCADE)
    pom_name = models.CharField(max_length=255)
    tol = models.FloatField(default=0.0)
    std = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="OK")

    def __str__(self):
        return f"{self.pom_name} - {self.inspection.style}"


class MeasurementSample(models.Model):
    """Dynamic sample value linked to a Measurement."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    measurement = models.ForeignKey(Measurement, related_name='samples', on_delete=models.CASCADE)
    index = models.PositiveIntegerField(help_text="Sample number (1, 2, 3...)")
    value = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['index']
        unique_together = ['measurement', 'index']

    def __str__(self):
        return f"S{self.index}: {self.value}"


class InspectionImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inspection = models.ForeignKey(Inspection, related_name="images", on_delete=models.CASCADE)
    caption = models.CharField(max_length=100, default="Inspection Image")
    image = models.ImageField(upload_to="inspection_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.inspection} - {self.caption}"
