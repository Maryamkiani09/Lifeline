from rest_framework import generics, permissions
from .models import Report, Block
from .serializers import ReportCreateSerializer, BlockSerializer


class ReportCreateView(generics.CreateAPIView):
    """POST /api/safety/report/ — FR-8.1/8.2."""

    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class BlockListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/safety/blocks/ — who I've blocked.
    POST /api/safety/blocks/ — FR-8.1/8.3: block a user.
    """

    serializer_class = BlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user)

    def perform_create(self, serializer):
        serializer.save(blocker=self.request.user)


class BlockDeleteView(generics.DestroyAPIView):
    """DELETE /api/safety/blocks/<id>/ — unblock."""

    serializer_class = BlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user)
