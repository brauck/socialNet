<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Создаем 50 случайных пользователей соцсети
        User::factory()->count(50)->create();

        // Создаем одного конкретного тестового юзера для тебя, чтобы ты мог легко заходить под ним
        User::factory()->create([
            'first_name' => 'Сергей',
            'last_name' => 'Разработчик',
            'username' => 'sergey',
            'email' => 'sergey@example.com',
            'phone' => '+375291112233',
        ]);
    }
}
