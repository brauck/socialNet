<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\Media;
use App\Models\MediaType;
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
                    'filename' => $message->filename,
                    'file_type' => $message->file_type,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->user->first_name . ' ' . $message->user->last_name,
                    
                    // КРИТИЧЕСКИ ВАЖНО: Добавляем точное поле, которое мы прописали в Show.tsx!
                    'sender_avatar' => $message->user->profile?->avatar_url 
                        ? asset('storage/' . $message->user->profile->avatar_url) 
                        : null,
                        
                    'is_me' => $message->sender_id === Auth::id(),
                    'date' => $message->created_at->diffForHumans(),

                    // Добавляем массив attachments для фронтенда Show.tsx
                    'attachments' => $message->media->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'filename' => $item->filename,
                            'type' => $item->type->name, //photo, audio, video, document
                            'metadata' => $item->metadata,
                            'likes_count' => $item->likes()->count(), // Подключаем лайки на будущее!
                            'liked_by_me' => $item->likes()->where('user_id', Auth::id())->exists(),
                        ];
                    })->toArray(),
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
            'current_user_id' => Auth::id()
        ]);
    }

    // Метод для обработки отправки НОВОГО сообщения
    public function store(Request $request, $chatId)
    {
        $request->validate([
            'body' => [$request->hasFile('chat_file') ? 'nullable' : 'required', 'string', 'max:5000'],
            'chat_file' => ['nullable', 'file', 'max:20480'],
        ]);

        $userId = Auth::id();

        // 1. Сначала создаем базовое сообщение в PostgreSQL
        $message = Message::create([
            'chat_id' => $chatId,
            'sender_id' => $userId,
            'body' => $request->body ?? '',
            'is_read' => false,
        ]);

        // 2. Если к сообщению прикреплен реальный файл — создаем для него запись в таблице media
        if ($request->hasFile('chat_file')) {
            $file = $request->file('chat_file');
            $mime = $file->getMimeType();
            $size = $file->getSize();
            $metadata = null;

            if (str_contains($mime, 'image')) {
                $typeName = 'photo';
                $folder = 'photos';
                $imageSize = @getimagesize($file->getRealPath());
                $metadata = ['width' => $imageSize ? $imageSize[0] : 1280, 'height' => $imageSize ? $imageSize[1] : 720];
            } elseif (str_contains($mime, 'audio')) {
                $typeName = 'audio';
                $folder = 'audios';
                $metadata = ['title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME), 'duration_seconds' => rand(150, 240)];
            } elseif (str_contains($mime, 'video')) {
                $typeName = 'video';
                $folder = 'videos';
                $metadata = ['resolution' => '1080p'];
            } else {
                $typeName = 'document';
                $folder = 'documents';
            }

            $typeRecord = MediaType::where('name', $typeName)->first();
            $filename = $file->store("uploads/{$folder}", 'public');

            // Создаем чистую системную запись в таблице media
            $media = Media::create([
                'media_type_id' => $typeRecord->id,
                'user_id' => $userId,
                'body' => null, // у самого медиафайла в чате нет отдельного текста
                'filename' => $filename,
                'size' => $size,
                'metadata' => $metadata,
            ]);

            // Магия Laravel: привязываем созданный медиафайл к нашему сообщению через таблицу attachments
            $message->media()->attach($media->id);
        }

        // 3. Жадная загрузка сообщения вместе с автором и прикрепленными медиафайлами
        $message->load(['user.profile', 'media.type']);

        // 4. Формируем структуру данных для Reverb сокетов
        $formattedMessage = [
            'id' => $message->id,
            'chat_id' => $message->chat_id,
            'body' => $message->body,
            'is_read' => $message->is_read,
            'attachments' => $message->media->map(function ($item) {
                return [
                    'id' => $item->id,
                    'filename' => $item->filename,
                    'type' => $item->type->name, // Настоящий тип из БД (photo, audio, video)
                    'metadata' => $item->metadata,
                    'likes_count' => 0,
                    'liked_by_me' => false,
                ];
            })->toArray(),
            'sender' => [
                'id' => $message->user->id,
                'full_name' => $message->user->first_name . ' ' . $message->user->last_name,
                'avatar_url' => $message->user->profile?->avatar_url ? asset('storage/' . $message->user->profile->avatar_url) : null,
            ],
            'created_at' => $message->created_at->toIso8601String(),
        ];

        broadcast(new MessageSent($formattedMessage))->toOthers();

        return redirect()->back();
    }
}
