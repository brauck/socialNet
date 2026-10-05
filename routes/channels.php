<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use App\Models\Chat;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Защищаем канал чата. Фигурные скобки {chatId} означают динамический параметр
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    // Правило безопасности: проверяем в PostgreSQL, существует ли запись в chat_members,
    // связывающая текущего залогиненного юзера ($user->id) с этим конкретным чатом ($chatId)
    return DB::table('chat_members')
        ->where('chat_id', $chatId)
        ->where('user_id', $user->id)
        ->exists();
});
