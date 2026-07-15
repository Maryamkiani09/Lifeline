from django.conf import settings
from django.db import models

BLOOD_GROUP_CHOICES = [
    ("O-", "O-"), ("O+", "O+"),
    ("A-", "A-"), ("A+", "A+"),
    ("B-", "B-"), ("B+", "B+"),
    ("AB-", "AB-"), ("AB+", "AB+"),
]


class Donor(models.Model):
    """FR-2.x: Donor Registration & Profile."""

    class Status(models.TextChoices):
        ELIGIBLE = "eligible", "Eligible"
        DISQUALIFIED = "disqualified", "Disqualified"
        COOLING_DOWN = "cooling_down", "Cooling Down"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="donor_profile"
    )

    # FR-2.1
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES)
    city = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # FR-2.5
    travel_radius_km = models.PositiveIntegerField(default=15)

    # FR-2.2: structured eligibility checklist — never free text.
    age = models.PositiveIntegerField()
    weight_kg = models.FloatField()
    has_recent_tattoo_or_piercing = models.BooleanField(default=False)
    has_recent_major_surgery = models.BooleanField(default=False)
    on_blood_thinners = models.BooleanField(default=False)
    hiv_positive = models.BooleanField(default=False)
    hepatitis_b_or_c = models.BooleanField(default=False)
    has_chronic_illness = models.BooleanField(default=False)
    recent_malaria_endemic_travel = models.BooleanField(default=False)
    is_pregnant_or_recent_childbirth = models.BooleanField(default=False)

    # FR-1.3 / FR-1.4: CNIC image + verification gate before appearing in matching.
    cnic_image = models.ImageField(upload_to="cnic_uploads/donors/", null=True, blank=True)
    is_cnic_verified = models.BooleanField(default=False)

    # FR-2.4
    is_available = models.BooleanField(default=True)

    # FR-8.2: set by safety.signals when a donor accumulates enough reports.
    is_suspended = models.BooleanField(default=False)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ELIGIBLE)
    next_eligible_date = models.DateField(null=True, blank=True)  # set in Week 4 (cooldown logic)

    # FR-2.6
    donation_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def evaluate_eligibility(self):
        """
        FR-2.3: auto-disqualify donors who fail baseline eligibility so they
        don't appear in matching. Kept as a plain method (not a signal) so
        it's easy to unit test directly.
        """
        disqualifying = any([
            self.age < 18 or self.age > 65,
            self.weight_kg < 50,
            self.has_recent_major_surgery,
            self.on_blood_thinners,
            self.hiv_positive,
            self.hepatitis_b_or_c,
            self.is_pregnant_or_recent_childbirth,
        ])
        if disqualifying:
            self.status = self.Status.DISQUALIFIED
        elif self.status == self.Status.DISQUALIFIED:
            # only auto-clear a disqualification, never auto-clear a cooldown —
            # cooldown is time-based and handled by the Week 4 scheduled task.
            self.status = self.Status.ELIGIBLE
        return self.status

    def is_matchable(self):
        """Used by the Week 2 matching engine: verified + eligible + available + not suspended."""
        return (
            self.is_cnic_verified
            and self.status == self.Status.ELIGIBLE
            and self.is_available
            and not self.is_suspended
        )

    def save(self, *args, **kwargs):
        self.evaluate_eligibility()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} — {self.blood_group} ({self.status})"
