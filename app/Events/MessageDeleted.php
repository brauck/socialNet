<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel; // Используем приватный канал
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $messageId;

    public function __construct($chatId, $messageId)
    {
        $this->chatId = $chatId;
        $this->messageId = $messageId;
    }

    // Вещаем строго в приватный канал конкретного чата
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->chatId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.deleted';
    }
}
