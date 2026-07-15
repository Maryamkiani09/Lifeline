from django.conf import settings
from django.db import models


class Hospital(models.Model):
    """FR-3H.x: Hospital Self-Registration. Starts unverified so fake
    hospital listings can't appear in the public directory (FR-3H.3)."""

    name = models.CharField(max_length=200)
    official_address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    license_number = models.CharField(max_length=100, unique=True)
    official_contact = models.CharField(max_length=20)
    official_email = models.EmailField()

    is_verified = models.BooleanField(default=False)  # FR-3H.3 / FR-3P.3

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        verified = "verified" if self.is_verified else "pending"
        return f"{self.name} ({verified})"


class HospitalStaff(models.Model):
    """Links a User (role=hospital_staff) to a Hospital. FR-3H.4: verified
    hospitals can add more staff beyond the first admin registrant."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hospital_staff_profile"
    )
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="staff_members")
    is_admin = models.BooleanField(default=False)  # the original registrant

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        role = "admin" if self.is_admin else "staff"
        return f"{self.user.username} @ {self.hospital.name} ({role})"
