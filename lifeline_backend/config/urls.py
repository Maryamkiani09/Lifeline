from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/donors/", include("donors.urls")),
    path("api/hospitals/", include("hospitals.urls")),
    path("api/patients/", include("patients.urls")),
    path("api/matches/", include("matches.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/safety/", include("safety.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
