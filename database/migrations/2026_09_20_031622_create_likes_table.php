<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('likes', function (Blueprint $table) {
            $table->id(); // Суррогатный первичный ключ по нашему паттерну
            $table->foreignId('user_id')->constrained()->onDelete('cascade');   // Кто лайкнул
            $table->foreignId('media_id')->constrained()->onDelete('cascade'); // Что лайкнул
            $table->timestamps();

            // КРИТИЧЕСКИ ВАЖНО: Один пользователь — один лайк на один медиафайл
            $table->unique(['user_id', 'media_id']);

            // Индексы для мгновенного подсчета количества лайков под фото/видео
            $table->index('media_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};

