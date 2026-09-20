<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Community;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        
        // Список тестовых названий для пабликов нашей соцсети
        $templates = [
            ['name' => 'Клуб разработчиков Laravel', 'type' => 'public', 'desc' => 'Все о лучшем PHP фреймворке.'],
            ['name' => 'Типичный Программист', 'type' => 'public', 'desc' => 'Мемы, юмор и новости из мира IT.'],
            ['name' => 'Изучаем React & TypeScript', 'type' => 'group', 'desc' => 'Группа для совместного обучения фронтенду.'],
            ['name' => 'Хакатон Minsk 2026', 'type' => 'event', 'desc' => 'Главное IT событие этой осени!'],
            ['name' => 'Docker & DevOps паттерны', 'type' => 'public', 'desc' => 'Контейнеризация и деплой без боли.'],
        ];

        foreach ($templates as $template) {
            // Случайный создатель из базы
            $creator = $users->random();

            $community = Community::create([
                'name' => $template['name'],
                'slug' => Str::slug($template['name']),
                'type' => $template['type'],
                'description' => $template['desc'],
                'creator_id' => $creator->id,
            ]);

            // Делаем создателя администратором группы в таблице связей
            $community->members()->attach($creator->id, ['role' => 'administrator']);

            // Наполняем группу случайными участниками (от 10 до 30 человек из наших 51 юзеров)
            $randomMembers = $users->where('id', '<>', $creator->id)->random(rand(10, 30));
            
            foreach ($randomMembers as $member) {
                $community->members()->attach($member->id, [
                    'role' => 'member',
                    'joined_at' => fake()->dateTimeBetween('-1 month', 'now'),
                ]);
            }
        }
    }
}

