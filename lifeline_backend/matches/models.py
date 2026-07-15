from django.db import models


class DonationMatch(models.Model):
    """
    Links one donor to one patient request. FR-4.4: only one match per
    request should reach ACCEPTED at a time, but several BROADCAST rows are
    kept per request as retained backups for Week 4's auto-reassignment (UC-9).
    """

    class Status(models.TextChoices):
        BROADCAST = "broadcast", "Broadcast"          # notified, hasn't responded
        ACCEPTED = "accepted", "Accepted"              # this donor is assigned
        CANCELLED = "cancelled", "Cancelled"            # donor backed out
        COMPLETED = "completed", "Completed"            # donation confirmed (FR-6.1)
        CLOSED = "closed", "Closed — Not Chosen"        # another donor was accepted first

    patient_request = models.ForeignKey(
        "patients.PatientRequest", on_delete=models.CASCADE, related_name="matches"
    )
    donor = models.ForeignKey(
        "donors.Donor", on_delete=models.CASCADE, related_name="matches"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BROADCAST)

    # Distance at the time of broadcast — used to rank backups in Week 4's
    # reassignment task without recomputing haversine every time.
    distance_km = models.FloatField(null=True, blank=True)

    # FR-6.1: two of these three must be true before status can become COMPLETED.
    donor_confirmed = models.BooleanField(default=False)
    patient_confirmed = models.BooleanField(default=False)
    hospital_confirmed = models.BooleanField(default=False)

    units_donated = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("patient_request", "donor")
        ordering = ["distance_km", "created_at"]

    def confirmation_count(self):
        return sum([self.donor_confirmed, self.patient_confirmed, self.hospital_confirmed])

    def __str__(self):
        return f"{self.donor} -> request #{self.patient_request_id} ({self.status})"
