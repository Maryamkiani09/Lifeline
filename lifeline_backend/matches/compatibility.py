"""
Week 2 matching primitives. Kept as plain functions (not methods on a model)
so they're trivially unit-testable and reusable from Celery tasks in Week 4.
"""
from math import radians, sin, cos, sqrt, atan2

# SRS Section 5: donor->patient compatibility, NOT exact string matching.
# Key = patient's blood group, value = list of blood groups that can donate to them.
COMPATIBILITY = {
    "O-":  ["O-"],
    "O+":  ["O+", "O-"],
    "A-":  ["A-", "O-"],
    "A+":  ["A+", "A-", "O+", "O-"],
    "B-":  ["B-", "O-"],
    "B+":  ["B+", "B-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],  # universal recipient
}


def compatible_donor_groups(patient_blood_group: str) -> list[str]:
    return COMPATIBILITY.get(patient_blood_group, [])


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km. Good enough for city-scale radius checks;
    Week 6+/production can swap this for PostGIS ST_Distance without changing
    the matching engine's public interface (find_matching_donors below)."""
    R = 6371.0
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))
