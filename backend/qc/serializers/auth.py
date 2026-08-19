from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['user_id'] = str(self.user.id)
        data['is_superuser'] = self.user.is_superuser
        try:
            data['user_type'] = self.user.profile.user_type
        except Exception:
            data['user_type'] = 'qa'
        return data
