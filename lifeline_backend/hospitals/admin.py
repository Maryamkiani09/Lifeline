from django.contrib import admin
from .models import Hospital, HospitalStaff


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "license_number", "is_verified", "created_at"]
    list_filter = ["is_verified", "city"]
    search_fields = ["name", "license_number", "official_email"]
    actions = ["verify_hospitals"]

    @admin.action(description="Verify selected hospitals (appear in public directory)")
    def verify_hospitals(self, request, queryset):
        queryset.update(is_verified=True)


@admin.register(HospitalStaff)
class HospitalStaffAdmin(admin.ModelAdmin):
    list_display = ["user", "hospital", "is_admin"]
    list_filter = ["is_admin"]
