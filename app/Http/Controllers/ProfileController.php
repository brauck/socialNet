<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    // Показать форму редактирования
    public function edit()
    {
        /** @var \App\Models\User $user */
        $user = User::with('profile')->find(Auth::id());

        return Inertia::render('Profile/Edit', [
            'profileData' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'hometown' => $user->profile?->hometown ?? '',
                'status_text' => $user->profile?->status_text ?? '',
                'birthday' => $user->profile?->birthday ?? '',
                // Формируем полный URL к аватарке, если она загружена
                'avatar_url' => $user->profile?->avatar_url ? asset('storage/' . $user->profile->avatar_url) : null,
            ]
        ]);
    }

    // Обработка сохранения формы
    public function update(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Валидация текстовых полей и картинки (макс. 2Мб)
        $request->validate([
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'hometown' => ['nullable', 'string', 'max:100'],
            'status_text' => ['nullable', 'string', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'avatar' => ['nullable', 'image', 'max:2048'], 
        ]);

        // 1. Обновляем имя и фамилию в основной таблице users
        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
        ]);

        // 2. Готовим массив данных для связанной таблицы профилей
        $profileData = [
            'hometown' => $request->hometown,
            'status_text' => $request->status_text,
            'birthday' => $request->birthday,
        ];

        // 3. Обработка загрузки файла аватарки
        if ($request->hasFile('avatar')) {
            // Если у пользователя уже была аватарка — удаляем старый файл с диска
            if ($user->profile?->avatar_url) {
                Storage::disk('public')->delete($user->profile->avatar_url);
            }

            // Сохраняем новый файл в папку storage/app/public/avatars внутри Docker
            $path = $request->file('avatar')->store('avatars', 'public');
            $profileData['avatar_url'] = $path;
        }

        // 4. Обновляем или создаем запись в user_profiles
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        return redirect('/')->with('success', 'Профиль успешно обновлен!');
    }
}
