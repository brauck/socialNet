import React, { useState } from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface FriendProps {
    id: number;
    full_name: string;
    hometown: string | null;
    status: string | null;
}

interface IndexProps {
    friends: FriendProps[];
    incomingRequests: FriendProps[];
}

const Index: React.FC<IndexProps> = ({ friends, incomingRequests }) => {
    const [activeTab, setActiveTab] = useState<'my' | 'requests'>('my');

    const currentList = activeTab === 'my' ? friends : incomingRequests;

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
                </div>

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

                                <div className="flex gap-2">
                                    {activeTab === 'my' ? (
                                        <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                                            Убрать из друзей
                                        </button>
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
