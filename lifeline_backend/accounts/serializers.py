from rest_framework import serializers
from .models import User


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Safe, read-only view of a user for nesting inside other responses.
    Deliberately excludes cnic (FR-1.6: raw CNIC is never shown to other users).
    """

    class Meta:
        model = User
        fields = ["id", "username", "role", "preferred_language"]
        read_only_fields = fields


class CurrentUserSerializer(serializers.ModelSerializer):
    """Full-ish view returned only to the user themselves via /api/auth/me/."""

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "phone_number",
            "preferred_language", "created_at",
        ]
        read_only_fields = fields
