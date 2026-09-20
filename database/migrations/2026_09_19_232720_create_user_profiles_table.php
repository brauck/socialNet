<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            // Связь 1-к-1 с таблицей users. При удалении юзера — профиль удалится автоматически
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->string('gender', 10)->nullable(); // Пол ('male', 'female')
            $table->date('birthday')->nullable();      // Дата рождения
            $table->string('hometown')->nullable();    // Родной город
            $table->string('status_text')->nullable(); // Текстовый статус профиля (как в VK)
            $table->string('avatar_url')->nullable();  // Ссылка на аватарку
            $table->timestamps();

            // Индекс для быстрого поиска людей по родному городу
            $table->index('hometown');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};

