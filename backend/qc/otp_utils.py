import secrets
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage
from django.conf import settings
from qc.models import OTPVerification

User = get_user_model()


def generate_and_send_otp(user):
    """
    Generate a 6-digit OTP, save it to the database with a 15-minute expiration,
    and send it to the user's email via Gmail API or SMTP fallback.
    """
    if not user.email or not user.email.strip():
        return False, "This account does not have a valid email address configured."

    # Generate a cryptographically secure 6-digit string
    otp_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # Expiration set to 15 minutes as per requirements
    expires_at = timezone.now() + timedelta(minutes=15)
    
    # Invalidate any previously active OTPs for this user
    OTPVerification.objects.filter(user=user, is_used=False).update(is_used=True)
    
    # Create new OTP record
    OTPVerification.objects.create(
        user=user,
        otp_code=otp_code,
        expires_at=expires_at
    )
    
    # Format email content
    subject = "Fit Flow - Password Reset Verification Code"
    body = f"""Hello {user.username},

You recently requested to reset your password for your Fit Flow account.
Your 6-digit verification code is: {otp_code}

This code will expire in 15 minutes.

If you did not request a password reset, please ignore this email.

Thanks,
Fit Flow Team
"""
    # 1. Try Gmail API (OAuth2)
    try:
        from qc.gmail_service import send_gmail_message
        send_gmail_message(
            to_emails=[user.email],
            subject=subject,
            body=body
        )
        return True, "Verification code sent to your email."
    except Exception as gmail_error:
        # 2. Try SMTP Fallback
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)
            email_msg = EmailMessage(
                subject,
                body,
                from_email,
                [user.email]
            )
            email_msg.send(fail_silently=False)
            return True, "Verification code sent to your email."
        except Exception as smtp_error:
            print(f"[OTP] Email dispatch failed. Gmail API: {gmail_error} | SMTP: {smtp_error}")
            return False, f"Email delivery failed: {gmail_error}"
