import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

User = get_user_model()


class UserProfile(models.Model):
    """User profile for role-based access control."""
    USER_TYPE_CHOICES = [
        ('qa', 'QA'),
        ('quality_head', 'Quality Head'),
        ('quality_supervisor', 'Quality Supervisor'),
        ('merchandiser', 'Merchandiser'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='qa')

    def __str__(self):
        return f"{self.user.username} - {self.get_user_type_display()}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile when User is created (if not already exists)."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Auto-save profile when User is saved."""
    try:
        if hasattr(instance, 'profile') and instance.profile:
            instance.profile.save()
    except UserProfile.DoesNotExist:
        pass


class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.name


class CustomerEmail(models.Model):
    EMAIL_TYPE_CHOICES = [
        ('to', 'To'),
        ('cc', 'CC'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, related_name="emails", on_delete=models.CASCADE)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    email_type = models.CharField(max_length=2, choices=EMAIL_TYPE_CHOICES, default='to')

    def __str__(self):
        if self.contact_name:
            return f"{self.contact_name} <{self.email}> [{self.get_email_type_display()}] ({self.customer.name})"
        return f"{self.email} [{self.get_email_type_display()}] ({self.customer.name})"


class Factory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class OTPVerification(models.Model):
    """Temporary storage for One-Time Passwords sent via email for password reset."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_requests')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        """Check if the OTP is un-used and not expired."""
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        return f"OTP for {self.user.email} - {'Used' if self.is_used else 'Active'}"
