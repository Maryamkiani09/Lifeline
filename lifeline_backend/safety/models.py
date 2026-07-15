from django.conf import settings
from django.db import models

# FR-8.2: repeated/severe reports auto-suspend visibility pending review.
AUTO_SUSPEND_REPORT_THRESHOLD = 3


class Report(models.Model):
    class Reason(models.TextChoices):
        SPAM = "spam", "Spam / fake request"
        ABUSIVE = "abusive", "Abusive or threatening behavior"
        NO_SHOW = "no_show", "Didn't show up / bad-faith coordination"
        FRAUD = "fraud", "Suspected fraud or exploitation"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        REVIEWED = "reviewed", "Reviewed — no action"
        ACTIONED = "actioned", "Reviewed — action taken"

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_filed"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_received"
    )
    reason = models.CharField(max_length=20, choices=Reason.choices)
    details = models.TextField(blank=True, max_length=1000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reported_by} -> {self.reported_user} ({self.reason})"


class Block(models.Model):
    """FR-8.1/8.3: a blocked user can no longer message or be matched with
    the blocking party. Directional — only affects this one relationship."""

    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_made"
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_received"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("blocker", "blocked")

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"
