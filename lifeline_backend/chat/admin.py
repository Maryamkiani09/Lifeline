from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import ChatRoom, Message

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'user', 'content', 'timestamp')
    list_filter = ('room', 'user', 'timestamp')
    search_fields = ('content',)