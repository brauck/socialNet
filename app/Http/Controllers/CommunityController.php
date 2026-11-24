<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CommunityController extends Controller
{
    public function index()
    {
        // 1. Получаем сообщества, в которых состоит текущий пользователь     
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Получаем ID всех сообществ, в которых состоит текущий пользователь
        $myCommunityIds = $user->communities()->pluck('communities.id')->toArray();

        $myCommunities = $user->communities()
            ->withCount('members')
            ->get()
            ->map(fn($c) => $this->formatCommunity($c, $myCommunityIds, $user->id));

        // 2. Получаем вообще все сообщества соцсети для вкладки Поиск/Общие
        $allCommunities = Community::withCount('members')
            ->latest()
            ->get()
            ->map(fn($c) => $this->formatCommunity($c, $myCommunityIds, $user->id));

        // Отправляем данные в React-компонент Pages/Communities/Index.tsx
        return Inertia::render('Communities/Index', [
            'myCommunities' => $myCommunities,
            'allCommunities' => $allCommunities
        ]);
    }

    /**
     * Создание нового сообщества
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:group,public,event'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        // $user = Auth::user();
        // $createdCommunity = null;

        // DB::transaction(function () use ($request, $user, &$createdCommunity) {
        //     // Генерируем уникальный slug (если название повторяется — добавляем случайный суффикс)
        //     $baseSlug = Str::slug($request->name) ?: 'community';
        //     $slug = $baseSlug;
        //     if (Community::where('slug', $slug)->exists()) {
        //         $slug = $baseSlug . '-' . Str::lower(Str::random(5));
        //     }

        //     $community = Community::create([
        //         'name' => $request->name,
        //         'slug' => $slug,
        //         'type' => $request->type,
        //         'description' => $request->description,
        //         'creator_id' => $user->id,
        //     ]);

        //     // Автоматически добавляем создателя в участники с ролью administrator
        //     $community->members()->attach($user->id, [
        //         'role' => 'administrator',
        //         'joined_at' => now(),
        //     ]);

        //     $createdCommunity = $community;
        // });

        // return redirect()->route('communities.show', ['community' => $createdCommunity->slug]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $createdCommunity = DB::transaction(function () use ($request, $user): Community {
            $baseSlug = Str::slug($request->name) ?: 'community';
            $slug = $baseSlug;
            if (Community::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . Str::lower(Str::random(5));
            }

            $community = Community::create([
                'name' => $request->name,
                'slug' => $slug,
                'type' => $request->type,
                'description' => $request->description,
                'creator_id' => $user->id,
            ]);

            $community->members()->attach($user->id, [
                'role' => 'administrator',
                'joined_at' => now(),
            ]);

            return $community;
        });

        return redirect()->route('communities.show', ['community' => $createdCommunity->slug]);

    }

    /**
     * Просмотр страницы конкретного сообщества (/communities/{slug})
     */
    public function show(Community $community)
    {
        $user = Auth::user();
        $community->loadCount('members')->load('creator');

        $isMember = $community->members()->where('user_id', $user->id)->exists();
        $isCreator = $community->creator_id === $user->id;

        return Inertia::render('Communities/Show', [
            'community' => [
                'id' => $community->id,
                'name' => $community->name,
                'slug' => $community->slug,
                'type' => $community->type,
                'description' => $community->description,
                'avatar_url' => $community->avatar_url ? asset('storage/' . $community->avatar_url) : null,
                'members_count' => $community->members_count,
                'creator_name' => $community->creator->first_name . ' ' . $community->creator->last_name,
                'is_member' => $isMember,
                'is_creator' => $isCreator,
            ]
        ]);
    }

    /**
     * Вступить / подписаться на сообщество
     */
    public function join(Community $community)
    {
        $userId = Auth::id();

        DB::transaction(function () use ($community, $userId) {
            // syncWithoutDetaching безопасно добавляет запись, не вызывая ошибку дубликата составного ключа
            $community->members()->syncWithoutDetaching([
                $userId => [
                    'role' => 'member',
                    'joined_at' => now(),
                ]
            ]);
        });

        return redirect()->back();
    }

    /**
     * Выйти / отписаться от сообщества
     */
    public function leave(Community $community)
    {
        $userId = Auth::id();

        // Создатель не может просто выйти из своего сообщества
        if ($community->creator_id === $userId) {
            abort(403, 'Создатель не может покинуть собственное сообщество.');
        }

        DB::transaction(function () use ($community, $userId) {
            $community->members()->detach($userId);
        });

        return redirect()->back();
    }

    private function formatCommunity(Community $community, array $myCommunityIds, int $userId): array
    {
        return [
            'id' => $community->id,
            'name' => $community->name,
            'slug' => $community->slug,
            'type' => $community->type,
            'description' => $community->description,
            'avatar_url' => $community->avatar_url ? asset('storage/' . $community->avatar_url) : null,
            'members_count' => $community->members_count,
            'is_member' => in_array($community->id, $myCommunityIds),
            'is_creator' => $community->creator_id === $userId,
        ];
    }
}

