<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Friendship;
use App\Enums\FriendshipStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    public function index(Request $request)
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

        // 3. Поиск пользователей для вкладки «Поиск друзей»
        $search = trim((string) $request->input('search', ''));

        // Загружаем все связи текущего пользователя одним запросом, чтобы избежать N+1
        $myRelations = Friendship::where('user_id', $userId)
            ->orWhere('friend_id', $userId)
            ->get();

        $usersQuery = User::with('profile')
            ->where('id', '<>', $userId);

        if ($search !== '') {
            $usersQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'ILIKE', "%{$search}%")
                  ->orWhere('last_name', 'ILIKE', "%{$search}%");
            });
        }

        $foundUsers = $usersQuery->limit(30)->get()->map(function ($person) use ($userId, $myRelations) {
            // Ищем связь между текущим юзером и найденным человеком в любую сторону
            $relation = $myRelations->first(function ($rel) use ($userId, $person) {
                return ($rel->user_id === $userId && $rel->friend_id === $person->id)
                    || ($rel->user_id === $person->id && $rel->friend_id === $userId);
            });

            // Определяем статус для отображения нужной кнопки на фронтенде
            $relationStatus = 'none';
            if ($relation) {
                if ($relation->status === FriendshipStatus::Accepted) {
                    $relationStatus = 'accepted';
                } elseif ($relation->status === FriendshipStatus::Pending) {
                    $relationStatus = $relation->user_id === $userId ? 'outgoing' : 'incoming';
                // } elseif ($relation->status === FriendshipStatus::Declined) {
                //     // Если юзер сам отклонил заявку или её отклонили — можно показать 'declined' или 'none'
                //     $relationStatus = $relation->user_id === $userId ? 'outgoing' : 'declined';
                // }
                } elseif ($relation->status === FriendshipStatus::Declined) {
                    // Если нашу заявку отклонили — разрешаем отправить её повторно ('none')
                    // Если мы сами ранее отклонили входящую заявку — даём возможность её принять ('incoming')
                    $relationStatus = $relation->user_id === $userId ? 'none' : 'incoming';
                }
            }

            return [
                'id' => $person->id,
                'full_name' => $person->first_name . ' ' . $person->last_name,
                'hometown' => $person->profile?->hometown,
                'status' => $person->profile?->status_text,
                'relation_status' => $relationStatus,
            ];
        });

        return Inertia::render('Friends/Index', [
            'friends' => $friends,
            'incomingRequests' => $requests,
            'foundUsers' => $foundUsers,
            'filters' => ['search' => $search],
        ]);
    }

        /**
     * Отправить заявку в друзья
     */
    public function sendRequest(User $user)
    {
        $myId = Auth::id();

        if ($myId === $user->id) {
            abort(400, 'Нельзя добавить в друзья самого себя.');
        }

        DB::transaction(function () use ($myId, $user) {
            // // Проверяем, нет ли уже встречной или существующей связи (защита составного ключа)
            // $exists = Friendship::where(function ($q) use ($myId, $user) {
            //     $q->where('user_id', $myId)->where('friend_id', $user->id);
            // })->orWhere(function ($q) use ($myId, $user) {
            //     $q->where('user_id', $user->id)->where('friend_id', $myId);
            // })->exists();

            // if (!$exists) {
            //     Friendship::create([
            //         'user_id' => $myId,
            //         'friend_id' => $user->id,
            //         'status' => FriendshipStatus::Pending,
            //     ]);
            // }
            $existingRelation = Friendship::where(function ($q) use ($myId, $user) {
                $q->where('user_id', $myId)->where('friend_id', $user->id);
            })->orWhere(function ($q) use ($myId, $user) {
                $q->where('user_id', $user->id)->where('friend_id', $myId);
            })->first();

            if (!$existingRelation) {
                // Связи не было — создаём новую
                Friendship::create([
                    'user_id' => $myId,
                    'friend_id' => $user->id,
                    'status' => FriendshipStatus::Pending,
                ]);
            } elseif ($existingRelation->status === FriendshipStatus::Declined && $existingRelation->user_id === $myId) {
                // Заявка была ранее отклонена — переводим обратно в ожидание (повторная отправка)
                Friendship::where('user_id', $myId)
                    ->where('friend_id', $user->id)
                    ->update([
                        'status' => FriendshipStatus::Pending,
                        'created_at' => now(),
                    ]);
            }
        });

        return redirect()->back();
    }

    /**
     * Принять входящую заявку в друзья
     */
    public function acceptRequest(User $user)
    {
        $myId = Auth::id();

        DB::transaction(function () use ($myId, $user) {
            // Обновляем строго по составному ключу (инициатор: $user->id, получатель: $myId)
            Friendship::where('user_id', $user->id)
                ->where('friend_id', $myId)
                ->where('status', FriendshipStatus::Pending)
                ->update([
                    'status' => FriendshipStatus::Accepted,
                    'confirmed_at' => now(),
                ]);
        });

        return redirect()->back();
    }

    /**
     * Удалить из друзей, отменить свою заявку или скрыть входящую
     */
    public function removeFriend(User $user)
    {
        $myId = Auth::id();

        DB::transaction(function () use ($myId, $user) {
            Friendship::where(function ($q) use ($myId, $user) {
                $q->where('user_id', $myId)->where('friend_id', $user->id);
            })->orWhere(function ($q) use ($myId, $user) {
                $q->where('user_id', $user->id)->where('friend_id', $myId);
            })->delete();
        });

        return redirect()->back();
    }

    /**
     * Отклонить (скрыть) входящую заявку в друзья
     */
    public function declineRequest(User $user)
    {
        $myId = Auth::id();

        DB::transaction(function () use ($myId, $user) {
            Friendship::where('user_id', $user->id)
                ->where('friend_id', $myId)
                ->where('status', FriendshipStatus::Pending)
                ->update([
                    'status' => FriendshipStatus::Declined,
                ]);
        });

        return redirect()->back();
    }
}

