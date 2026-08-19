from rest_framework import serializers
from qc.models import (
    StyleMaster,
    SampleComment,
    SampleCommentImage,
    StyleLink,
)


class StyleLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = StyleLink
        fields = ['id', 'label', 'url', 'created_at']
        read_only_fields = ['id', 'created_at']


class SampleCommentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleCommentImage
        fields = ['id', 'image', 'caption', 'category', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class SampleCommentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    sample_number_display = serializers.CharField(source='get_sample_number_display', read_only=True)
    sample_stage = serializers.CharField(source='sample_type', required=False, allow_blank=True)
    images = SampleCommentImageSerializer(many=True, read_only=True)

    class Meta:
        model = SampleComment
        fields = [
            'id', 'sample_type', 'sample_stage', 'sample_number', 'sample_number_display',
            'comments_general', 'comments_fit', 'comments_workmanship',
            'comments_wash', 'comments_fabric', 'comments_accessories',
            'general_edited_at', 'fit_edited_at', 'workmanship_edited_at',
            'wash_edited_at', 'fabric_edited_at', 'accessories_edited_at',
            'images',
            'created_at', 'updated_at', 'created_by_username'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_username', 'sample_number_display',
            'general_edited_at', 'fit_edited_at', 'workmanship_edited_at',
            'wash_edited_at', 'fabric_edited_at', 'accessories_edited_at',
        ]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'sample_stage' in mutable_data and not mutable_data.get('sample_type'):
            mutable_data['sample_type'] = mutable_data.pop('sample_stage')
        if not mutable_data.get('sample_type'):
            mutable_data['sample_type'] = 'Fit Sample'
        if not mutable_data.get('sample_number'):
            mutable_data['sample_number'] = 1
        return super().to_internal_value(mutable_data)


class StyleMasterListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = StyleMaster
        fields = [
            'id', 'po_number', 'style_name', 'color', 'season',
            'customer', 'customer_name', 'factory', 'factory_name',
            'comments_count',
            'created_at', 'created_by_username'
        ]

    def get_comments_count(self, obj):
        return obj.comments.count()


class StyleMasterSerializer(serializers.ModelSerializer):
    comments = SampleCommentSerializer(many=True, required=False)
    links = StyleLinkSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = StyleMaster
        fields = [
            'id', 'po_number', 'style_name', 'color', 'season',
            'customer', 'customer_name', 'factory', 'factory_name',
            'comments', 'links',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_username']

    def create(self, validated_data):
        comments_data = validated_data.pop('comments', [])
        links_data = validated_data.pop('links', [])

        style = StyleMaster.objects.create(**validated_data)

        for comment_data in comments_data:
            SampleComment.objects.create(style=style, **comment_data)

        for link_data in links_data:
            StyleLink.objects.create(style=style, **link_data)

        return style

    def update(self, instance, validated_data):
        comments_data = validated_data.pop('comments', None)
        links_data = validated_data.pop('links', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if comments_data is not None:
            instance.comments.all().delete()
            for comment_data in comments_data:
                SampleComment.objects.create(style=instance, **comment_data)

        if links_data is not None:
            instance.links.all().delete()
            for link_data in links_data:
                StyleLink.objects.create(style=instance, **link_data)

        return instance
