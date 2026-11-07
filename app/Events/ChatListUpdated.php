<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatListUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    private int $memberId;
    public array $messageData;

    /**
     * Создать новый экземпляр события.
     */
    public function __construct(int $memberId, array $messageData)
    {
        $this->memberId = $memberId;
        $this->messageData = $messageData;
    }

    /**
     * В какие каналы должно транслироваться событие.
     */
    public function broadcastOn(): array
    {
        // Вещаем строго в персональный канал конкретного пользователя
        return [
            new PrivateChannel("user.{$this->memberId}"),
        ];
    }

    /**
     * Имя события на фронтенде (алиас).
     */
    public function broadcastAs(): string
    {
        return 'chat.list.updated';
    }
}
