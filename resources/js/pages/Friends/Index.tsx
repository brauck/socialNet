import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react'; // Добавили импорт для фоновых AJAX-запросов

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
    const [activeTab, setActiveTab] = useState<'my' | 'requests' | 'search'>('my');
    const [searchQuery, setSearchQuery] = useState<string>(filters?.search || '');

    const currentList = activeTab === 'my' 
        ? friends 
        : activeTab === 'requests' 
            ? incomingRequests 
            : foundUsers;

    // Живой поиск с задержкой 300 мс (debounce), чтобы не нагружать БД на каждую букву
    useEffect(() => {
        if (activeTab !== 'search') return;

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
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                
                {/* Вкладки в стиле VK */}
                <div className="flex gap-5 border-b border-gray-100 mb-3">
                    <button 
                        onClick={() => setActiveTab('my')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my' ? 'border-blue-600 text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                    >
                        Мои друзья ({friends.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-blue-600 text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                    >
                        Заявки в друзья ({incomingRequests.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search' ? 'border-blue-600 text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                    >
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
                <div className="flex flex-col">
                    {currentList.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            {activeTab === 'my' ? 'У вас пока нет друзей.' : 'Входящих заявок нет.'}
                        </div>
                    ) : (
                        currentList.map(person => (
                            <div key={person.id} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                                {/* Аватарка-заглушка */}
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl shrink-0">
                                    👨‍💻
                                </div>
                                
                                <div className="flex-grow">
                                    <div className="text-sm font-semibold text-blue-800 cursor-pointer hover:underline">
                                        {person.full_name}
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
                                                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Написать
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveFriend(person.id)}
                                                className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                Убрать из друзей
                                            </button>
                                        </>
                                    )}

                                    {activeTab === 'requests' && (
                                        <>
                                            <button 
                                                onClick={() => handleAcceptRequest(person.id)}
                                                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Принять
                                            </button>
                                            <button 
                                                onClick={() => handleDeclineRequest(person.id)}
                                                className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
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
                                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    Добавить в друзья
                                                </button>
                                            )}
                                            {person.relation_status === 'outgoing' && (
                                                <button 
                                                    onClick={() => handleRemoveFriend(person.id)}
                                                    className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                                                    title="Нажмите, чтобы отменить заявку"
                                                >
                                                    Заявка отправлена
                                                </button>
                                            )}
                                            {person.relation_status === 'incoming' && (
                                                <button 
                                                    onClick={() => handleAcceptRequest(person.id)}
                                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    Принять заявку
                                                </button>
                                            )}
                                            {person.relation_status === 'accepted' && (
                                                <button 
                                                    onClick={() => handleWriteMessage(person.id)}
                                                    className="bg-gray-100 text-blue-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
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
