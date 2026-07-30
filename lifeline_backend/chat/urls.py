from django.urls import include, path
from . import views

urlpatterns = [
    path('room/<int:room_id>/', views.chat_room, name='chat_room'),
    path('create/', views.create_room, name='create_room'),
    path('send/<int:room_id>/', views.send_message, name='send_message'),
    path('chat/', include('chat.urls')),
]