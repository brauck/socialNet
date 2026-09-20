<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Friendship extends Model
{
    protected $guarded = [];

    // Указываем Laravel, что автоинкрементного ID тут нет
    public $incrementing = false;
    protected $keyType = 'string';
}
