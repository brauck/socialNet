<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Справочник типов медиа (фото, видео, аудио, документ)
        Schema::create('media_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'photo', 'video', 'audio', 'document'
            $table->timestamps();
        });

        // 2. Центральная таблица медиафайлов соцсети
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('media_type_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Кто загрузил файл
            
            $table->text('body')->nullable();      // Текстовое описание к медиафайлу (например, подпись к фото)
            $table->string('filename');            // Имя файла на сервере (или путь в хранилище storage)
            $table->integer('size');               // Размер файла в байтах
            
            // Преимущество PostgreSQL: полноценный нативный JSONB для метаданных (размеры, длительность и т.д.)
            $table->jsonb('metadata')->nullable(); 
            
            $table->timestamps();

            // Индексы для быстрой фильтрации файлов конкретного пользователя
            $table->index('user_id');
            $table->index('media_type_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
        Schema::dropIfExists('media_types');
    }
};

