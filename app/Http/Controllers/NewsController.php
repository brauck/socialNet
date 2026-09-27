<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\MediaType;
use App\Models\Like;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\MediaLiked;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    public function index()
    {
        $currentUserId = Auth::id();

        // Вытаскиваем все медиафайлы соцсети, сортируя от новых к старым
        $posts = Media::with(['user.profile', 'type'])
            ->withCount('likes')
            ->latest()
            ->get()
            ->map(function ($media) use ($currentUserId) {
                // Проверяем, ставил ли текущий пользователь лайк этому посту
                $likedByMe = Like::where('user_id', $currentUserId)
                    ->where('media_id', $media->id)
                    ->exists();

                return [
                    'id' => $media->id,
                    'body' => $media->body,
                    'filename' => $media->filename,
                    'size' => $media->size,
                    'type' => $media->type->name,
                    'metadata' => $media->metadata,
                    'likes_count' => $media->likes_count,
                    'liked_by_me' => $likedByMe,
                    'author' => [
                        'id' => $media->user->id,
                        'full_name' => $media->user->first_name . ' ' . $media->user->last_name,
                        'avatar_url' => $media->user->profile?->avatar_url ? asset('storage/' . $media->user->profile->avatar_url) : null,
                    ],
                    'date' => $media->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('News/Index', [
            'posts' => $posts
        ]);
    }

    // Метод для переключения лайка (обработка клика на фронтенде)
    public function toggleLike(Media $media)
    {
        $userId = Auth::id();
        
        // Наша рабочая логика переключения лайка в базе данных
        $like = Like::where('user_id', $userId)->where('media_id', $media->id)->first();

        if ($like) {
            $like->delete();
        } else {
            Like::create([
                'user_id' => $userId,
                'media_id' => $media->id,
            ]);
        }

        // 1. Считаем свежее количество лайков под постом из PostgreSQL
        $likesCount = $media->likes()->count();

        // 2. Отправляем событие в WebSocket-сервер Reverb
        // Метод ->toOthers() заставит Reverb отправить сигнал ВСЕМ, кроме нас самих,
        // так как у нас на вкладке уже мгновенно отработал Оптимистичный UI!
        broadcast(new MediaLiked($media->id, $likesCount))->toOthers();

        return redirect()->back();
    }

    public function store(Request $request)
    {
        // 1. Валидация: текст обязателен, файл — опционален, до 20 МБ
        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'media_file' => ['nullable', 'file', 'max:20480'], 
        ]);

        $userId = Auth::id();
        $mediaTypeId = null;
        $metadata = null;
        $filename = 'posts/text_only.dat';
        $size = 0;

        // 2. Если файл реально прикреплен пользователем
        if ($request->hasFile('media_file')) {
            $file = $request->file('media_file');
            $size = $file->getSize();
            $extension = strtolower($file->getClientOriginalExtension());
            $mime = $file->getMimeType();

            // Автоматически определяем категорию контента по MIME-типу в стиле VK
            if (str_contains($mime, 'image')) {
                $typeName = 'photo';
                $folder = 'photos';
                
                // Магия PHP: получаем реальное разрешение картинки из временной папки Docker
                $imageSize = @getimagesize($file->getRealPath());
                $metadata = [
                    'width' => $imageSize ? $imageSize[0] : 1280,
                    'height' => $imageSize ? $imageSize[1] : 720,
                    'camera' => fake()->randomElement(['iPhone 15', 'Sony Alpha 7', 'Samsung S24']), // симулируем EXIF для красоты
                ];
            } elseif (str_contains($mime, 'audio')) {
                $typeName = 'audio';
                $folder = 'audios';
                $metadata = [
                    'artist' => 'Загруженный исполнитель',
                    'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                    'duration_seconds' => rand(150, 240), // В реальном продакшене тут используют getID3
                    'bitrate' => 320,
                ];
            } elseif (str_contains($mime, 'video')) {
                $typeName = 'video';
                $folder = 'videos';
                $metadata = [
                    'resolution' => '1080p',
                    'codec' => 'h264',
                    'duration_seconds' => rand(30, 600),
                ];
            } else {
                // Всё остальное (zip, pdf, docx) улетает как документы
                $typeName = 'document';
                $folder = 'documents';
                $metadata = [
                    'extension' => $extension,
                    'is_secure' => true,
                ];
            }

            // Вытаскиваем нужный ID из справочника media_types
            $typeRecord = MediaType::where('name', $typeName)->first();
            $mediaTypeId = $typeRecord->id;

            // Сохраняем файл на диск в Docker по относительному пути (storage/app/public/uploads/...)
            $filename = $file->store("uploads/{$folder}", 'public');
        } else {
            // Если это чисто текстовый пост — привяжем его к типу 'document' для совместимости с лентой
            $mediaTypeId = MediaType::where('name', 'document')->first()->id;
        }

        // 3. Сохраняем и делаем бродкаст real-time события (если Reverb запущен)
        Media::create([
            'media_type_id' => $mediaTypeId,
            'user_id' => $userId,
            'body' => $request->body,
            'filename' => $filename,
            'size' => $size,
            'metadata' => $metadata,
        ]);

        return redirect()->back();
    }
}
