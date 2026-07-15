from django.contrib import admin
from .models import Report, Block


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["reported_by", "reported_user", "reason", "status", "created_at"]
    list_filter = ["reason", "status"]
    actions = ["mark_reviewed", "mark_actioned"]

    @admin.action(description="Mark selected reports as reviewed (no action)")
    def mark_reviewed(self, request, queryset):
        queryset.update(status="reviewed")

    @admin.action(description="Mark selected reports as actioned")
    def mark_actioned(self, request, queryset):
        queryset.update(status="actioned")


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ["blocker", "blocked", "created_at"]
