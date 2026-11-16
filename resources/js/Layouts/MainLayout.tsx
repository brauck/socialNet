import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="font-sans bg-[#edf0f5] min-h-screen text-black">
            {/* 1. Верхняя шапка сайта (Header) */}
            <header className="bg-white h-12 border-b border-[#dce1e6] fixed top-0 left-0 right-0 z-[100] flex items-center justify-center">
                <div className="w-[960px] flex items-center px-[15px]">
                    <span className="text-[#4c75a3] font-bold text-xl tracking-[0.5px]">
                        socialNet
                    </span>
                </div>
            </header>

            {/* 2. Основной контейнер контента */}
            <div className="w-[960px] mx-auto pt-[68px] flex gap-5">
                {/* Левое меню навигации (Sidebar в стиле VK) */}
                <aside className="w-40 shrink-0">
                    <nav className="flex flex-col gap-1">
                        <Link href="/" className="menu-item">💁‍♂️ Моя страница</Link>
                        <Link href="/news" className="menu-item">📰 Новости</Link>
                        <Link href="/messages" className="menu-item">💬 Сообщения</Link>
                        <Link href="/friends" className="menu-item">👥 Друзья</Link>
                        <Link href="/communities" className="menu-item">👨‍👩‍👧‍👦 Сообщества</Link>

                        {/* Кнопка выхода через POST-запрос Inertia */}
                        <Link 
                            href="/logout" 
                            method="post" 
                            as="button" 
                            className="menu-item w-full text-left cursor-pointer text-[#939393] mt-[15px] border-t border-[#dce1e6] rounded-none pt-2.5"
                        >
                            🚪 Выйти
                        </Link>
                    </nav>
                </aside>

                {/* Центральный блок, куда Inertia будет подставлять сами страницы */}
                <main className="grow max-w-[780px]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
