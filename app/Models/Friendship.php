<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Friendship extends Model
{
    protected $guarded = [];

    protected $casts = [
        'status' => \App\Enums\FriendshipStatus::class,
        'confirmed_at' => 'datetime',
    ];

    // Указываем Laravel, что автоинкрементного ID тут нет
    public $incrementing = false;
    protected $keyType = 'string';

    // КРИТИЧЕСКИ ВАЖНО: Связываем модель дружбы с отправителем заявки (User)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
