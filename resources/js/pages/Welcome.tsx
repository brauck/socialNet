import React from 'react';
import MainLayout from '../Layouts/MainLayout'; // Импортируем макет
import { Link } from '@inertiajs/react'; // КРИТИЧЕСКИ ВАЖНО: Добавляем импорт Link для кнопки

interface UserProps {
    id: number;
    full_name: string;
    email: string;
    hometown: string;
    status: string;
    birthday: string;
    avatar_url: string | null; // Тип аватарки на месте
}

interface WelcomeProps {
    appName: string;
    user: UserProps;
    serverTime: string;
}

const Welcome: React.FC<WelcomeProps> = ({ appName, user, serverTime }) => {
    return (
        <MainLayout>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '25px',
                borderRadius: '8px',
                border: '1px solid #dce1e6',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)'
            }}>
                
                {/* НОВАЯ СЕКЦИЯ: Блок Аватарки и Основных Данных в стиле VK */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
                    
                    {/* Левая колонка: Круглая аватарка */}
                    <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        backgroundColor: '#f2f3f5',
                        border: '1px solid #dce1e6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        flexShrink: 0
                    }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Аватарка" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            '👨‍💻'
                        )}
                    </div>

                    {/* Правая колонка: Имя, Статус и Кнопка */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                            <h1 style={{ color: '#000000', fontSize: '20px', margin: '0', fontWeight: 500, flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {user.full_name}
                            </h1>
                            
                            {/* Интерактивная кнопка перехода к редактированию */}
                            <Link href="/profile/edit" style={{
                                fontSize: '13px',
                                color: '#2a5885',
                                backgroundColor: '#f0f2f5',
                                textDecoration: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                transition: 'background-color 0.15s ease'
                            }}>
                                Редактировать
                            </Link>
                        </div>
                        
                        {/* Текстовый статус пользователя */}
                        <p style={{ 
                            color: '#65676b', 
                            margin: '8px 0 0 0',
                            fontSize: '13px',
                            borderLeft: '2px solid #4c75a3',
                            paddingLeft: '8px',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}>
                            {user.status || 'Изменить статус'}
                        </p>
                    </div>
                </div>

                {/* Дополнительная подробная информация профиля */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    fontSize: '13px',
                    borderTop: '1px solid #f0f2f5',
                    paddingTop: '15px'
                }}>
                    <div><span style={{ color: '#828282', width: '120px', display: 'inline-block' }}>Родной город:</span> <span style={{ color: '#2a5885' }}>{user.hometown}</span></div>
                    <div><span style={{ color: '#828282', width: '120px', display: 'inline-block' }}>День рождения:</span> <span style={{ color: '#2a5885' }}>{user.birthday}</span></div>
                    <div><span style={{ color: '#828282', width: '120px', display: 'inline-block' }}>Email:</span> {user.email}</div>
                </div>

                <div style={{ 
                    marginTop: '30px', 
                    fontSize: '11px', 
                    color: '#939393',
                    textAlign: 'right'
                }}>
                    socialNet Engine v1.0 | {serverTime}
                </div>
            </div>
        </MainLayout>
    );
};

export default Welcome;
