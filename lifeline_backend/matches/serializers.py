from rest_framework import serializers
from .models import DonationMatch


class DonorBroadcastSerializer(serializers.ModelSerializer):
    """
    GET /api/matches/my-broadcasts/ — FR-3P.5: deliberately excludes
    patient_contact and patient_name. A donor sees enough to decide whether
    to help, not who the patient is, until they accept.
    """

    blood_group = serializers.CharField(source="patient_request.blood_group", read_only=True)
    units_required = serializers.IntegerField(source="patient_request.units_required", read_only=True)
    units_remaining = serializers.IntegerField(source="patient_request.units_remaining", read_only=True)
    urgency_level = serializers.CharField(source="patient_request.urgency_level", read_only=True)
    hospital_name = serializers.CharField(source="patient_request.hospital_name_freetext", read_only=True)
    ward_location = serializers.CharField(source="patient_request.ward_location", read_only=True)

    class Meta:
        model = DonationMatch
        fields = [
            "id", "blood_group", "units_required", "units_remaining",
            "urgency_level", "hospital_name", "ward_location",
            "distance_km", "created_at",
        ]


class MatchAcceptResultSerializer(serializers.ModelSerializer):
    """Returned ONLY to the donor who just accepted — this is where FR-3P.5's
    contact reveal actually happens."""

    patient_name = serializers.CharField(source="patient_request.patient_name", read_only=True)
    patient_contact = serializers.CharField(source="patient_request.patient_contact", read_only=True)
    ward_location = serializers.CharField(source="patient_request.ward_location", read_only=True)
    urgency_level = serializers.CharField(source="patient_request.urgency_level", read_only=True)

    class Meta:
        model = DonationMatch
        fields = ["id", "status", "patient_name", "patient_contact", "ward_location", "urgency_level"]


class MatchSummarySerializer(serializers.ModelSerializer):
    """Generic summary used by the chat app to show match context (Week 3)."""

    donor_username = serializers.CharField(source="donor.user.username", read_only=True)
    patient_name = serializers.CharField(source="patient_request.patient_name", read_only=True)

    class Meta:
        model = DonationMatch
        fields = ["id", "status", "donor_username", "patient_name"]


class MatchDashboardSerializer(serializers.ModelSerializer):
    """
    GET /api/matches/my-matches/ — once a match is past the broadcast stage,
    both sides already know each other (contact was revealed on accept), so
    this intentionally includes patient_contact/donor info unlike the
    pre-accept broadcast serializer.
    """

    donor_username = serializers.CharField(source="donor.user.username", read_only=True)
    donor_phone = serializers.CharField(source="donor.user.phone_number", read_only=True)
    patient_name = serializers.CharField(source="patient_request.patient_name", read_only=True)
    patient_contact = serializers.CharField(source="patient_request.patient_contact", read_only=True)
    blood_group = serializers.CharField(source="patient_request.blood_group", read_only=True)
    urgency_level = serializers.CharField(source="patient_request.urgency_level", read_only=True)
    ward_location = serializers.CharField(source="patient_request.ward_location", read_only=True)

    class Meta:
        model = DonationMatch
        fields = [
            "id", "status", "donor_username", "donor_phone", "patient_name",
            "patient_contact", "blood_group", "urgency_level", "ward_location",
            "donor_confirmed", "patient_confirmed", "hospital_confirmed",
            "created_at", "completed_at",
        ]
