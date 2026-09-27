import React from 'react';
import { router, useForm, Link } from '@inertiajs/react';

const Login: React.FC = () => {
    // Инициализируем форму через удобный хук Inertia
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ХАК ДЛЯ FIREFOX: Если браузер сделал "теневое заполнение", 
        // принудительно вытаскиваем значения прямо из элементов формы (DOM)
        // Явно говорим TypeScript, что текущая цель — это HTML-форма
        const form = e.currentTarget as HTMLFormElement;
        
        // Теперь элементы формы доступны для безопасного извлечения значений (хак для Firefox)
        const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
        const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;

        const emailValue = emailInput?.value || data.email;
        const passwordValue = passwordInput?.value || data.password;

        // Отправляем гарантированно заполненные из DOM данные через Inertia router
        router.post('/login', {
            email: emailValue,
            password: passwordValue,
            remember: data.remember,
        });
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={logoStyle}>socialNet</h2>
                <p style={subtitleStyle}>Вход в социальную сеть</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <input 
                            type="email" 
                            name="email"
                            placeholder="Email" 
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            style={inputStyle}
                            required
                        />
                        {errors.email && <div style={errorStyle}>{errors.email}</div>}
                    </div>

                    <div>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Пароль" 
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            style={inputStyle}
                            required
                        />
                        {errors.password && <div style={errorStyle}>{errors.password}</div>}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                        />
                        Запомнить меня
                    </label>

                    <button 
                        type="submit" 
                        disabled={processing}
                        style={{ ...buttonStyle, opacity: processing ? 0.7 : 1 }}
                    >
                        {processing ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div style={footerStyle}>
                    Впервые у нас? <Link href="/register" style={{ color: '#2a5885', textDecoration: 'none' }}>Зарегистрироваться</Link>
                </div>
            </div>
        </div>
    );
};

// Стили для гостевой страницы в духе VK
const containerStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    backgroundColor: '#edf0f5',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '35px',
    borderRadius: '8px',
    border: '1px solid #dce1e6',
    width: '100%',
    maxWidth: '360px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const logoStyle: React.CSSProperties = {
    color: '#4c75a3',
    textAlign: 'center',
    margin: '0 0 5px 0',
    fontSize: '28px',
    fontWeight: 'bold'
};

const subtitleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#65676b',
    fontSize: '14px',
    margin: '0 0 25px 0'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #dce1e6',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#f2f3f5'
};

const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4c75a3',
    color: '#ffffff',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '5px'
};

const errorStyle: React.CSSProperties = {
    color: '#e12e2e',
    fontSize: '12px',
    marginTop: '4px',
    paddingLeft: '2px'
};

const footerStyle: React.CSSProperties = {
    marginTop: '25px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#555',
    borderTop: '1px solid #f0f2f5',
    paddingTop: '20px'
};

export default Login;
