import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from .core import Customer, Factory

User = get_user_model()


class StyleMaster(models.Model):
    """
    Master record for a Style, linking PO, style details, customer, and factory.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number = models.CharField(max_length=255, db_index=True, help_text="Purchase Order Number")
    style_name = models.CharField(max_length=255)
    color = models.CharField(max_length=255, blank=True)
    season = models.CharField(max_length=100, blank=True, help_text="e.g., Fall 2026, Spring 2027")
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='styles')
    factory = models.ForeignKey(Factory, null=True, blank=True, on_delete=models.SET_NULL, related_name='styles')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_styles')

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Style Master"
        verbose_name_plural = "Style Masters"

    def __str__(self):
        return f"{self.po_number} - {self.style_name}"


class SampleComment(models.Model):
    """
    Customer comments on a specific sample type for a Style.
    """
    SAMPLE_TYPE_CHOICES = [
        ('Fit Sample', 'Fit Sample'),
        ('PP Sample', 'PP Sample'),
        ('Size Set', 'Size Set'),
        ('SMS', 'SMS'),
        ('Shipment Sample', 'Shipment Sample'),
        ('Proto', 'Proto'),
    ]

    SAMPLE_NUMBER_CHOICES = [
        (1, '1st Sample'),
        (2, '2nd Sample'),
        (3, '3rd Sample'),
        (4, '4th Sample'),
        (5, '5th Sample'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('revised', 'Revised Required'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    style = models.ForeignKey(StyleMaster, on_delete=models.CASCADE, related_name='comments')
    sample_type = models.CharField(max_length=50, choices=SAMPLE_TYPE_CHOICES)
    sample_number = models.PositiveSmallIntegerField(choices=SAMPLE_NUMBER_CHOICES, default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', blank=True)
    sample_submission_date = models.DateField(null=True, blank=True, help_text="Date sample was submitted")
    courier_tracking_number = models.CharField(max_length=255, blank=True, default='', help_text="Courier/Tracking number")

    comments_general = models.TextField(blank=True, verbose_name="General Customer Feedback")
    comments_fit = models.TextField(blank=True, verbose_name="Fit Comments")
    comments_workmanship = models.TextField(blank=True, verbose_name="Workmanship Comments")
    comments_wash = models.TextField(blank=True, verbose_name="Wash Comments")
    comments_fabric = models.TextField(blank=True, verbose_name="Fabric Comments")
    comments_accessories = models.TextField(blank=True, verbose_name="Accessories Comments")

    general_edited_at = models.DateTimeField(null=True, blank=True)
    fit_edited_at = models.DateTimeField(null=True, blank=True)
    workmanship_edited_at = models.DateTimeField(null=True, blank=True)
    wash_edited_at = models.DateTimeField(null=True, blank=True)
    fabric_edited_at = models.DateTimeField(null=True, blank=True)
    accessories_edited_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    SECTION_TIMESTAMP_MAP = {
        'comments_general': 'general_edited_at',
        'comments_fit': 'fit_edited_at',
        'comments_workmanship': 'workmanship_edited_at',
        'comments_wash': 'wash_edited_at',
        'comments_fabric': 'fabric_edited_at',
        'comments_accessories': 'accessories_edited_at',
    }

    class Meta:
        ordering = ['-sample_number', '-created_at']
        verbose_name = "Sample Comment"
        verbose_name_plural = "Sample Comments"

    def get_sample_number_display(self):
        n = self.sample_number or 1
        if 11 <= (n % 100) <= 13:
            suffix = 'th'
        else:
            suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
        return f"{n}{suffix} Sample"

    def save(self, *args, **kwargs):
        is_new = self._state.adding or not self.pk or not SampleComment.objects.filter(pk=self.pk).exists()
        if is_new and (not self.sample_number or self.sample_number == 1):
            if self.style_id and self.sample_type:
                existing_count = SampleComment.objects.filter(
                    style_id=self.style_id,
                    sample_type=self.sample_type
                ).count()
                self.sample_number = existing_count + 1

        if self.pk and not is_new:
            try:
                old = SampleComment.objects.filter(pk=self.pk).values(
                    *self.SECTION_TIMESTAMP_MAP.keys()
                ).first()
                if old:
                    now = timezone.now()
                    for field, ts_field in self.SECTION_TIMESTAMP_MAP.items():
                        new_val = getattr(self, field, '')
                        old_val = old.get(field, '')
                        if new_val != old_val:
                            setattr(self, ts_field, now)
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.style.po_number} - {self.sample_type} ({self.get_sample_number_display()})"


class SampleCommentImage(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('fit', 'Fit'),
        ('workmanship', 'Workmanship'),
        ('wash', 'Wash'),
        ('fabric', 'Fabric'),
        ('accessories', 'Accessories'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comment = models.ForeignKey(SampleComment, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='sample_comment_images/')
    caption = models.CharField(max_length=255, blank=True, default='')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']
        verbose_name = "Sample Comment Image"
        verbose_name_plural = "Sample Comment Images"

    def __str__(self):
        return f"{self.comment} - {self.get_category_display()} - {self.caption or 'Image'}"


class StyleLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    style = models.ForeignKey(StyleMaster, on_delete=models.CASCADE, related_name='links')
    label = models.CharField(max_length=255, help_text="Display name for the link")
    url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['label']
        verbose_name = "Style Link"
        verbose_name_plural = "Style Links"

    def __str__(self):
        return f"{self.style.po_number} - {self.label}"
