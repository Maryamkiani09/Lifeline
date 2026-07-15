from django.contrib import admin
from .models import Donor


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ["user", "blood_group", "city", "status", "is_available", "is_cnic_verified"]
    list_filter = ["blood_group", "status", "is_available", "is_cnic_verified"]
    search_fields = ["user__username", "user__email", "city"]
    # Week 1: admin manually flips is_cnic_verified after reviewing cnic_image.
    # A dedicated hospital/admin verification workflow is a later-week upgrade.
    actions = ["mark_cnic_verified"]

    @admin.action(description="Mark selected donors as CNIC-verified")
    def mark_cnic_verified(self, request, queryset):
        queryset.update(is_cnic_verified=True)
