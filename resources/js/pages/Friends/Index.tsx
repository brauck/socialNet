import React, { useState, useEffect } from 'react';
import { Link, router, useRemember } from '@inertiajs/react'; // Добавили импорт для фоновых AJAX-запросов

import { getTabClass } from '../../constants/ui';
import MainLayout from '../../Layouts/MainLayout';

interface FriendProps {
    id: number;
    full_name: string;
    hometown: string | null;
    status: string | null;
    relation_status?: 'none' | 'outgoing' | 'incoming' | 'accepted' | 'declined';
}

interface IndexProps {
    friends: FriendProps[];
    incomingRequests: FriendProps[];
    foundUsers: FriendProps[];
    filters: { search: string };
}

const Index: React.FC<IndexProps> = ({ friends, incomingRequests, foundUsers = [], filters }) => {
    // const [activeTab, setActiveTab] = useState<'my' | 'requests' | 'search'>('my');
    const [activeTab, setActiveTab] = useRemember<'my' | 'requests' | 'search'>('my', 'Friends/ActiveTab');

    const [searchQuery, setSearchQuery] = useState<string>(filters?.search || '');

    const currentList = activeTab === 'my' 
        ? friends 
        : activeTab === 'requests' 
            ? incomingRequests 
            : foundUsers;

    // Живой поиск с задержкой 300 мс (debounce), чтобы не нагружать БД на каждую букву
    useEffect(() => {
        if (activeTab !== 'search') return;
        if (searchQuery === (filters?.search || '')) return;

        const timer = setTimeout(() => {
            router.get('/friends', { search: searchQuery }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);


    const handleWriteMessage = (friendId: number) => {
        router.post('/chats/dialog', {
            interlocutor_id: friendId
        });
    };

    const handleSendRequest = (userId: number) => {
        router.post(`/friends/request/${userId}`, {}, { preserveScroll: true });
    };

    const handleAcceptRequest = (userId: number) => {
        router.post(`/friends/accept/${userId}`, {}, { preserveScroll: true });
    };

    const handleRemoveFriend = (userId: number) => {
        router.delete(`/friends/${userId}`, { preserveScroll: true });
    };    

    const handleDeclineRequest = (userId: number) => {
        router.post(`/friends/decline/${userId}`, {}, { preserveScroll: true });
    };

    return (
        <MainLayout>
            {/* Основной контейнер с использованием встроенных стилей Tailwind */}
            <div className="page-card">                
                {/* Вкладки в стиле VK */}
                <div className="flex gap-5 border-b border-gray-100 mb-3">
                    {/* <button 
                        onClick={() => setActiveTab('my')}
                        data-active={activeTab === 'my'} 
                        className="tab-item"
                    >
                        Мои друзья ({friends.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')}
                        data-active={activeTab === 'requests'} 
                        className="tab-item"
                    >
                        Заявки в друзья ({incomingRequests.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        data-active={activeTab === 'search'} 
                        className="tab-item"
                    >
                        🔍 Поиск друзей
                    </button> */}
                    <button onClick={() => setActiveTab('my')} className={getTabClass(activeTab === 'my')}>
                        Мои друзья ({friends.length})
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={getTabClass(activeTab === 'requests')}>
                        Заявки в друзья ({incomingRequests.length})
                    </button>
                    <button onClick={() => setActiveTab('search')} className={getTabClass(activeTab === 'search')}>
                        🔍 Поиск друзей
                    </button>
                </div>


                {/* Строка поиска (показывается только на вкладке поиска) */}
                {activeTab === 'search' && (
                    <div className="mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Введите имя или фамилию человека..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                            autoFocus
                        />
                    </div>
                )}

                {/* Список людей */}
                {/* <div className="flex flex-col"> */}
                <div className="grow p-4 overflow-y-auto flex flex-col">
                    {currentList.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            {activeTab === 'my' ? 'У вас пока нет друзей.' : 'Входящих заявок нет.'}
                        </div>
                    ) : (
                        currentList.map(person => (
                            <div key={person.id} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                                {/* Аватарка-заглушка */}
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl shrink-0">                                    
                                    <Link 
                                            href={`/users/${person.id}`}
                                        >
                                            👨‍💻
                                        </Link>
                                </div>
                                
                                <div className="grow">
                                    <div className="text-sm font-semibold text-blue-800 cursor-pointer hover:underline">
                                        <Link 
                                            href={`/users/${person.id}`} 
                                            className="text-sm font-semibold text-blue-800 hover:underline inline-block"
                                        >
                                            {person.full_name}
                                        </Link>
                                    </div>
                                    {person.status && (
                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                                            {person.status}
                                        </div>
                                    )}
                                    {person.hometown && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            Город: {person.hometown}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Карточка пользователя */}
                                {/* <div className="flex gap-2">
                                    {activeTab === 'my' ? (
                                        <>
                                            <button 
                                                onClick={() => handleWriteMessage(person.id)}
                                                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Написать
                                            </button>
                                            <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                                                Убрать из друзей
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
                                                Принять
                                            </button>
                                            <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                                                Скрыть
                                            </button>
                                        </>
                                    )}
                                </div> */}
                                <div className="flex gap-2 shrink-0">
                                    {activeTab === 'my' && (
                                        <>
                                            <button 
                                                onClick={() => handleWriteMessage(person.id)}
                                                className="btn-primary"
                                            >
                                                Написать
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveFriend(person.id)}
                                                className="btn-secondary"
                                            >
                                                Убрать из друзей
                                            </button>
                                        </>
                                    )}

                                    {activeTab === 'requests' && (
                                        <>
                                            <button 
                                                onClick={() => handleAcceptRequest(person.id)}
                                                className="btn-primary"
                                            >
                                                Принять
                                            </button>
                                            <button 
                                                onClick={() => handleDeclineRequest(person.id)}
                                                className="btn-secondary"
                                            >
                                                Скрыть
                                            </button>
                                        </>
                                    )}

                                    {activeTab === 'search' && (
                                        <>
                                            {person.relation_status === 'none' && (
                                                <button 
                                                    onClick={() => handleSendRequest(person.id)}
                                                    className="btn-primary"
                                                >
                                                    Добавить в друзья
                                                </button>
                                            )}
                                            {person.relation_status === 'outgoing' && (
                                                <button 
                                                    onClick={() => handleRemoveFriend(person.id)}
                                                    className="btn-secondary"
                                                    title="Нажмите, чтобы отменить заявку"
                                                >
                                                    Заявка отправлена
                                                </button>
                                            )}
                                            {person.relation_status === 'incoming' && (
                                                <button 
                                                    onClick={() => handleAcceptRequest(person.id)}
                                                    className="btn-secondary"
                                                >
                                                    Принять заявку
                                                </button>
                                            )}
                                            {person.relation_status === 'accepted' && (
                                                <button 
                                                    onClick={() => handleWriteMessage(person.id)}
                                                    className="btn-secondary"
                                                >
                                                    Написать сообщение
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>
        </MainLayout>
    );
};

export default Index;
