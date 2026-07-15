from django.contrib.auth.models import AbstractUser
from django.db import models
from .validators import validate_cnic, normalize_cnic


class User(AbstractUser):
    """
    Base user for every role in the system. Role-specific data (blood group,
    hospital link, etc.) lives in the donors/hospitals/patients apps and
    points back here via a OneToOneField or ForeignKey.
    """

    class Role(models.TextChoices):
        DONOR = "donor", "Donor"
        PATIENT = "patient", "Individual Patient"
        HOSPITAL_STAFF = "hospital_staff", "Hospital Staff"
        ADMIN = "admin", "Platform Admin"

    role = models.CharField(max_length=20, choices=Role.choices)

    # FR-1.1 / FR-1.2: CNIC required for both donor and patient/requester registration.
    cnic = models.CharField(
        max_length=13, unique=True, validators=[validate_cnic],
        help_text="13 digits, dashes optional on input (stored without dashes).",
    )
    phone_number = models.CharField(max_length=20)

    LANGUAGE_CHOICES = [("en", "English"), ("ur", "Urdu")]
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.cnic:
            self.cnic = normalize_cnic(self.cnic)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    class Meta:
        # FR-1.6: raw CNIC is never serialized out to other users (enforced in
        # serializers, not here) — this index just makes verified-duplicate
        # lookups fast for admins.
        indexes = [models.Index(fields=["cnic"])]
