from datetime import date
from celery import shared_task


@shared_task
def send_broadcast_email(donor_id, patient_request_id):
    """FR-4.3 notification half of broadcasting: let the donor know by email
    that a matching request exists (in addition to them seeing it via
    GET /api/matches/my-broadcasts/)."""
    from django.core.mail import send_mail
    from django.conf import settings
    from donors.models import Donor
    from patients.models import PatientRequest

    try:
        donor = Donor.objects.select_related("user").get(id=donor_id)
        pr = PatientRequest.objects.get(id=patient_request_id)
    except (Donor.DoesNotExist, PatientRequest.DoesNotExist):
        return "Donor or request no longer exists."

    urgency_note = " — this is CRITICAL, please respond quickly" if pr.urgency_level == "critical" else ""
    send_mail(
        subject=f"LifeLine: a nearby patient needs {pr.blood_group} blood{urgency_note}",
        message=(
            f"Hi {donor.user.username},\n\n"
            f"A patient near you needs {pr.units_required} unit(s) of {pr.blood_group} blood "
            f"(urgency: {pr.get_urgency_level_display()}).\n"
            f"Log in to LifeLine and check 'My Broadcasts' to respond.\n\n"
            f"— LifeLine"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[donor.user.email],
        fail_silently=True,
    )
    return f"Broadcast email sent to {donor.user.email}"


@shared_task
def send_donor_accepted_email(patient_request_id):
    """FR-5.2: patient is ALWAYS emailed when a donor accepts, regardless
    of urgency level."""
    from django.core.mail import send_mail
    from django.conf import settings
    from patients.models import PatientRequest

    try:
        pr = PatientRequest.objects.get(id=patient_request_id)
    except PatientRequest.DoesNotExist:
        return "Request no longer exists."

    recipient = pr.requester.email if pr.requester else None
    if not recipient:
        # Hospital-added patient with no personal login — notify the hospital instead.
        recipient = pr.added_by_hospital.official_email if pr.added_by_hospital else None
    if not recipient:
        return "No email address available to notify."

    send_mail(
        subject=f"LifeLine: a donor has accepted your request for {pr.patient_name}",
        message=(
            f"Good news — a verified donor has accepted the blood request for "
            f"{pr.patient_name} ({pr.blood_group}, {pr.units_required} unit(s)).\n"
            f"Log in to LifeLine to chat and coordinate.\n\n"
            f"— LifeLine"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=True,
    )
    return f"Accept-notification email sent to {recipient}"


@shared_task
def reactivate_cooled_down_donors():
    """
    UC-9 nightly job: donors whose 90-day cooldown has passed become
    matchable again, without them having to do anything. Scheduled via
    CELERY_BEAT_SCHEDULE in settings.py.
    """
    from donors.models import Donor

    today = date.today()
    updated = Donor.objects.filter(
        status=Donor.Status.COOLING_DOWN, next_eligible_date__lte=today
    ).update(status=Donor.Status.ELIGIBLE, next_eligible_date=None)
    return f"Reactivated {updated} donor(s)."


@shared_task
def reassign_backup_donor(patient_request_id):
    """
    UC-9: when the assigned donor cancels, promote the next-best retained
    backup (a match that was auto-CLOSED when someone else got accepted
    first) instead of leaving the patient to start over.
    """
    from patients.models import PatientRequest
    from .models import DonationMatch

    try:
        patient_request = PatientRequest.objects.get(id=patient_request_id)
    except PatientRequest.DoesNotExist:
        return "Request no longer exists."

    if patient_request.status != PatientRequest.Status.ACTIVE:
        return "Request is not awaiting a donor; nothing to reassign."

    backup = (
        DonationMatch.objects.filter(
            patient_request=patient_request, status=DonationMatch.Status.CLOSED
        )
        .order_by("distance_km", "created_at")
        .first()
    )
    if not backup:
        return "No backup donors available; request stays active for future broadcasts."

    backup.status = DonationMatch.Status.ACCEPTED
    backup.save()

    patient_request.status = PatientRequest.Status.PENDING
    patient_request.save()

    return f"Reassigned request #{patient_request_id} to donor #{backup.donor_id}."
