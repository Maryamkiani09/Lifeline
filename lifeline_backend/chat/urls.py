from django.urls import path
from .views import ChatHistoryView

urlpatterns = [
    path("<int:match_id>/history/", ChatHistoryView.as_view(), name="chat_history"),
]
