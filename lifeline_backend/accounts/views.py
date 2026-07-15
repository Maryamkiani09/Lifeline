from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import CurrentUserSerializer


class CurrentUserView(RetrieveAPIView):
    """GET /api/auth/me/ — who am I, and what's my role. Used by the frontend
    to decide which dashboard (donor/patient/hospital) to route into after login."""

    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
