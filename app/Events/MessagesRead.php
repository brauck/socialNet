<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $readerId;

    public function __construct(int $chatId, int $readerId)
    {
        $this->chatId = $chatId;
        $this->readerId = $readerId;
        $this->dontBroadcastToCurrentUser();
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat.{$this->chatId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }
}
