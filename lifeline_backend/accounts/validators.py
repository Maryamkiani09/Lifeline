import re
from django.core.exceptions import ValidationError

# Accepts either "12345-1234567-1" (standard printed format) or a plain 13-digit string.
CNIC_DASHED_RE = re.compile(r"^\d{5}-\d{7}-\d{1}$")
CNIC_PLAIN_RE = re.compile(r"^\d{13}$")


def validate_cnic(value):
    """FR-1.2: System shall validate CNIC format (13-digit, standard Pakistani format)."""
    if not (CNIC_DASHED_RE.match(value) or CNIC_PLAIN_RE.match(value)):
        raise ValidationError(
            "CNIC must be 13 digits, either as 12345-1234567-1 or 1234512345671."
        )


def normalize_cnic(value):
    """Store CNIC without dashes so duplicate-detection can't be bypassed by formatting."""
    return value.replace("-", "")
