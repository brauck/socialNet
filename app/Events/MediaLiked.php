<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MediaLiked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $mediaId;
    public $likesCount;

    // Передаем в сокет ID поста и актуальное количество лайков из базы
    public function __construct($mediaId, $likesCount)
    {
        $this->mediaId = $mediaId;
        $this->likesCount = $likesCount;
    }

    // Открываем публичный канал 'news' в стиле VK
    public function broadcastOn(): array
    {
        return [
            new Channel('news'),
        ];
    }

    // Кастомное имя события, которое будет слушать наш React
    public function broadcastAs(): string
    {
        return 'media.liked';
    }
}
