<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Передаем только ID удаленного поста, чтобы фронтенд знал, какую карточку стереть
    public int $postId;

    public function __construct(int $postId)
    {
        $this->postId = $postId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('news'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'post.deleted';
    }
}
