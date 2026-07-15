from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from patients.models import PatientRequest
from .models import DonationMatch
from .permissions import IsDonor
from .serializers import DonorBroadcastSerializer, MatchAcceptResultSerializer, MatchDashboardSerializer
from .services import confirm_donation, cancel_match


class MyMatchesView(generics.ListAPIView):
    """
    GET /api/matches/my-matches/ — active/completed matches relevant to the
    logged-in user, regardless of role. Powers the "current match" section
    on donor, patient, and hospital dashboards alike. Excludes untouched
    BROADCAST rows (donor's own pending offers — see /my-broadcasts/) and
    CLOSED rows (offers that lost out to another donor).
    """

    serializer_class = MatchDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DonationMatch.objects.exclude(
            status__in=[DonationMatch.Status.BROADCAST, DonationMatch.Status.CLOSED]
        ).select_related("patient_request", "donor__user")

        if hasattr(user, "donor_profile"):
            return qs.filter(donor=user.donor_profile).order_by("-created_at")
        if hasattr(user, "hospital_staff_profile"):
            return qs.filter(
                patient_request__added_by_hospital=user.hospital_staff_profile.hospital
            ).order_by("-created_at")
        return qs.filter(patient_request__requester=user).order_by("-created_at")


class DonorBroadcastListView(generics.ListAPIView):
    """GET /api/matches/my-broadcasts/ — UC-6: requests broadcast to this
    donor that they haven't responded to yet."""

    serializer_class = DonorBroadcastSerializer
    permission_classes = [IsDonor]

    def get_queryset(self):
        return (
            DonationMatch.objects.filter(
                donor=self.request.user.donor_profile,
                status=DonationMatch.Status.BROADCAST,
            )
            .select_related("patient_request")
        )


class AcceptMatchView(APIView):
    """
    POST /api/matches/<match_id>/accept/ — UC-6 steps 3-4.
    First donor to accept wins the request; every other BROADCAST row for
    the same request is closed (but kept, as backups for Week 4's UC-9).
    """

    permission_classes = [IsDonor]

    def post(self, request, match_id):
        try:
            match = DonationMatch.objects.select_related("patient_request").get(
                id=match_id, donor=request.user.donor_profile
            )
        except DonationMatch.DoesNotExist:
            return Response({"detail": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

        patient_request = match.patient_request

        if patient_request.status != PatientRequest.Status.ACTIVE:
            return Response(
                {"detail": "This request already has an assigned donor or is no longer active."},
                status=status.HTTP_409_CONFLICT,
            )
        if match.status != DonationMatch.Status.BROADCAST:
            return Response({"detail": "This match is no longer open."}, status=status.HTTP_409_CONFLICT)

        match.status = DonationMatch.Status.ACCEPTED
        match.save()

        patient_request.status = PatientRequest.Status.PENDING
        patient_request.save()

        DonationMatch.objects.filter(
            patient_request=patient_request, status=DonationMatch.Status.BROADCAST
        ).exclude(id=match.id).update(status=DonationMatch.Status.CLOSED)

        from .tasks import send_donor_accepted_email
        from .services import _safe_delay
        _safe_delay(send_donor_accepted_email, patient_request.id)

        return Response(MatchAcceptResultSerializer(match).data, status=status.HTTP_200_OK)


class ConfirmDonationView(APIView):
    """
    POST /api/matches/<match_id>/confirm/ — UC-8: 2-of-3 confirmation.
    Whoever is calling (donor, patient/requester, or hospital staff on that
    request) gets their own flag set; auto-completes once 2 flags are true.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, match_id):
        match = get_object_or_404(DonationMatch, id=match_id)
        role = self._determine_role(request.user, match)
        if role is None:
            return Response(
                {"detail": "You are not a party to this match."}, status=status.HTTP_403_FORBIDDEN
            )

        match = confirm_donation(match, role)
        return Response({
            "match_id": match.id,
            "status": match.status,
            "donor_confirmed": match.donor_confirmed,
            "patient_confirmed": match.patient_confirmed,
            "hospital_confirmed": match.hospital_confirmed,
        })

    @staticmethod
    def _determine_role(user, match):
        if hasattr(user, "donor_profile") and match.donor_id == user.donor_profile.id:
            return "donor"
        if match.patient_request.requester_id == user.id:
            return "patient"
        if (
            hasattr(user, "hospital_staff_profile")
            and match.patient_request.added_by_hospital_id == user.hospital_staff_profile.hospital_id
        ):
            return "hospital"
        return None


class CancelMatchView(APIView):
    """POST /api/matches/<match_id>/cancel/ — donor backs out; triggers
    Celery-based backup reassignment (UC-9) instead of leaving the patient stuck."""

    permission_classes = [IsDonor]

    def post(self, request, match_id):
        match = get_object_or_404(DonationMatch, id=match_id, donor=request.user.donor_profile)
        if match.status != DonationMatch.Status.ACCEPTED:
            return Response(
                {"detail": "Only an accepted match can be cancelled."}, status=status.HTTP_409_CONFLICT
            )
        cancel_match(match)
        return Response({"detail": "Match cancelled. Searching for a backup donor."})


class CallNowView(APIView):
    """
    POST /api/matches/<match_id>/call-now/ — FR-5.3/5.4: for High/Critical
    urgency accepted matches, set up a masked call session so donor and
    patient can call each other without either real number being exposed.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, match_id):
        match = get_object_or_404(DonationMatch, id=match_id)
        role = ConfirmDonationView._determine_role(request.user, match)
        if role not in ("donor", "patient", "hospital"):
            return Response({"detail": "You are not a party to this match."}, status=status.HTTP_403_FORBIDDEN)

        if match.status != DonationMatch.Status.ACCEPTED:
            return Response({"detail": "Masked calling is only available for an accepted match."}, status=status.HTTP_409_CONFLICT)

        pr = match.patient_request
        if pr.urgency_level not in ("high", "critical"):
            return Response(
                {"detail": "Masked calling is reserved for High/Critical urgency requests. Use chat for this request."},
                status=status.HTTP_409_CONFLICT,
            )

        from .twilio_service import create_masked_call_session
        result = create_masked_call_session(
            donor_phone=match.donor.user.phone_number,
            patient_phone=pr.patient_contact,
            unique_name=f"match-{match.id}",
        )
        return Response(result, status=status.HTTP_200_OK if result.get("configured") else status.HTTP_501_NOT_IMPLEMENTED)

