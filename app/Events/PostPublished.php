<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание без очередей
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostPublished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Массив с полными данными нового поста, готовый для рендеринга в React
    public $post;

    public function __construct(array $post)
    {
        $this->post = $post;
    }

    // Вещаем в публичный канал 'news'
    public function broadcastOn(): array
    {
        return [
            new Channel('news'),
        ];
    }

    // Имя события, которое будет слушать фронтенд
    public function broadcastAs(): string
    {
        return 'post.published';
    }
}
