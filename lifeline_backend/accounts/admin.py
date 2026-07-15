from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class LifeLineUserAdmin(UserAdmin):
    list_display = ["username", "email", "role", "phone_number", "is_staff"]
    list_filter = ["role", "preferred_language"]
    fieldsets = UserAdmin.fieldsets + (
        ("LifeLine profile", {"fields": ("role", "cnic", "phone_number", "preferred_language")}),
    )
