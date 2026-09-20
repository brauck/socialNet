<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::inertia('/', 'welcome')->name('home');

// Route::get('/', function () {
//     // Вместо view() мы пишем Inertia::render().
//     // Первый параметр — это имя файла в папке Pages (без расширения).
//     // Второй параметр — массив данных (пропсов), которые улетят в React.
//     return Inertia::render('Welcome', [
//         'appName' => 'socialNet',
//         'serverTime' => now()->toTimeString(),
//     ]);
// });

Route::get('/', function () {
    // Вытаскиваем тебя из базы данных вместе с профилем Минска
    $sergey = User::with('profile')->where('username', 'sergey')->first();

    return Inertia::render('Welcome', [
        'appName' => 'socialNet',
        'user' => [
            'id' => $sergey->id,
            'full_name' => $sergey->first_name . ' ' . $sergey->last_name,
            'email' => $sergey->email,
            'hometown' => $sergey->profile?->hometown ?? 'Не указан',
            'status' => $sergey->profile?->status_text ?? '',
            'birthday' => $sergey->profile?->birthday ?? '',
        ],
        'serverTime' => now()->toTimeString(),
    ]);
});