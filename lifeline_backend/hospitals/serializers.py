from django.db import transaction
from rest_framework import serializers
from accounts.models import User
from .models import Hospital, HospitalStaff


class HospitalRegisterSerializer(serializers.Serializer):
    """
    UC-3: Register Hospital Organization.
    Creates the Hospital record (is_verified=False) plus the first staff
    User (role=hospital_staff, is_admin=True) in one call.
    """

    # --- hospital fields ---
    name = serializers.CharField(max_length=200)
    official_address = serializers.CharField(max_length=300)
    city = serializers.CharField(max_length=100)
    license_number = serializers.CharField(max_length=100)
    official_contact = serializers.CharField(max_length=20)
    official_email = serializers.EmailField()

    # --- first admin staff account fields ---
    admin_username = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_cnic = serializers.CharField(max_length=15)
    admin_phone_number = serializers.CharField(max_length=20)

    def validate_license_number(self, value):
        if Hospital.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("A hospital with this license number is already registered.")
        return value

    def validate_admin_cnic(self, value):
        from accounts.validators import validate_cnic
        validate_cnic(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        hospital = Hospital.objects.create(
            name=validated_data["name"],
            official_address=validated_data["official_address"],
            city=validated_data["city"],
            license_number=validated_data["license_number"],
            official_contact=validated_data["official_contact"],
            official_email=validated_data["official_email"],
            is_verified=False,  # FR-3H.3: pending admin review
        )

        admin_user = User.objects.create_user(
            username=validated_data["admin_username"],
            email=validated_data["admin_email"],
            password=validated_data["admin_password"],
            cnic=validated_data["admin_cnic"],
            phone_number=validated_data["admin_phone_number"],
            role=User.Role.HOSPITAL_STAFF,
        )
        HospitalStaff.objects.create(user=admin_user, hospital=hospital, is_admin=True)
        return hospital


class HospitalDirectorySerializer(serializers.ModelSerializer):
    """FR-3P.3: public list of verified hospitals — no sensitive detail."""

    active_request_count = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = ["id", "name", "city", "active_request_count"]

    def get_active_request_count(self, obj):
        return obj.patient_requests.filter(status="active").count()


class HospitalDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ["id", "name", "city", "official_address", "is_verified"]
