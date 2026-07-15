from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Hospital
from .serializers import (
    HospitalRegisterSerializer,
    HospitalDirectorySerializer,
    HospitalDetailSerializer,
)


class HospitalRegisterView(APIView):
    """POST /api/hospitals/register/ — UC-3 main flow."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = HospitalRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hospital = serializer.save()

        admin_user = hospital.staff_members.get(is_admin=True).user
        refresh = RefreshToken.for_user(admin_user)
        return Response(
            {
                "message": "Hospital registered and pending verification. It will appear in the public directory once approved.",
                "hospital_id": hospital.id,
                "is_verified": hospital.is_verified,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class HospitalDirectoryListView(generics.ListAPIView):
    """GET /api/hospitals/ — UC-5: public directory of verified hospitals only."""

    serializer_class = HospitalDirectorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Hospital.objects.filter(is_verified=True).order_by("name")


class HospitalDetailView(generics.RetrieveAPIView):
    """GET /api/hospitals/<id>/ — public hospital page (patient list wired up in Week 2)."""

    serializer_class = HospitalDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Hospital.objects.filter(is_verified=True)
