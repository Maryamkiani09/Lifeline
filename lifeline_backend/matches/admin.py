from django.contrib import admin
from .models import DonationMatch


@admin.register(DonationMatch)
class DonationMatchAdmin(admin.ModelAdmin):
    list_display = ["donor", "patient_request", "status", "distance_km", "created_at"]
    list_filter = ["status"]
    search_fields = ["donor__user__username", "patient_request__patient_name"]
