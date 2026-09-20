<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CommunityController extends Controller
{
    public function index()
    {
        // 1. Получаем сообщества, в которых состоит текущий пользователь     
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $myCommunities = $user->communities()
            ->withCount('members')
            ->get();

        // 2. Получаем вообще все сообщества соцсети для вкладки Поиск/Общие
        $allCommunities = Community::withCount('members')
            ->latest()
            ->get();

        // Отправляем данные в React-компонент Pages/Communities/Index.tsx
        return Inertia::render('Communities/Index', [
            'myCommunities' => $myCommunities,
            'allCommunities' => $allCommunities
        ]);
    }
}

