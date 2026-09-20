<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    // Показать страницу входа
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    // Обработка отправки формы входа
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended('/');
        }

        throw ValidationException::withMessages([
            'email' => 'Неверный email или пароль.',
        ]);
    }

    // Показать страницу регистрации
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    // Обработка регистрации нового пользователя
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'username' => ['required', 'string', 'max:50', 'unique:users', 'alpha_dash'],
            'email' => ['required', 'string', 'email', 'max:120', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Сразу создаем ему пустой профиль в нашей связанной таблице
        $user->profile()->create([
            'hometown' => 'Не указан',
            'status_text' => 'Я в сети!',
        ]);

        Auth::login($user);

        return redirect('/');
    }

    // Выход из системы
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}

