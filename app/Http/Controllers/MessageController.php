<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Получаем все чаты, в которых состоит текущий пользователь,
        // сортируя их по времени последнего сообщения (как в VK)
        $chats = $user->chats()
            ->with([
                'members.profile', // Цепочка: Участники чата -> Их профили (аватарки)
                'lastMessage.sender' // Цепочка: Последнее сообщение -> Кто его отправил
            ])
            ->get()
            ->map(function ($chat) use ($user) {
                // Если это диалог 1-на-1, нам нужно найти НАШЕГО СОБЕСЕДНИКА (другого участника)
                $interlocutor = null;
                if ($chat->type === 'dialog') {
                    $interlocutor = $chat->members->first(fn($member) => $member->id !== $user->id);
                }

                return [
                    'id' => $chat->id,
                    'type' => $chat->type,
                    // Если групповой чат — берем его название, если диалог — имя собеседника
                    'title' => $chat->type === 'group' 
                        ? $chat->title 
                        : ($interlocutor ? $interlocutor->first_name . ' ' . $interlocutor->last_name : 'Удаленный аккаунт'),
                    'last_message' => $chat->lastMessage ? [
                        'id' => $chat->lastMessage->id,
                        'body' => $chat->lastMessage->body,
                        'is_read' => $chat->lastMessage->is_read,
                        'sender_name' => $chat->lastMessage->sender->first_name,
                        'is_me' => $chat->lastMessage->sender_id === $user->id,
                        'date' => $chat->lastMessage->created_at->diffForHumans(), // Красивая дата "3 минуты назад"
                    ] : null,
                ];
            });

        return Inertia::render('Messages/Index', [
            'chats' => $chats
        ]);        
    }
    public function show(Chat $chat)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Безопасность: проверяем, состоит ли текущий юзер в этом чате
        if (!$chat->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'У вас нет доступа к этому чату.');
        }

        // 1. Помечаем все входящие сообщения в этом чате как прочитанные
        Message::where('chat_id', $chat->id)
            ->where('sender_id', '<>', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        // 2. Получаем историю сообщений (вложенная загрузка: сообщение -> автор -> профиль)
        $messages = $chat->messages()
            ->with('sender.profile')
            ->get()
            ->map(function ($msg) use ($user) {
                return [
                    'id' => $msg->id,
                    'body' => $msg->body,
                    'sender_id' => $msg->sender_id,
                    'sender_name' => $msg->sender->first_name . ' ' . $msg->sender->last_name,
                    'is_me' => $msg->sender_id === $user->id,
                    'date' => $msg->created_at->format('H:i'), // Формат времени "14:32"
                ];
            });

        // 3. Формируем заголовок чата (имя собеседника или название группы)
        $chatTitle = $chat->title;
        if ($chat->type === 'dialog') {
            $interlocutor = $chat->members->first(fn($m) => $m->id !== $user->id);
            $chatTitle = $interlocutor ? $interlocutor->first_name . ' ' . $interlocutor->last_name : 'Удаленный аккаунт';
        }

        return Inertia::render('Messages/Show', [
            'chat' => [
                'id' => $chat->id,
                'title' => $chatTitle,
                'type' => $chat->type,
            ],
            'messages' => $messages,
        ]);
    }

    // Метод для обработки отправки НОВОГО сообщения
    public function store(Request $request, Chat $chat)
    {
        $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        // Безопасность
        if (!$chat->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        Message::create([
            'chat_id' => $chat->id,
            'sender_id' => Auth::id(),
            'body' => $request->body,
            'is_read' => false,
        ]);

        // Перенаправляем пользователя обратно на эту же страницу чата. 
        // Inertia сама обновит массив сообщений на фронтенде без перезагрузки экрана!
        return redirect()->back();
    }
}
