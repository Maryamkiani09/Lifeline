import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from matches.models import DonationMatch
from .models import ChatMessage


class ChatConsumer(AsyncWebsocketConsumer):
    """
    One room per DonationMatch: ws://.../ws/chat/<match_id>/?token=<jwt access token>
    Only the matched donor, the patient/requester, or that request's hospital
    staff can join — enforced in `_user_is_party_to_match` before accept().
    """

    async def connect(self):
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.room_group_name = f"chat_{self.match_id}"
        user = self.scope.get("user")

        if user is None or not user.is_authenticated:
            await self.close(code=4001)  # 4001: not authenticated
            return

        allowed = await self._user_is_party_to_match(user)
        if not allowed:
            await self.close(code=4003)  # 4003: authenticated but not a party to this match
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        content = (data.get("content") or "").strip()[:2000]
        if not content:
            return

        message = await self._save_message(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "id": message.id,
                "sender": self.scope["user"].username,
                "content": message.content,
                "timestamp": message.timestamp.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "id": event["id"],
            "sender": event["sender"],
            "content": event["content"],
            "timestamp": event["timestamp"],
        }))

    @database_sync_to_async
    def _user_is_party_to_match(self, user):
        try:
            match = DonationMatch.objects.select_related(
                "patient_request", "donor__user"
            ).get(id=self.match_id)
        except DonationMatch.DoesNotExist:
            return False

        if hasattr(user, "donor_profile") and match.donor_id == user.donor_profile.id:
            return True
        pr = match.patient_request
        if pr.requester_id == user.id:
            return True
        if (
            hasattr(user, "hospital_staff_profile")
            and pr.added_by_hospital_id == user.hospital_staff_profile.hospital_id
        ):
            return True
        return False

    @database_sync_to_async
    def _save_message(self, content):
        return ChatMessage.objects.create(
            match_id=self.match_id, sender=self.scope["user"], content=content
        )
