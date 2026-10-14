<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            // Внешний ключ на нашу единую таблицу медиафайлов
            $table->foreignId('media_id')->constrained()->onDelete('cascade');
            
            // Создает поля attachable_id (ID сообщения) и attachable_type (класс App\Models\Message)
            // Это позволит крепить файлы к сообщениям, комментариям и чему угодно без дублирования!
            $table->morphs('attachable'); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
