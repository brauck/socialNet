import React from 'react';
import MainLayout from '../Layouts/MainLayout'; // Импортируем макет

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
        <MainLayout>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '25px',
                borderRadius: '8px',
                border: '1px solid #dce1e6',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ color: '#000000', fontSize: '20px', margin: '0 0 5px 0', fontWeight: 500 }}>
                    {user.full_name}
                </h1>
                
                <p style={{ 
                    color: '#65676b', 
                    margin: '0 0 20px 0',
                    fontSize: '13px',
                    borderLeft: '2px solid #4c75a3',
                    paddingLeft: '8px'
                }}>
                    {user.status || 'Изменить статус'}
                </p>

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
