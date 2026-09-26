import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'pusher'>;
    }
}

// Запускаем инициализацию ТОЛЬКО если код выполняется в браузере
if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    window.Echo = new Echo<'pusher'>({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'my-app-key',
        wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false, // Отключаем безопасный протокол wss:// для Docker
        encrypted: false,
        enabledTransports: ['ws', 'wss'],
    });
}
