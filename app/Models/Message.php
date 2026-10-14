<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

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

    /**
     * Отношение к автору сообщения (Отправителю)
     */
    public function user(): BelongsTo
    {
        // Явно говорим Laravel: связь идет с моделью User, но через поле sender_id!
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function media(): MorphToMany
    {
        return $this->morphToMany(Media::class, 'attachable', 'attachments');
    }
}

