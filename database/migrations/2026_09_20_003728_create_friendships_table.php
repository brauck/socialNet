<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('friendships', function (Blueprint $table) {
            // Инициатор заявки (тот, кто нажал "Добавить в друзья")
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Получатель заявки
            $table->foreignId('friend_id')->constrained('users')->onDelete('cascade');
            
            // Статус связи в стиле VK
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            
            $table->timestamp('confirmed_at')->nullable(); // Когда заявка была принята
            $table->timestamps();

            // Составной первичный ключ: исключает дублирование пар в базе
            $table->primary(['user_id', 'friend_id']);

            // Индексы для моментальной выборки списков друзей и подписчиков
            $table->index('user_id');
            $table->index('friend_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};

