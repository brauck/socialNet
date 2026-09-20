import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div style={{ 
            fontFamily: 'sans-serif', 
            backgroundColor: '#edf0f5', 
            minHeight: '100vh',
            color: '#000000'
        }}>
            {/* 1. Верхняя шапка сайта (Header) */}
            <header style={{
                backgroundColor: '#ffffff',
                height: '48px',
                borderBottom: '1px solid #dce1e6',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ width: '960px', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                    <span style={{ color: '#4c75a3', fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.5px' }}>
                        socialNet
                    </span>
                </div>
            </header>

            {/* 2. Основной контейнер контента */}
            <div style={{
                width: '960px',
                margin: '0 auto',
                paddingTop: '68px', // Отступ вниз из-за фиксированной шапки
                display: 'flex',
                gap: '20px'
            }}>
                {/* Левое меню навигации (Sidebar в стиле VK) */}
                <aside style={{ width: '160px', flexShrink: 0 }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* preserveState сохраняет состояние компонентов при переходе */}
                        <Link href="/" style={menuItemStyle}>💁‍♂️ Моя страница</Link>
                        <Link href="/news" style={menuItemStyle}>📰 Новости</Link>
                        <Link href="/messages" style={menuItemStyle}>💬 Сообщения</Link>
                        <Link href="/friends" style={menuItemStyle}>👥 Друзья</Link>
                        <Link href="/communities" style={menuItemStyle}>👨‍👩‍👧‍👦 Сообщества</Link>
                    </nav>
                </aside>

                {/* Центральный блок, куда Inertia будет подставлять сами страницы */}
                <main style={{ flexGrow: 1, maxWidth: '780px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

// Стили для пунктов меню (вынесем в константу для чистоты кода)
const menuItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '6px 8px',
    color: '#2a5885',
    textDecoration: 'none',
    fontSize: '14px',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease'
};

export default MainLayout;
