<?php

namespace Database\Seeders;

namespace Database\Seeders;

use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Seeder;

class MessengerSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $sergey = $users->where('username', 'sergey')->first();

        // 1. Создадим 10 обычных диалогов 1-на-1 для Сергея с другими случайными пользователями
        $randomUsers = $users->where('id', '<>', $sergey->id)->random(10);

        foreach ($randomUsers as $otherUser) {
            $chat = Chat::create(['type' => 'dialog']);
            
            // Добавляем двоих участников в чат
            $chat->members()->attach([$sergey->id, $otherUser->id]);

            // Генерируем небольшую переписку (от 5 до 12 сообщений)
            $msgCount = rand(5, 12);
            for ($i = 0; $i < $msgCount; $i++) {
                $sender = fake()->boolean() ? $sergey : $otherUser;
                
                Message::create([
                    'chat_id' => $chat->id,
                    'sender_id' => $sender->id,
                    'body' => fake()->realText(rand(30, 150)),
                    'is_read' => fake()->boolean(70), // 70% сообщений прочитаны
                    'created_at' => fake()->dateTimeBetween('-1 week', 'now'),
                ]);
            }
        }

        // 2. Создадим ОДНУ большую групповую беседу (Чат выпускников университета)
        $groupChat = Chat::create([
            'title' => 'Разработчики socialNet (Групповой чат)',
            'type' => 'group'
        ]);

        // Добавляем Сергея и еще 5 случайных разработчиков
        $team = $users->where('id', '<>', $sergey->id)->random(5)->pluck('id')->toArray();
        array_push($team, $sergey->id);
        
        $groupChat->members()->attach($team);

        // Генерируем бурное обсуждение проекта (20 сообщений)
        for ($i = 0; $i < 20; $i++) {
            $randomSenderId = fake()->randomElement($team);
            
            Message::create([
                'chat_id' => $groupChat->id,
                'sender_id' => $randomSenderId,
                'body' => fake()->realText(rand(20, 100)),
                'is_read' => false,
                'created_at' => fake()->dateTimeBetween('-2 days', 'now'),
            ]);
        }
    }
}

