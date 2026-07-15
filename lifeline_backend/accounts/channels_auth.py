from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError


@database_sync_to_async
def _get_user_from_token(token):
    from .models import User
    try:
        validated = AccessToken(token)
        return User.objects.get(id=validated["user_id"])
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Reads the same access token used for REST calls, but passed as a query
    param: ws://host/ws/chat/<id>/?token=<access_token>
    (WebSocket handshakes can't carry a custom Authorization header from a
    browser, so query-string is the standard workaround.)
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token", [None])[0]
        scope["user"] = await _get_user_from_token(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)
