from rest_framework import permissions


class IsDonor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "donor_profile")
        )


class IsPartyToMatch(permissions.BasePermission):
    """Used by chat (Week 3): only the matched donor, the patient/requester,
    or that request's hospital staff may access a given match's messages."""

    def has_object_permission(self, request, view, match):
        user = request.user
        if hasattr(user, "donor_profile") and match.donor_id == user.donor_profile.id:
            return True
        pr = match.patient_request
        if pr.requester_id == user.id:
            return True
        if hasattr(user, "hospital_staff_profile") and pr.added_by_hospital_id == user.hospital_staff_profile.hospital_id:
            return True
        return False
