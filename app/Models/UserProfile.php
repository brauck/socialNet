<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $guarded = []; // Разрешаем заполнять все поля через фабрики

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
