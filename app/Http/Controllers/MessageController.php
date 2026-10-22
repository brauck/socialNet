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
use App\Events\MessageDeleted;
use App\Events\MessageUpdated;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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
    public function store(Request $request, Chat $chat)
    {
        $request->validate([
            'body' => [$request->hasFile('chat_file') ? 'nullable' : 'required', 'string', 'max:5000'],
            'chat_file' => ['nullable', 'file', 'max:20480'],
        ]);

        $userId = Auth::id();
        $chatId = $chat->id;
        
        // Переменная для хранения отформатированного сообщения под сокеты
        $formattedMessage = null;

        // Оборачиваем всю работу с БД в транзакцию
        // Передаем по ссылке &$formattedMessage, чтобы вытащить результат работы замыкания наружу
        DB::transaction(function () use ($request, $chatId, $userId, &$formattedMessage) {
            
            // 1. Создаем базовое сообщение
            $message = Message::create([
                'chat_id' => $chatId,
                'sender_id' => $userId,
                'body' => $request->body ?? '',
                'is_read' => false,
            ]);

            // 2. Если есть файл — обрабатываем
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
                
                // Физическое сохранение файла на диск. 
                // Если транзакция упадет ДАЛЬШЕ (например на attach), этот файл останется на диске.
                // Но в БД записей не будет, что гарантирует целостность данных.
                $filename = $file->store("uploads/{$folder}", 'public');

                $media = Media::create([
                    'media_type_id' => $typeRecord->id,
                    'user_id' => $userId,
                    'body' => null,
                    'filename' => $filename,
                    'size' => $size,
                    'metadata' => $metadata,
                ]);

                // Привязываем через полиморфную связь Many-to-Many
                $message->media()->attach($media->id);
            }

            // 3. Жадная загрузка связей внутри транзакции
            $message->load(['user.profile', 'media.type']);

            // 4. Формируем структуру данных прямо здесь и пишем во внешнюю переменную
            $formattedMessage = [
                'id' => $message->id,
                'chat_id' => $message->chat_id,
                'body' => $message->body,
                'is_read' => $message->is_read,
                'attachments' => $message->media->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'filename' => $item->filename,
                        'type' => $item->type->name,
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
        }); // Здесь автоматически происходит COMMIT в PostgreSQL!

        // 5. ВЕЩАНИЕ СОБЫТИЯ (Строго ПОСЛЕ коммита транзакции!)
        // Если бы мы вещали изнутри транзакции, сокет Reverb мог бы доставить сообщение на фронтенд
        // до того, как PostgreSQL успеет зафиксировать коммит. Юзер бы поймал ошибку 404 при попытке его прочесть.
        if ($formattedMessage) {
            broadcast(new MessageSent($formattedMessage))->toOthers();
        }

        return redirect()->back();
    }


    public function destroy(Message $message)
    {
        if ($message->sender_id !== Auth::id()) {
            abort(403, 'У вас нет прав на удаление этого сообщения.');
        }

        $chatId = $message->chat_id;
        $messageId = $message->id;

        // Массив, куда мы сохраним пути к файлам, которые НУЖНО будет стереть с диска ПОСЛЕ коммита
        $filesToDelete = [];

        // ЗАПУСКАЕМ ЖЕЛЕЗОБЕТОННУЮ ТРАНЗАКЦИЮ БАЗЫ ДАННЫХ
        DB::transaction(function () use ($message, &$filesToDelete) {
            
            // 1. Находим файлы до удаления связей
            $attachedMedia = $message->media()->get();

            Log::info("=== НАЧАЛО УДАЛЕНИЯ СООБЩЕНИЯ №{$message->id} ===");
            Log::info("Найдено прикрепленных файлов: " . $attachedMedia->count());

            // 2. Разрываем полиморфные связи в attachments
            $message->media()->detach();

            // 3. Удаляем само сообщение
            $message->delete();

            // 4. Проверяем каждый файл на сиротство внутри транзакции
            foreach ($attachedMedia as $mediaItem) {
                $isStillUsed = DB::table('attachments')
                    ->where('media_id', $mediaItem->id)
                    ->exists();

                if (!$isStillUsed) {
                    // Запоминаем путь к файлу для физического удаления ПОСЛЕ коммита
                    $filesToDelete[] = $mediaItem->filename;

                    // Удаляем строчку из media (каскад СУБД сотрет лайки!)
                    $mediaItem->delete();
                }
            }
        }); // Здесь Laravel автоматически сделает COMMIT, если всё прошло гладко!

        // 5. ОЧИСТКА ДИСКА: Выполняется строго ПОСЛЕ успешного коммита в PostgreSQL!
        foreach ($filesToDelete as $filename) {
            if (Storage::disk('public')->exists($filename)) {
                Storage::disk('public')->delete($filename);
            }
        }

        // 6. Вещаем событие удаления в сокеты Reverb
        broadcast(new MessageDeleted($chatId, $messageId))->toOthers();

        return redirect()->back();
    }

    public function update(Request $request, Message $message)
    {
        Log::info("=== START UPDATE ===");
        // Безопасность: изменять текст сообщения может только его отправитель
        if ($message->sender_id !== Auth::id()) {
            abort(403, 'У вас нет прав на редактирование этого сообщения.');
        }

        // Валидация измененного текста
        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        // Обновляем текст в PostgreSQL
        $message->update([
            'body' => $request->body,
        ]);

        Log::info("Текст сообщения №{$message->id} успешно изменен в БД.");

        // Отправляем сигнал изменения остальным участникам чата в реальном времени
        broadcast(new MessageUpdated($message->chat_id, $message->id, $message->body))->toOthers();

        return redirect()->back();
    }

}
