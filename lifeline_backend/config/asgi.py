import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django_asgi_app = get_asgi_application()

# Imports below must come AFTER get_asgi_application() so Django's app
# registry is fully populated before chat.routing imports any models.
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from accounts.channels_auth import JWTAuthMiddleware  # noqa: E402
import chat.routing  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(chat.routing.websocket_urlpatterns)
    ),
})
