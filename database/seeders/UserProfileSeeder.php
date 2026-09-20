<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;

class UserProfileSeeder extends Seeder
{
    public function run(): void
    {
        // Получаем всех пользователей из базы данных
        $users = User::all();

        foreach ($users as $user) {
            // Для твоего основного аккаунта делаем кастомный профиль
            if ($user->username === 'sergey') {
                UserProfile::create([
                    'user_id' => $user->id,
                    'gender' => 'male',
                    'birthday' => '1995-05-20',
                    'hometown' => 'Минск',
                    'status_text' => 'Пишу социальную сеть на Laravel и React!',
                    'avatar_url' => null,
                ]);
                continue;
            }

            // Для остальных 50 фейковых юзеров генерируем случайные данные
            $gender = fake()->randomElement(['male', 'female']);
            
            UserProfile::create([
                'user_id' => $user->id,
                'gender' => $gender,
                'birthday' => fake()->date('Y-m-d', '-14 years'), // Пользователи старше 14 лет
                'hometown' => fake()->randomElement(['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань']),
                'status_text' => fake()->optional(0.7)->realText(50), // 70% пользователей со статусом
                'avatar_url' => null,
            ]);
        }
    }
}

