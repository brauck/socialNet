<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $guarded = [];

    // К какому чату принадлежит сообщение
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    // Кто отправитель сообщения
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}

