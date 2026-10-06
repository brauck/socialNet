<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Events\MessageSent;

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
                    'interlocutor_avatar' => $interlocutor?->profile?->avatar_url 
                        ? asset('storage/' . $interlocutor->profile->avatar_url) 
                        : null,
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
            ->with(['user.profile']) // Жорстко подгружаем связи
            ->oldest() // Сортируем от старых к новым
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'body' => $message->body,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->user->first_name . ' ' . $message->user->last_name,
                    
                    // КРИТИЧЕСКИ ВАЖНО: Добавляем точное поле, которое мы прописали в Show.tsx!
                    'sender_avatar' => $message->user->profile?->avatar_url 
                        ? asset('storage/' . $message->user->profile->avatar_url) 
                        : null,
                        
                    'is_me' => $message->sender_id === Auth::id(),
                    'date' => $message->created_at->diffForHumans(),
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
    public function store(Request $request, $chatId)
    {
        // Валидируем ТОЛЬКО текст сообщения, так как сам чат уже проверен роутером
        $request->validate([
            // 'chat_id' => ['required', 'exists:chats,id'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $userId = Auth::id();

        // 1. Сохраняем сообщение в PostgreSQL
        $message = Message::create([
            // 'chat_id' => $request->chat_id,
            'chat_id' => $chatId,
            'sender_id' => $userId,
            'body' => $request->body,
            'is_read' => false,
        ]);

        // 2. Жадная загрузка связей для получения данных отправителя (имени и аватара)
        $message->load(['user.profile']);

        // 3. Формируем чистую структуру данных для фронтенда
        $formattedMessage = [
            'id' => $message->id,
            'chat_id' => $message->chat_id,
            'body' => $message->body,
            'is_read' => $message->is_read,
            'sender' => [
                'id' => $message->user->id,
                'full_name' => $message->user->first_name . ' ' . $message->user->last_name,
                'avatar_url' => $message->user->profile?->avatar_url ? asset('storage/' . $message->user->profile->avatar_url) : null,
            ],
            'created_at' => $message->created_at->toIso8601String(), // ISO-формат даты для JS
        ];

        // 4. Стреляем событием в Reverb. Сигнал улетит по закрытому PrivateChannel
        // Метод ->toOthers() не будет спамить в нашу собственную вкладку
        broadcast(new MessageSent($formattedMessage))->toOthers();

        return redirect()->back(); // Обновляем Inertia-стейт
    }
}
