from django.db import transaction
from rest_framework import serializers
from accounts.models import User
from donors.models import BLOOD_GROUP_CHOICES
from .models import PatientRequest


class IndividualPatientRegisterSerializer(serializers.Serializer):
    """
    UC-1: Register as Individual Patient / Create Request.
    Creates the User (role=patient) and the first PatientRequest together,
    matching the SRS flow where an individual patient registers *in order to*
    raise a request, rather than creating an account for its own sake.
    """

    # --- account fields ---
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    cnic = serializers.CharField(max_length=15)
    phone_number = serializers.CharField(max_length=20)
    preferred_language = serializers.ChoiceField(choices=User.LANGUAGE_CHOICES, default="en")

    # --- request fields (FR-3.2) ---
    patient_name = serializers.CharField(max_length=150)
    blood_group = serializers.ChoiceField(choices=BLOOD_GROUP_CHOICES)
    units_required = serializers.IntegerField(min_value=1)
    hospital_name_freetext = serializers.CharField(max_length=200)
    ward_location = serializers.CharField(max_length=150, required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    urgency_level = serializers.ChoiceField(choices=PatientRequest.Urgency.choices)

    def validate_cnic(self, value):
        from accounts.validators import validate_cnic
        validate_cnic(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        request_fields = [
            "patient_name", "blood_group", "units_required",
            "hospital_name_freetext", "ward_location", "urgency_level",
            "latitude", "longitude",
        ]
        request_data = {k: validated_data.pop(k) for k in request_fields if k in validated_data}

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            cnic=validated_data["cnic"],
            phone_number=validated_data["phone_number"],
            preferred_language=validated_data.get("preferred_language", "en"),
            role=User.Role.PATIENT,
        )
        patient_request = PatientRequest.objects.create(
            requester=user,
            source_path=PatientRequest.SourcePath.INDIVIDUAL,
            patient_contact=user.phone_number,
            **request_data,
        )
        return patient_request


class HospitalPatientRequestSerializer(serializers.ModelSerializer):
    """
    UC-4: Add Patient Request (by Hospital).
    Used by an authenticated hospital-staff user; `added_by_hospital` and
    `source_path` are set server-side in the view, not accepted from the client.
    """

    class Meta:
        model = PatientRequest
        fields = [
            "id", "patient_name", "patient_contact", "blood_group",
            "units_required", "units_remaining", "ward_location",
            "urgency_level", "status", "medical_notes_structured", "created_at",
            "latitude", "longitude",
        ]
        read_only_fields = ["id", "units_remaining", "status", "created_at"]


class PatientRequestPublicSerializer(serializers.ModelSerializer):
    """
    FR-3P.4/3P.5: public hospital-page listing — blood group, units, urgency
    only. No contact info, no medical detail. Used for the hospital directory
    detail page (UC-5) regardless of source path.
    """

    class Meta:
        model = PatientRequest
        fields = ["id", "blood_group", "units_required", "units_remaining", "urgency_level", "status"]
