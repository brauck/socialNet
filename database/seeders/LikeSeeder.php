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
                // Магия Eloquent: вызываем метод likes() у модели поста (Media) 
                // и передаем только ID пользователя. Laravel сам подставит 
                // в базу 'likeable_id' => $media->id и 'likeable_type' => App\Models\Media
                $media->likes()->create([
                    'user_id' => $user->id,
                ]);
            }
        }
    }
}

