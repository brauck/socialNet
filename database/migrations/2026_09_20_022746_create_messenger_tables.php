<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Таблица чатов (комнат)
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable(); // Имя беседы (NULL для обычных диалогов 1-на-1)
            $table->enum('type', ['dialog', 'group'])->default('dialog'); // Тип чата
            $table->string('avatar_url')->nullable();
            $table->timestamps();
        });

        // 2. Таблица участников чата (Связь Многие-ко-Многим между Users и Chats)
        Schema::create('chat_members', function (Blueprint $table) {
            $table->foreignId('chat_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();

            // Составной первичный ключ: пользователь не может быть в одном чате дважды
            $table->primary(['chat_id', 'user_id']);

            // Индексы для моментального поиска диалогов пользователя
            $table->index('chat_id');
            $table->index('user_id');
        });

        // 3. Таблица сообщений
        Schema::create('messages', function (Blueprint $table) {
            $table->id(); // У сообщений обязан быть свой ID, так как к ним будут крепиться лайки/медиа
            $table->foreignId('chat_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade'); // Кто отправил
            $table->text('body'); // Текст сообщения
            $table->boolean('is_read')->default(false); // Статус прочтения
            $table->timestamps();

            // Индексы для мгновенной сортировки истории переписки по времени
            $table->index('chat_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('chat_members');
        Schema::dropIfExists('chats');
    }
};

