from django.apps import AppConfig


class SafetyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "safety"

    def ready(self):
        from . import signals  # noqa: F401
