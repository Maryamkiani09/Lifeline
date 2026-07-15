from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Report, AUTO_SUSPEND_REPORT_THRESHOLD


@receiver(post_save, sender=Report)
def auto_suspend_on_repeated_reports(sender, instance, created, **kwargs):
    if not created:
        return

    reported_user = instance.reported_user
    if not hasattr(reported_user, "donor_profile"):
        return  # only donors are matched/broadcast, so only donors need suspension

    report_count = Report.objects.filter(
        reported_user=reported_user, status=Report.Status.PENDING
    ).count()

    if report_count >= AUTO_SUSPEND_REPORT_THRESHOLD:
        donor = reported_user.donor_profile
        if not donor.is_suspended:
            donor.is_suspended = True
            donor.save()
