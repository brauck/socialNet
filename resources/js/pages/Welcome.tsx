import React from 'react';

// Описываем строгий тип для пользователя из Laravel
interface UserProps {
    id: number;
    full_name: string;
    email: string;
    hometown: string;
    status: string;
    birthday: string;
}

interface WelcomeProps {
    appName: string;
    user: UserProps;
    serverTime: string;
}

const Welcome: React.FC<WelcomeProps> = ({ appName, user, serverTime }) => {
    return (
        <div style={{ 
            fontFamily: 'sans-serif', 
            padding: '40px', 
            backgroundColor: '#f0f2f5', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '450px'
            }}>
                <h1 style={{ color: '#4c75a3', fontSize: '24px', margin: '0 0 5px 0' }}>
                    {user.full_name}
                </h1>
                <p style={{ 
                    fontStyle: 'italic', 
                    color: '#555', 
                    margin: '0 0 20px 0',
                    fontSize: '14px',
                    borderLeft: '3px solid #4c75a3',
                    paddingLeft: '10px'
                }}>
                    «{user.status}»
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
                    <div>📍 <strong>Родной город:</strong> {user.hometown}</div>
                    <div>📅 <strong>День рождения:</strong> {user.birthday}</div>
                    <div>✉️ <strong>Email:</strong> {user.email}</div>
                </div>

                <div style={{ 
                    marginTop: '25px', 
                    fontSize: '12px', 
                    color: '#888',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px',
                    textAlign: 'center'
                }}>
                    Подключено к СУБД PostgreSQL (Порт 5434)<br />
                    Vite HMR работает | {serverTime}
                </div>
            </div>
        </div>
    );
};

export default Welcome;
