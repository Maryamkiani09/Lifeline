from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from matches.models import DonationMatch
from matches.permissions import IsPartyToMatch
from .models import ChatMessage
from .serializers import ChatMessageSerializer


class ChatHistoryView(generics.ListAPIView):
    """GET /api/chat/<match_id>/history/ — loads existing messages when a
    user opens a chat thread; the WebSocket (see consumers.py) handles
    everything sent after that point live."""

    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_match(self):
        match = get_object_or_404(DonationMatch, id=self.kwargs["match_id"])
        if not IsPartyToMatch().has_object_permission(self.request, self, match):
            raise PermissionDenied("You are not a party to this match.")
        return match

    def get_queryset(self):
        return ChatMessage.objects.filter(match=self.get_match())
