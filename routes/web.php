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
    
    // Главная страница ("Моя страница")
    Route::get('/', [ProfileController::class, 'index'])->name('home');
    
    // Просмотр профиля любого пользователя
    Route::get('/users/{user}', [ProfileController::class, 'show'])->name('users.show');

    Route::post('/logout', [AuthController::class, 'logout']);
    //Route::get('/communities', [CommunityController::class, 'index']);    

    // messages
    Route::get('/messages', [MessageController::class, 'index']);    
    Route::get('/messages/{chat}', [MessageController::class, 'show'])
        ->name('messages.show');
    Route::post('/messages/{chat}', [MessageController::class, 'store']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy'])
        ->name('messages.destroy');
    Route::put('/messages/{message}', [MessageController::class, 'update'])
        ->name('messages.update');
    Route::get('/chats/media/{media}', [MessageController::class, 'downloadChatMedia'])
        ->name('chats.media.download');
    Route::post('/messages/{chat}/read', [App\Http\Controllers\MessageController::class, 'markAsRead'])
        ->name('messages.read');


    // Создание или открытие существующего диалога 1-на-1
    Route::post('/chats/dialog', [MessageController::class, 'storeDialog'])
        ->name('chats.dialog.store');

    // Создание группового чата (название группы + массив участников)
    Route::post('/chats/group', [MessageController::class, 'storeGroup'])
        ->name('chats.group.store');


    // news
    Route::get('/news', [NewsController::class, 'index']);
    Route::post('/news/{media}/like', [NewsController::class, 'toggleLike']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::delete('/news/{media}', [NewsController::class, 'destroy'])->name('news.destroy');
    Route::put('/news/{media}', [NewsController::class, 'update'])->name('news.update');

    // profile
    Route::get('/profile/edit', [ProfileController::class, 'edit']);
    Route::post('/profile/edit', [ProfileController::class, 'update']);    

    // Управление заявками в друзья
    Route::get('/friends', [FriendController::class, 'index']);
    Route::post('/friends/request/{user}', [FriendController::class, 'sendRequest'])->name('friends.request');
    Route::post('/friends/accept/{user}', [FriendController::class, 'acceptRequest'])->name('friends.accept');
    Route::delete('/friends/{user}', [FriendController::class, 'removeFriend'])->name('friends.remove');
    Route::post('/friends/decline/{user}', [FriendController::class, 'declineRequest'])->name('friends.decline');

    // Сообщества
    Route::get('/communities', [App\Http\Controllers\CommunityController::class, 'index'])
        ->name('communities.index');
    Route::post('/communities', [App\Http\Controllers\CommunityController::class, 'store'])
        ->name('communities.store');
    Route::get('/communities/{community:slug}', [App\Http\Controllers\CommunityController::class, 'show'])
        ->name('communities.show');
    Route::post('/communities/{community}/join', [App\Http\Controllers\CommunityController::class, 'join'])
        ->name('communities.join');
    Route::delete('/communities/{community}/leave', [App\Http\Controllers\CommunityController::class, 'leave'])
        ->name('communities.leave');


});

// Route::get('/favicon.ico', function () {
//     return response()->file(public_path('favicon.ico'), [
//         'Content-Type' => 'image/x-icon',
//         'Cache-Control' => 'no-store, no-cache, must-revalidate',
//         'Pragma' => 'no-cache',
//     ]);
// });