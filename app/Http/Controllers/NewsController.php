<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\MediaType;
use App\Models\Like;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\MediaLiked;

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
        // 1. Валидация входящих данных
        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'media_type' => ['required', 'string', 'in:none,photo,audio,video,document'],
        ]);

        $userId = Auth::id();
        $mediaTypeInput = $request->input('media_type');
        
        $mediaTypeId = null;
        $metadata = null;
        $filename = 'posts/text_only.dat';
        $size = 0;

        // 2. Если пользователь прикрепляет медиаконтент — формируем для него VK-метаданные
        if ($mediaTypeInput !== 'none') {
            $typeRecord = MediaType::where('name', $mediaTypeInput)->first();
            $mediaTypeId = $typeRecord->id;
            $size = rand(100000, 15000000); // Симулируем размер файла
            $filename = 'uploads/' . $mediaTypeInput . 's/' . fake()->uuid() . '.dat';

            // Генерируем тестовую JSON-структуру под тип медиафайла
            $metadata = match ($mediaTypeInput) {
                'photo' => [
                    'width' => 1920,
                    'height' => 1080,
                    'camera' => fake()->randomElement(['iPhone 15', 'Sony Alpha 7', 'Samsung S24']),
                ],
                'audio' => [
                    'artist' => fake()->name(),
                    'title' => 'Загруженный трек #' . rand(1, 100),
                    'duration_seconds' => rand(120, 300),
                    'bitrate' => 320,
                ],
                'video' => [
                    'duration_seconds' => rand(60, 3600),
                    'resolution' => '1080p',
                    'codec' => 'h264',
                ],
                'document' => [
                    'extension' => fake()->randomElement(['pdf', 'docx', 'zip']),
                    'is_secure' => true,
                ],
                default => null
            };
        } else {
            // Если это чисто текстовый пост — привяжем его к типу 'document' для совместимости с лентой
            $mediaTypeId = MediaType::where('name', 'document')->first()->id;
        }

        // 3. Используем магию Eloquent для создания поста
        Media::create([
            'media_type_id' => $mediaTypeId,
            'user_id' => $userId,
            'body' => $request->body,
            'filename' => $filename,
            'size' => $size,
            'metadata' => $metadata,
        ]);

        // Возвращаем пользователя обратно. Inertia мгновенно обновит пропсы ленты новостей!
        return redirect()->back();
    }
}
