from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Donor
from .serializers import DonorRegisterSerializer, DonorProfileSerializer


class DonorRegisterView(APIView):
    """POST /api/donors/register/ — UC-2 main flow, steps 1-5."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DonorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donor = serializer.save()

        refresh = RefreshToken.for_user(donor.user)
        return Response(
            {
                "message": "Donor registered. CNIC verification is pending before you appear in donor matching.",
                "donor_id": donor.id,
                "status": donor.status,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class DonorMeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/donors/me/ — a logged-in donor's own profile,
    including the FR-2.4 availability toggle and FR-2.5 radius setting."""

    serializer_class = DonorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Donor.objects.get(user=self.request.user)
