<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Media extends Model
{
    protected $guarded = [];

    // Автоматическое приведение типов в Laravel 11/13
    protected $casts = [
        'metadata' => 'array',
    ];

    // К какому типу относится медиафайл
    public function type()
    {
        return $this->belongsTo(MediaType::class, 'media_type_id');
    }

    // Кто владелец файла
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Получить все лайки, поставленные этому медиафайлу
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

        public function messages(): MorphToMany
    {
        return $this->morphedByMany(Message::class, 'attachable', 'attachments');
    }
}

