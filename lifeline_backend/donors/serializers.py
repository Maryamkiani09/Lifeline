from django.db import transaction
from rest_framework import serializers
from accounts.models import User
from .models import Donor


class DonorRegisterSerializer(serializers.Serializer):
    """
    UC-2: Register & Verify as Donor.
    Creates the User (role=donor) and the nested Donor profile in one call,
    so the frontend can submit a single registration form.
    """

    # --- account fields ---
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    cnic = serializers.CharField(max_length=15)
    phone_number = serializers.CharField(max_length=20)
    preferred_language = serializers.ChoiceField(choices=User.LANGUAGE_CHOICES, default="en")

    # --- donor profile fields ---
    blood_group = serializers.ChoiceField(choices=Donor._meta.get_field("blood_group").choices)
    city = serializers.CharField(max_length=100)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    travel_radius_km = serializers.IntegerField(required=False, default=15)
    age = serializers.IntegerField(min_value=0, max_value=120)
    weight_kg = serializers.FloatField(min_value=0)
    has_recent_tattoo_or_piercing = serializers.BooleanField(default=False)
    has_recent_major_surgery = serializers.BooleanField(default=False)
    on_blood_thinners = serializers.BooleanField(default=False)
    hiv_positive = serializers.BooleanField(default=False)
    hepatitis_b_or_c = serializers.BooleanField(default=False)
    has_chronic_illness = serializers.BooleanField(default=False)
    recent_malaria_endemic_travel = serializers.BooleanField(default=False)
    is_pregnant_or_recent_childbirth = serializers.BooleanField(default=False)
    cnic_image = serializers.ImageField(required=False, allow_null=True)

    def validate_cnic(self, value):
        from accounts.validators import validate_cnic
        validate_cnic(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        donor_fields = [
            "blood_group", "city", "latitude", "longitude", "travel_radius_km",
            "age", "weight_kg", "has_recent_tattoo_or_piercing",
            "has_recent_major_surgery", "on_blood_thinners", "hiv_positive",
            "hepatitis_b_or_c", "has_chronic_illness",
            "recent_malaria_endemic_travel", "is_pregnant_or_recent_childbirth",
            "cnic_image",
        ]
        donor_data = {k: validated_data.pop(k) for k in donor_fields if k in validated_data}

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            cnic=validated_data["cnic"],
            phone_number=validated_data["phone_number"],
            preferred_language=validated_data.get("preferred_language", "en"),
            role=User.Role.DONOR,
        )
        donor = Donor.objects.create(user=user, **donor_data)
        return donor


class DonorProfileSerializer(serializers.ModelSerializer):
    """Read/update view for a donor's own profile (GET/PATCH /api/donors/me/)."""

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Donor
        fields = [
            "id", "username", "blood_group", "city", "latitude", "longitude",
            "travel_radius_km", "is_available", "status", "next_eligible_date",
            "donation_count", "is_cnic_verified", "created_at",
        ]
        read_only_fields = [
            "id", "username", "status", "next_eligible_date",
            "donation_count", "is_cnic_verified", "created_at",
        ]
