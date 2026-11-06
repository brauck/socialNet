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

    /**
     * Получить все полиморфные лайки, поставленные этой публикации (Media)
     */
    public function likes()
    {
        // Первым параметром передаем модель Лайка, вторым — префикс полиморфных полей ('likeable')
        return $this->morphMany(Like::class, 'likeable');
    }


    public function messages(): MorphToMany
    {
        return $this->morphedByMany(Message::class, 'attachable', 'attachments');
    }
}

