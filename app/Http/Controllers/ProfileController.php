<?php

namespace App\Http\Controllers;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Главная страница ("Моя страница")
     */
    public function index()
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = User::with('profile')->findOrFail(Auth::id());

        return $this->renderProfile($currentUser, true);
    }

    /**
     * Просмотр профиля другого пользователя (/users/{user})
     */
    public function show(User $user)
    {
        // Если пользователь перешёл по ссылке на свой собственный ID — отправляем на главную
        if ($user->id === Auth::id()) {
            return redirect()->route('home');
        }

        $user->load('profile');

        return $this->renderProfile($user, false);
    }

    /**
     * Единый приватный метод сборки данных профиля и статуса дружбы
     */
    private function renderProfile(User $targetUser, bool $isMe)
    {
        $myId = Auth::id();
        $relationStatus = 'none';

        if (!$isMe) {
            // Ищем статус отношений между текущим пользователем и владельцем страницы
            $relation = Friendship::where(function ($q) use ($myId, $targetUser) {
                $q->where('user_id', $myId)->where('friend_id', $targetUser->id);
            })->orWhere(function ($q) use ($myId, $targetUser) {
                $q->where('user_id', $targetUser->id)->where('friend_id', $myId);
            })->first();

            if ($relation) {
                if ($relation->status === FriendshipStatus::Accepted) {
                    $relationStatus = 'accepted';
                } elseif ($relation->status === FriendshipStatus::Pending) {
                    $relationStatus = $relation->user_id === $myId ? 'outgoing' : 'incoming';
                } elseif ($relation->status === FriendshipStatus::Declined) {
                    // Используем твою логику защиты от спама
                    $relationStatus = $relation->user_id === $myId ? 'outgoing' : 'incoming';
                }
            }
        }

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $targetUser->id,
                'full_name' => $targetUser->first_name . ' ' . $targetUser->last_name,
                'email' => $isMe ? $targetUser->email : null, // Чужой email скрываем ради приватности
                'hometown' => $targetUser->profile?->hometown ?? 'Не указан',
                'status' => $targetUser->profile?->status_text ?? '',
                'birthday' => $targetUser->profile?->birthday ?? 'Не указана',
                'avatar_url' => $targetUser->profile?->avatar_url ? asset('storage/' . $targetUser->profile->avatar_url) : null,
            ],
            'isMe' => $isMe,
            'relationStatus' => $relationStatus,
            'serverTime' => now()->toTimeString(),
        ]);
    }

    // Показать форму редактирования
    public function edit()
    {
        /** @var \App\Models\User $user */
        $user = User::with('profile')->findOrFail(Auth::id());

        return Inertia::render('Profile/Edit', [
            'profileData' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'hometown' => $user->profile?->hometown ?? '',
                'status_text' => $user->profile?->status_text ?? '',
                'birthday' => $user->profile?->birthday ?? '',
                'avatar_url' => $user->profile?->avatar_url ? asset('storage/' . $user->profile->avatar_url) : null,
            ]
        ]);
    }

    // Обработка сохранения формы (защищено транзакцией)
    public function update(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $request->validate([
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'hometown' => ['nullable', 'string', 'max:100'],
            'status_text' => ['nullable', 'string', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        // Запоминаем старый путь, чтобы удалить файл ТОЛЬКО после успешной транзакции БД
        $oldAvatarPath = $user->profile?->avatar_url;
        $newAvatarPath = null;

        if ($request->hasFile('avatar')) {
            $newAvatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        try {
            DB::transaction(function () use ($request, $user, $newAvatarPath) {
                // 1. Обновляем таблицу users
                $user->update([
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                ]);

                // 2. Готовим данные для user_profiles
                $profileData = [
                    'hometown' => $request->hometown,
                    'status_text' => $request->status_text,
                    'birthday' => $request->birthday,
                ];

                if ($newAvatarPath) {
                    $profileData['avatar_url'] = $newAvatarPath;
                }

                // 3. Обновляем или создаём профиль
                $user->profile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profileData
                );
            });

            // Если транзакция прошла успешно и был загружен новый файл — удаляем старый с диска
            if ($newAvatarPath && $oldAvatarPath) {
                Storage::disk('public')->delete($oldAvatarPath);
            }
        } catch (\Throwable $e) {
            // Если БД упала — подчищаем только что загруженный новый файл, чтобы не было мусора
            if ($newAvatarPath) {
                Storage::disk('public')->delete($newAvatarPath);
            }
            throw $e;
        }

        return redirect()->route('home')->with('success', 'Профиль успешно обновлен!');
    }
}
