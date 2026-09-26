<?php

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\ProfileController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Гостевые маршруты (доступны только если пользователь НЕ залогинен)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister']);
    Route::post('/register', [AuthController::class, 'register']);
});

// 2. Защищенные маршруты социальной сети (доступны только авторизованным юзерам)
Route::middleware('auth')->group(function () {
    
    // Главная страница ("Моя страница" в стиле VK)
    Route::get('/', function () {
        // Вытаскиваем данные ТЕКУЩЕГО залогиненного пользователя
        $currentUser = User::with('profile')->find(Auth::id());

        return Inertia::render('Welcome', [
            'appName' => 'socialNet',
            'user' => [
                'id' => $currentUser->id,
                'full_name' => $currentUser->first_name . ' ' . $currentUser->last_name,
                'email' => $currentUser->email,
                'hometown' => $currentUser->profile?->hometown ?? 'Не указан',
                'status' => $currentUser->profile?->status_text ?? '',
                'birthday' => $currentUser->profile?->birthday ?? 'Не указана',
                'avatar_url' => $currentUser->profile?->avatar_url ? asset('storage/' . $currentUser->profile->avatar_url) : null,
            ],
            'serverTime' => now()->toTimeString(),
        ]);
    });

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/communities', [CommunityController::class, 'index']);
    Route::get('/friends', [FriendController::class, 'index']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{chat}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{chat}', [MessageController::class, 'store']);
    Route::get('/news', [NewsController::class, 'index']);
    Route::post('/news/{media}/like', [NewsController::class, 'toggleLike']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::get('/profile/edit', [ProfileController::class, 'edit']);
    Route::post('/profile/edit', [ProfileController::class, 'update']);
});
