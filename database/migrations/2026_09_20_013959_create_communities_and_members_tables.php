<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Таблица самих сообществ
        Schema::create('communities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // ЧПУ для ссылки (например, ://vk.com)
            $table->enum('type', ['group', 'public', 'event'])->default('public'); // Тип сообщества
            $table->text('description')->nullable();
            $table->string('avatar_url')->nullable();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade'); // Владелец группы
            $table->timestamps();

            // Индекс для быстрого поиска сообществ по названию
            $table->index('name');
        });

        // 2. Таблица участников (Связь Многие-ко-Многим)
        Schema::create('community_members', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('community_id')->constrained()->onDelete('cascade');
            $table->string('role', 20)->default('member'); // Роль: member, moderator, editor, administrator
            $table->timestamp('joined_at')->useCurrent();

            // Закрепляем ПАТТЕРН: Составной первичный ключ вместо id
            $table->primary(['user_id', 'community_id']);

            // Индексы для оптимизации
            $table->index('user_id');
            $table->index('community_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_members');
        Schema::dropIfExists('communities');
    }
};
