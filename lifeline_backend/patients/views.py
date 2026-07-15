from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from hospitals.models import HospitalStaff
from .models import PatientRequest
from .serializers import (
    IndividualPatientRegisterSerializer,
    HospitalPatientRequestSerializer,
    PatientRequestPublicSerializer,
)


class IndividualPatientRegisterView(APIView):
    """POST /api/patients/register/ — UC-1 main flow (Path A)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = IndividualPatientRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient_request = serializer.save()

        refresh = RefreshToken.for_user(patient_request.requester)
        return Response(
            {
                "message": "Request created. Matching donors will be notified once broadcast matching goes live in Week 2.",
                "request_id": patient_request.id,
                "units_remaining": patient_request.units_remaining,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MyPatientRequestsView(generics.ListAPIView):
    """GET /api/patients/my-requests/ — an individual patient/requester's own
    requests (Path A). Full detail is fine here since it's the owner's own data."""

    serializer_class = HospitalPatientRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PatientRequest.objects.filter(
            requester=self.request.user, source_path=PatientRequest.SourcePath.INDIVIDUAL
        ).order_by("-created_at")


class IsHospitalStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "hospital_staff_profile")
        )


class HospitalPatientRequestListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/patients/hospital-requests/ — this hospital's own requests (staff dashboard).
    POST /api/patients/hospital-requests/ — UC-4: add a patient request (Path B).
    """

    serializer_class = HospitalPatientRequestSerializer
    permission_classes = [IsHospitalStaff]

    def get_hospital(self):
        return self.request.user.hospital_staff_profile.hospital

    def get_queryset(self):
        return PatientRequest.objects.filter(added_by_hospital=self.get_hospital()).order_by("-urgency_level", "-created_at")

    def perform_create(self, serializer):
        serializer.save(
            added_by_hospital=self.get_hospital(),
            source_path=PatientRequest.SourcePath.HOSPITAL,
        )


class HospitalPatientRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """FR-3P.7: hospital staff can edit or close (soft-delete via status) a request they added."""

    serializer_class = HospitalPatientRequestSerializer
    permission_classes = [IsHospitalStaff]

    def get_queryset(self):
        return PatientRequest.objects.filter(
            added_by_hospital=self.request.user.hospital_staff_profile.hospital
        )

    def perform_destroy(self, instance):
        # Soft delete: keep the audit trail, don't hard-delete a medical record.
        instance.status = PatientRequest.Status.REMOVED
        instance.save()


class HospitalPublicPatientListView(generics.ListAPIView):
    """
    GET /api/patients/public/hospital/<hospital_id>/ — UC-5: what a visitor
    sees after clicking a hospital in the directory. Contact/medical hidden.
    """

    serializer_class = PatientRequestPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        hospital_id = self.kwargs["hospital_id"]
        return PatientRequest.objects.filter(
            added_by_hospital_id=hospital_id, status=PatientRequest.Status.ACTIVE
        )
