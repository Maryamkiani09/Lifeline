from rest_framework import serializers
from .models import Report, Block


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "reported_user", "reason", "details", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_reported_user(self, value):
        request_user = self.context["request"].user
        if value.id == request_user.id:
            raise serializers.ValidationError("You can't report yourself.")
        return value


class BlockSerializer(serializers.ModelSerializer):
    blocked_username = serializers.CharField(source="blocked.username", read_only=True)

    class Meta:
        model = Block
        fields = ["id", "blocked", "blocked_username", "created_at"]
        read_only_fields = ["id", "blocked_username", "created_at"]

    def validate_blocked(self, value):
        request_user = self.context["request"].user
        if value.id == request_user.id:
            raise serializers.ValidationError("You can't block yourself.")
        return value
