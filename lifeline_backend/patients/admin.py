from django.contrib import admin
from .models import PatientRequest


@admin.register(PatientRequest)
class PatientRequestAdmin(admin.ModelAdmin):
    list_display = [
        "patient_name", "blood_group", "urgency_level", "status",
        "source_path", "units_required", "units_remaining", "created_at",
    ]
    list_filter = ["status", "urgency_level", "blood_group", "source_path"]
    search_fields = ["patient_name", "patient_contact"]
