<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Community extends Model
{
    protected $guarded = [];

    // Получить всех участников (пользователей) этого сообщества
    public function members()
    {
        return $this->belongsToMany(User::class, 'community_members')
                    ->withPivot('role', 'joined_at');
    }

    // Получить создателя группы
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}

