<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $guarded = [];

    // Получить всех участников этого чата
    public function members()
    {
        return $this->belongsToMany(User::class, 'chat_members')->withPivot('joined_at');
    }

    // Получить все сообщения этого чата (сначала новые или старые)
    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    // Быстрый метод: получить последнее сообщение чата (для списка диалогов)
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }
}

