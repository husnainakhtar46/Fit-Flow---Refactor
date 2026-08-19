from rest_framework import serializers
from qc.models import (
    Customer,
    CustomerEmail,
    Template,
    TemplatePOM,
    FilterPreset,
    Factory,
)


class CustomerEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerEmail
        fields = ["id", "contact_name", "email", "email_type"]


class CustomerSerializer(serializers.ModelSerializer):
    emails = CustomerEmailSerializer(many=True, required=False)

    class Meta:
        model = Customer
        fields = ["id", "name", "created_at", "emails"]

    def create(self, validated_data):
        emails_data = validated_data.pop("emails", [])
        customer = Customer.objects.create(**validated_data)
        for email_data in emails_data:
            CustomerEmail.objects.create(customer=customer, **email_data)
        return customer

    def update(self, instance, validated_data):
        emails_data = validated_data.pop("emails", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if emails_data is not None:
            instance.emails.all().delete()
            for email_data in emails_data:
                CustomerEmail.objects.create(customer=instance, **email_data)
        return instance


class FactorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Factory
        fields = ["id", "name", "address", "contact_person", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TemplatePOMSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplatePOM
        fields = ["id", "name", "default_tol", "default_std", "order"]


class TemplateSerializer(serializers.ModelSerializer):
    poms = TemplatePOMSerializer(many=True)

    class Meta:
        model = Template
        fields = ["id", "name", "description", "created_at", "poms", "customer"]

    def create(self, validated_data):
        poms_data = validated_data.pop("poms", [])
        template = Template.objects.create(**validated_data)
        for i, pom in enumerate(poms_data):
            TemplatePOM.objects.create(template=template, order=i, **pom)
        return template

    def update(self, instance, validated_data):
        poms_data = validated_data.pop("poms", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if poms_data is not None:
            instance.poms.all().delete()
            for i, pom in enumerate(poms_data):
                TemplatePOM.objects.create(
                    template=instance,
                    order=i,
                    name=pom.get("name", ""),
                    default_tol=pom.get("default_tol", 0.0),
                    default_std=pom.get("default_std", None),
                )
        return instance


class FilterPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilterPreset
        fields = ["id", "name", "description", "filters", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
