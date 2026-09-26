import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'pusher'>;
    }
}

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    window.Echo = new Echo<'pusher'>({
        // ХАК: Обманываем TypeScript с помощью 'as any'.
        // Это включит нативный коннектор Reverb и уберет ошибку компиляции!
        broadcaster: 'reverb' as any, 
        
        key: import.meta.env.VITE_REVERB_APP_KEY || 'my-app-key',
        wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
    });
}
