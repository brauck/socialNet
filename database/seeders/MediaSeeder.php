<?php

namespace Database\Seeders;

namespace Database\Seeders;

use App\Models\User;
use App\Models\MediaType;
use App\Models\Media;
use Illuminate\Database\Seeder;

class MediaSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Создаем базовые типы медиаконтента
        $types = [
            'photo' => MediaType::create(['name' => 'photo']),
            'video' => MediaType::create(['name' => 'video']),
            'audio' => MediaType::create(['name' => 'audio']),
            'document' => MediaType::create(['name' => 'document']),
        ];

        $users = User::all();

        // 2. Генерируем по 2-4 медиафайла для каждого пользователя соцсети
        foreach ($users as $user) {
            $filesCount = rand(2, 4);

            for ($i = 0; $i < $filesCount; $i++) {
                // Случайно выбираем тип контента
                $typeName = fake()->randomElement(['photo', 'video', 'audio', 'document']);
                $type = $types[$typeName];

                // Формируем специфичные метаданные в зависимости от типа (как в реальном VK)
                $metadata = match ($typeName) {
                    'photo' => [
                        'width' => fake()->randomElement([800, 1200, 1920]),
                        'height' => fake()->randomElement([600, 900, 1080]),
                        'camera' => fake()->randomElement(['iPhone 15', 'Sony Alpha 7', 'Samsung S24']),
                    ],
                    'video' => [
                        'duration_seconds' => rand(30, 7200), // от 30 сек до 2 часов
                        'resolution' => fake()->randomElement(['1080p', '4K', '720p']),
                        'codec' => 'h264',
                    ],
                    'audio' => [
                        'artist' => fake()->name(),
                        'title' => fake()->realText(20),
                        'duration_seconds' => rand(120, 300), // длина песни
                        'bitrate' => 320,
                    ],
                    'document' => [
                        'extension' => fake()->randomElement(['pdf', 'docx', 'xlsx', 'zip']),
                        'is_secure' => fake()->boolean(90),
                    ],
                };

                Media::create([
                    'media_type_id' => $type->id,
                    'user_id' => $user->id,
                    'body' => fake()->optional(0.6)->realText(60), // подпись к файлу
                    'filename' => 'uploads/' . $typeName . 's/' . fake()->uuid() . '.' . ($metadata['extension'] ?? 'dat'),
                    'size' => rand(50000, 50000000), // размер от 50Кб до 50Мб
                    'metadata' => $metadata,
                ]);
            }
        }
    }
}

