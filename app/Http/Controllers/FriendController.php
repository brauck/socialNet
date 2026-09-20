<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Friendship;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FriendController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        // 1. Получаем ID всех подтвержденных друзей (используем наш метод из модели User)
        $friendIds = Auth::user()->friend_ids;

        // Вытаскиваем профили этих друзей
        $friends = User::with('profile')
            ->whereIn('id', $friendIds)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'full_name' => $user->first_name . ' ' . $user->last_name,
                    'hometown' => $user->profile?->hometown,
                    'status' => $user->profile?->status_text,
                ];
            });

        // 2. Получаем входящие заявки в друзья (кто-то подписался на текущего пользователя)
        $requests = Friendship::with('user.profile')
            ->where('friend_id', $userId)
            ->where('status', 'pending')
            ->get()
            ->map(function ($friendship) {
                $sender = $friendship->user;
                return [
                    'id' => $sender->id,
                    'full_name' => $sender->first_name . ' ' . $sender->last_name,
                    'hometown' => $sender->profile?->hometown,
                    'status' => $sender->profile?->status_text,
                ];
            });

        return Inertia::render('Friends/Index', [
            'friends' => $friends,
            'incomingRequests' => $requests
        ]);
    }
}

