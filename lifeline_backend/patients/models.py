from django.conf import settings
from django.db import models
from donors.models import BLOOD_GROUP_CHOICES
from hospitals.models import Hospital


class PatientRequest(models.Model):
    """
    Section 2.4 of the SRS: a PatientRequest can come from either onboarding
    path. Exactly one of `requester` (Path A) or `added_by_hospital` (Path B)
    should be set — enforced in serializer validation, not at the DB layer,
    to keep this Week 1 model simple.
    """

    class SourcePath(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        HOSPITAL = "hospital", "Hospital"

    class Urgency(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PENDING = "pending", "Pending"  # a donor is assigned, awaiting completion
        FULFILLED = "fulfilled", "Fulfilled"
        REMOVED = "removed", "Removed"

    source_path = models.CharField(max_length=20, choices=SourcePath.choices)

    # Path A: individual self-registration
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="patient_requests",
    )

    # Path B: hospital-managed registration
    added_by_hospital = models.ForeignKey(
        Hospital, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="patient_requests",
    )

    # Patient identity/contact — captured either way (FR-3.2 / FR-3P.1).
    # NOTE: patient_contact is intentionally excluded from any public-facing
    # serializer per FR-3P.5; it's only ever returned to a donor who responds.
    patient_name = models.CharField(max_length=150)
    patient_contact = models.CharField(max_length=20)

    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES)
    units_required = models.PositiveIntegerField()
    units_remaining = models.PositiveIntegerField(editable=False)

    hospital_name_freetext = models.CharField(
        max_length=200, blank=True,
        help_text="Used only for Path A, where the patient types the hospital name manually.",
    )
    ward_location = models.CharField(max_length=150, blank=True)

    # Week 2: needed for radius-based donor matching (haversine distance against
    # Donor.latitude/longitude). Optional because Week 1 didn't collect these —
    # if absent, the Week 2 matching engine falls back to ignoring radius.
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    urgency_level = models.CharField(max_length=10, choices=Urgency.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    # FR-3P.6: structured medical checklist stays internal-only, same spirit
    # as the donor checklist — kept minimal in Week 1, expandable later.
    medical_notes_structured = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self._state.adding:
            self.units_remaining = self.units_required
        super().save(*args, **kwargs)

    def apply_donation(self, units_donated):
        """Called by matches.services._complete_match (Week 4) once a
        DonationMatch reaches 2-of-3 confirmation (FR-6.6/6.7)."""
        self.units_remaining = max(0, self.units_remaining - units_donated)
        if self.units_remaining == 0:
            self.status = self.Status.FULFILLED
        else:
            # Still needs more blood — reopen for further broadcasting
            # instead of staying stuck at PENDING with no active match.
            self.status = self.Status.ACTIVE
        self.save()

    def __str__(self):
        return f"{self.patient_name} — {self.blood_group} ({self.get_urgency_level_display()})"
