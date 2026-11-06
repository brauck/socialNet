<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
        {
            Schema::create('likes', function (Blueprint $table) {
                $table->id(); 
                $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Кто лайкнул
                
                // Магия Laravel: создает поля likeable_id (bigint) и likeable_type (varchar)
                // Это позволит привязать лайк к чему угодно: Media (к посту), Message (к сообщению) и т.д.
                $table->morphs('likeable'); 
                $table->timestamps();

                // КРИТИЧЕСКИ ВАЖНО: Один пользователь — один лайк на один конкретный объект
                $table->unique(['user_id', 'likeable_id', 'likeable_type']);

                // Индексы для мгновенного подсчета лайков в PostgreSQL
                $table->index(['likeable_id', 'likeable_type']);
                $table->index('user_id');
            });
        }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};

