from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from qc.models import OTPVerification
from qc.otp_utils import generate_and_send_otp

User = get_user_model()


class RequestOTPView(APIView):
    """
    Endpoint for requesting a password reset OTP.
    Accessible by anyone (unauthenticated).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up the user by email using filter().first() to avoid MultipleObjectsReturned
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'error': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate OTP and send email via Gmail API with SMTP fallback
        success, message = generate_and_send_otp(user)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """
    Endpoint for validating the OTP and setting a new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otpCode', '').strip()
        new_password = request.data.get('newPassword', '')

        if not all([email, otp_code, new_password]):
            return Response(
                {'error': 'Email, verification code, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify the OTP across any account with this email
        otp_record = OTPVerification.objects.filter(
            user__email__iexact=email, 
            otp_code=otp_code, 
            is_used=False
        ).select_related('user').first()

        if not otp_record:
            return Response({'error': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not otp_record.is_valid():
            return Response(
                {'error': 'This verification code has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update user's password
        user = otp_record.user
        user.set_password(new_password)
        user.save()
        
        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save()
        
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
