import { router } from '@inertiajs/react';
import React from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface LastMessageProps {
    id: number;
    body: string;
    is_read: boolean;
    sender_name: string;
    is_me: boolean;
    date: string;
}

interface ChatProps {
    id: number;
    type: 'dialog' | 'group';
    title: string;
    last_message: LastMessageProps | null;
}

interface IndexProps {
    chats: ChatProps[];
}

const Index: React.FC<IndexProps> = ({ chats }) => {
    return (
        <MainLayout>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Шапка мессенджера */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">Все диалоги</h2>
                    <span className="text-xs text-gray-500">Всего чатов: {chats.length}</span>
                </div>

                {/* Список чатов */}
                <div className="flex flex-col">
                    {chats.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                            У вас пока нет активных диалогов.
                        </div>
                    ) : (
                        chats.map(chat => {
                            // Проверяем, нужно ли подсветить чат как непрочитанный (VK стиль)
                            const isUnread = chat.last_message && !chat.last_message.is_read && !chat.last_message.is_me;

                            return (
                                <div 
                                    key={chat.id}
                                    onClick={() => router.visit(`/messages/${chat.id}`)}
                                    className={`flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : ''}`}
                                >
                                    {/* Круглая аватарка чата */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${chat.type === 'group' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {chat.type === 'group' ? '👥' : '💬'}
                                    </div>

                                    {/* Тело диалога */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-medium text-gray-900 truncate hover:text-blue-800">
                                                {chat.title}
                                            </span>
                                            {chat.last_message && (
                                                <span className="text-xs text-gray-400 shrink-0 ml-2">
                                                    {chat.last_message.date}
                                                </span>
                                            )}
                                        </div>

                                        {chat.last_message ? (
                                            <div className="flex items-center justify-between mt-1 text-sm">
                                                <p className="text-gray-500 truncate max-w-xl">
                                                    {chat.last_message.is_me ? (
                                                        <span className="text-gray-400 font-medium">Вы: </span>
                                                    ) : (
                                                        <span className="text-blue-700/80 font-medium">{chat.last_message.sender_name}: </span>
                                                    )}
                                                    {chat.last_message.body}
                                                </p>

                                                {/* Индикатор прочтения */}
                                                {chat.last_message.is_me && (
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ml-3 ${chat.last_message.is_read ? 'bg-transparent' : 'bg-blue-400'}`} title={chat.last_message.is_read ? "Прочитано" : "Не прочитано"} />
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic mt-1">Нет сообщений</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Index;
