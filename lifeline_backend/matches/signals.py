from django.db.models.signals import post_save
from django.dispatch import receiver
from patients.models import PatientRequest
from .services import broadcast_match_for_request


@receiver(post_save, sender=PatientRequest)
def auto_broadcast_on_request_created(sender, instance, created, **kwargs):
    """
    SRS: 'System immediately triggers UC-6 (Broadcast Match)' — for both the
    individual (UC-1) and hospital (UC-4) creation paths, since both save
    through the same PatientRequest model.
    """
    if created:
        broadcast_match_for_request(instance)
