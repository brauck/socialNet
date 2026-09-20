<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Friendship;
use Illuminate\Database\Seeder;

class FriendshipSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $statuses = ['pending', 'accepted', 'declined'];

        foreach ($users as $user) {
            // Каждому пользователю создадим от 3 до 7 случайных связей
            $randomFriends = $users->where('id', '<>', $user->id)->random(rand(3, 7));

            foreach ($randomFriends as $friend) {
                // Проверяем, чтобы зеркальная запись (friend -> user) или текущая уже не существовали,
                // так как у нас жесткий составной первичный ключ
                $exists = Friendship::where(function($query) use ($user, $friend) {
                    $query->where('user_id', $user->id)->where('friend_id', $friend->id);
                })->orWhere(function($query) use ($user, $friend) {
                    $query->where('user_id', $friend->id)->where('friend_id', $user->id);
                })->exists();

                if (!$exists) {
                    $status = fake()->randomElement($statuses);
                    
                    Friendship::create([
                        'user_id' => $user->id,
                        'friend_id' => $friend->id,
                        'status' => $status,
                        'confirmed_at' => $status === 'accepted' ? now() : null,
                    ]);
                }
            }
        }
    }
}
