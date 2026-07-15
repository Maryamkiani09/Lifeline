from donors.models import Donor
from .compatibility import compatible_donor_groups, haversine_km
from .models import DonationMatch

# FR-4.4/UC-9: keep this many next-best donors as retained backups per request.
MAX_BROADCAST_CANDIDATES = 5


def find_matching_donors(patient_request):
    """
    Returns a list of (distance_km_or_None, Donor) tuples, nearest first,
    filtered to: compatible blood group, verified, eligible, available, and
    within the donor's own travel radius (FR-2.5).

    If the request has no lat/lon (Week 1 data, or a hospital that hasn't
    filled it in), radius filtering is skipped entirely rather than
    silently returning zero matches — better to over-notify than to leave
    a critical request unmatched due to missing geodata.
    """
    compatible_groups = compatible_donor_groups(patient_request.blood_group)
    candidates = Donor.objects.filter(
        blood_group__in=compatible_groups,
        is_available=True,
        is_cnic_verified=True,
        status=Donor.Status.ELIGIBLE,
        is_suspended=False,
    ).select_related("user")

    # FR-8.3: a donor blocked by (or who blocked) this request's owner must
    # never be matched to them again.
    from safety.models import Block
    owner_id = patient_request.requester_id or (
        patient_request.added_by_hospital.staff_members.filter(is_admin=True).values_list("user_id", flat=True).first()
        if patient_request.added_by_hospital_id else None
    )
    if owner_id:
        blocked_user_ids = set(
            Block.objects.filter(blocker_id=owner_id).values_list("blocked_id", flat=True)
        ) | set(
            Block.objects.filter(blocked_id=owner_id).values_list("blocker_id", flat=True)
        )
        if blocked_user_ids:
            candidates = candidates.exclude(user_id__in=blocked_user_ids)

    if patient_request.latitude is None or patient_request.longitude is None:
        return [(None, d) for d in candidates[:MAX_BROADCAST_CANDIDATES]]

    ranked = []
    for donor in candidates:
        if donor.latitude is None or donor.longitude is None:
            continue
        distance = haversine_km(
            patient_request.latitude, patient_request.longitude,
            donor.latitude, donor.longitude,
        )
        if distance <= donor.travel_radius_km:
            ranked.append((distance, donor))
    ranked.sort(key=lambda pair: pair[0])
    return ranked[:MAX_BROADCAST_CANDIDATES]


def _safe_delay(task, *args):
    """Try the real async path first; if no worker/broker is reachable
    (e.g. local dev without Redis running), degrade to running it inline
    rather than failing the request. Same pattern as cancel_match below."""
    try:
        task.delay(*args)
    except Exception:
        task(*args)


def broadcast_match_for_request(patient_request):
    """
    FR-4.1/4.3: simultaneously "broadcast" to every matching donor by
    creating a BROADCAST DonationMatch row for each, plus an email (Week 5)
    for each one notified.
    """
    if patient_request.status != patient_request.Status.ACTIVE:
        return []

    ranked = find_matching_donors(patient_request)
    created = []
    for distance, donor in ranked:
        match, was_created = DonationMatch.objects.get_or_create(
            patient_request=patient_request,
            donor=donor,
            defaults={"status": DonationMatch.Status.BROADCAST, "distance_km": distance},
        )
        created.append(match)
        if was_created:
            from .tasks import send_broadcast_email
            _safe_delay(send_broadcast_email, donor.id, patient_request.id)
    return created


def confirm_donation(match, role):
    """
    FR-6.1 (UC-8): donor self-report alone is never sufficient. `role` is
    one of "donor" / "patient" / "hospital" — set by the view based on who's
    calling. Once 2 of the 3 flags are true, the match auto-completes.
    """
    if role == "donor":
        match.donor_confirmed = True
    elif role == "patient":
        match.patient_confirmed = True
    elif role == "hospital":
        match.hospital_confirmed = True
    match.save()

    if match.confirmation_count() >= 2 and match.status != DonationMatch.Status.COMPLETED:
        _complete_match(match)
    return match


def _complete_match(match):
    """FR-6.3 (donor cooldown) + FR-6.6/6.7 (units decrement / auto-fulfill)."""
    from datetime import timedelta
    from django.utils import timezone
    from donors.models import Donor

    match.status = DonationMatch.Status.COMPLETED
    match.completed_at = timezone.now()
    match.save()

    donor = match.donor
    donor.status = Donor.Status.COOLING_DOWN
    donor.next_eligible_date = timezone.now().date() + timedelta(days=90)
    donor.donation_count += 1
    donor.save()

    patient_request = match.patient_request
    patient_request.apply_donation(match.units_donated)
    patient_request.refresh_from_db()

    # Still needs more units after this donation — broadcast again immediately
    # rather than waiting for the next scheduled matching pass.
    if patient_request.status == patient_request.Status.ACTIVE:
        broadcast_match_for_request(patient_request)


def cancel_match(match):
    """UC-9: an accepted donor backs out. Reopens the request and hands off
    to the Celery task that promotes the next-best retained backup donor."""
    match.status = DonationMatch.Status.CANCELLED
    match.save()

    patient_request = match.patient_request
    if patient_request.status == patient_request.Status.PENDING:
        patient_request.status = patient_request.Status.ACTIVE
        patient_request.save()

    from .tasks import reassign_backup_donor
    _safe_delay(reassign_backup_donor, patient_request.id)
