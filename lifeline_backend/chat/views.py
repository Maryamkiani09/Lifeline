from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import ChatRoom, Message

@login_required
def chat_room(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    messages = room.messages.all().order_by('timestamp')
    return render(request, 'chat/room.html', {'room': room, 'messages': messages})

@login_required
def create_room(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        if name:
            room = ChatRoom.objects.create(name=name, created_by=request.user)
            return redirect('chat_room', room_id=room.id)
    return render(request, 'chat/create_room.html')

@login_required
def send_message(request, room_id):
    if request.method == 'POST':
        content = request.POST.get('content')
        room = get_object_or_404(ChatRoom, id=room_id)
        message = Message.objects.create(
            room=room,
            user=request.user,
            content=content
        )
        return JsonResponse({
            'status': 'success',
            'user': request.user.username,
            'content': content,
            'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    return JsonResponse({'status': 'error'}, status=400)