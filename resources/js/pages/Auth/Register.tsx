import React from 'react';
import { useForm, Link } from '@inertiajs/react';

const Register: React.FC = () => {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Отправляем данные на бэкенд в контроллер AuthController@register
        post('/register');
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={logoStyle}>socialNet</h2>
                <p style={subtitleStyle}>Регистрация нового профиля</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                placeholder="Имя" 
                                value={data.first_name}
                                onChange={e => setData('first_name', e.target.value)}
                                style={inputStyle}
                                required
                            />
                            {errors.first_name && <div style={errorStyle}>{errors.first_name}</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                placeholder="Фамилия" 
                                value={data.last_name}
                                onChange={e => setData('last_name', e.target.value)}
                                style={inputStyle}
                                required
                            />
                            {errors.last_name && <div style={errorStyle}>{errors.last_name}</div>}
                        </div>
                    </div>

                    <div>
                        <input 
                            type="text" 
                            placeholder="Никнейм (например, id123 или ivan)" 
                            value={data.username}
                            onChange={e => setData('username', e.target.value)}
                            style={inputStyle}
                            required
                        />
                        {errors.username && <div style={errorStyle}>{errors.username}</div>}
                    </div>

                    <div>
                        <input 
                            type="email" 
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
                            placeholder="Пароль (мин. 8 символов)" 
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            style={inputStyle}
                            required
                        />
                        {errors.password && <div style={errorStyle}>{errors.password}</div>}
                    </div>

                    <div>
                        <input 
                            type="password" 
                            placeholder="Подтвердите пароль" 
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing}
                        style={{ ...buttonStyle, opacity: processing ? 0.7 : 1 }}
                    >
                        {processing ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <div style={footerStyle}>
                    Уже есть аккаунт? <Link href="/login" style={{ color: '#2a5885', textDecoration: 'none' }}>Войти</Link>
                </div>
            </div>
        </div>
    );
};

// Стили идентичны Login.tsx для сохранения единого гостевого дизайна VK
const containerStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    backgroundColor: '#edf0f5',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0'
};

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '35px',
    borderRadius: '8px',
    border: '1px solid #dce1e6',
    width: '100%',
    maxWidth: '380px',
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
    padding: '11px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '10px'
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

export default Register;
