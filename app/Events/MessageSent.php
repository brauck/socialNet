<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel; // ИСПОЛЬЗУЕМ ПРИВАТНЫЙ КАНАЛ
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Мгновенное вещание без очередей
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Массив или объект с данными сообщения, который улетит в React
    public $messageData;

    public function __construct(array $messageData)
    {
        $this->messageData = $messageData;
    }

    // Открываем защищенный приватный канал для конкретного чата
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->messageData['chat_id']),
        ];
    }

    // Имя события, которое будет перехватывать наш React-компонент
    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
