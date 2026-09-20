<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Media;
use App\Models\Like;
use Illuminate\Database\Seeder;

class LikeSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $allMedia = Media::all();

        foreach ($users as $user) {
            // Пусть каждый пользователь поставит от 5 до 15 случайных лайков разным медиафайлам
            $randomMediaItems = $allMedia->random(rand(5, 15));

            foreach ($randomMediaItems as $media) {
                // Благодаря блоку try-catch или предварительной проверке мы защищаем сидер
                // от падения, если вдруг случайно выберется дубликат (хотя метод random() выдает уникальные элементы для одного прохода)
                Like::create([
                    'user_id' => $user->id,
                    'media_id' => $media->id,
                ]);
            }
        }
    }
}

