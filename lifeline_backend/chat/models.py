from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    """FR-5.1: donor and patient (or hospital staff) chat once a match exists."""

    match = models.ForeignKey(
        "matches.DonationMatch", on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(max_length=2000)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.match_id}] {self.sender.username}: {self.content[:40]}"
