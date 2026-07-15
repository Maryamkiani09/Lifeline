import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("lifeline")
app.config_from_object("django.conf:settings", namespace="CELERY")
# force=True: import task modules immediately rather than relying on the
# lazy on_after_finalize signal, which doesn't reliably fire before the
# worker/beat process (or a script) needs the task registry populated.
app.autodiscover_tasks(["matches"], force=True)
