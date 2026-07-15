from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "match", "sender", "sender_username", "content", "timestamp"]
        read_only_fields = ["id", "sender", "sender_username", "timestamp"]
