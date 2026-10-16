<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel; // Закрытый канал
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $messageId;
    public $newBody;

    public function __construct($chatId, $messageId, $newBody)
    {
        $this->chatId = $chatId;
        $this->messageId = $messageId;
        $this->newBody = $newBody;
    }

    // Вещаем строго участникам этой приватной комнаты чата
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->chatId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.updated';
    }
}
