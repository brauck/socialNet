<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'username', 'email', 'password', 'phone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    // 1. Получить тех, кого юзер сам добавил в друзья (или на кого подписан)
    public function sentFriendships()
    {
        return $this->hasMany(Friendship::class, 'user_id');
    }

    // 2. Получить те заявки, которые прилетели самому юзеру от других
    public function receivedFriendships()
    {
        return $this->hasMany(Friendship::class, 'friend_id');
    }

    // 3. Продвинутый метод: получить список ID всех подтвержденных друзей
    public function getFriendIdsAttribute(): array
    {
        $sent = $this->sentFriendships()->where('status', 'accepted')->pluck('friend_id')->toArray();
        $received = $this->receivedFriendships()->where('status', 'accepted')->pluck('user_id')->toArray();
        
        return array_merge($sent, $received);
    }

    // Получить все сообщества, на которые подписан данный пользователь
    public function communities()
    {
        return $this->belongsToMany(Community::class, 'community_members')
                    ->withPivot('role', 'joined_at');
    }

    // Получить все чаты, в которых состоит пользователь
    public function chats()
    {
        return $this->belongsToMany(Chat::class, 'chat_members')->withPivot('joined_at');
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    // Получить все лайки, которые этот пользователь поставил в соцсети
    public function likedMedia()
    {
        return $this->hasMany(Like::class);
    }
}
