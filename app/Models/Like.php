<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    protected $guarded = [];

    // Кто поставил лайк
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Какой медиафайл был лайкнут
    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}

