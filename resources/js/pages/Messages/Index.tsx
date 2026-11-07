import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface LastMessageProps {
    id: number;
    body: string;
    is_read: boolean;
    sender_name: string;    
    is_me: boolean;
    date: string;
}

interface FriendProps {
    id: number;
    full_name: string;
}

interface ChatProps {
    id: number;
    type: 'dialog' | 'group';
    title: string;
    last_message: LastMessageProps | null;
    interlocutor_avatar: string | null;
}

interface IndexProps {
    chats: ChatProps[];
    friends: FriendProps[];
}

const Index: React.FC<IndexProps> = ({ chats, friends = [] }) => {
    // Состояние, открыта ли панель создания группового чата
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // Инициализируем форму через Inertia useForm
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        member_ids: [] as number[], // Сюда будут падать ID выбранных друзей
    });

    // Функция переключения чекбокса друга
    const handleToggleMember = (friendId: number) => {
        if (data.member_ids.includes(friendId)) {
            setData('member_ids', data.member_ids.filter(id => id !== friendId));
        } else {
            setData('member_ids', [...data.member_ids, friendId]);
        }
    };

    // Отправка формы на бэкенд в Docker
    const handleSubmitGroup = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!data.title.trim() || data.member_ids.length === 0) return;

        post('/chats/group', {
            preserveState: true,
            onSuccess: () => {
                setIsCreatingGroup(false);
                reset('title', 'member_ids');
            }
        });
    };

    const countDialogs = chats.filter(chat => chat.type === 'dialog').length;
    const countGroup = chats.filter(chat => chat.type === 'group').length;

    return (
        <MainLayout>
            <Head title="Сообщения" />
            {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"> */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100dvh-140px)] min-h-[400px]">
                
                {/* Шапка мессенджера */}
                {/* <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">Все диалоги</h2>
                    <span className="text-xs text-gray-500">Всего чатов: {chats.length}</span>
                </div> */}
                <div className="flex justify-between items-center w-full">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-sm font-semibold text-gray-800">Все чаты</h2>
                        <span className="text-xs text-gray-500 pl-5">
                            всего: {chats.length} (диалоги: {countDialogs}, групповые: {countGroup})
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setIsCreatingGroup(!isCreatingGroup);
                            if (isCreatingGroup) reset('title', 'member_ids');
                        }}
                        className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${isCreatingGroup ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {isCreatingGroup ? '✕ Отмена' : '👥 Создать беседу'}
                    </button>
                </div>

                {/* Разворачивающаяся панель создания чата */}
                {isCreatingGroup && (
                    <form onSubmit={handleSubmitGroup} className="border-t border-gray-200 pt-3 flex flex-col gap-3 animate-fade-in">
                        <div className="flex flex-col gap-1">
                            <input 
                                type="text" 
                                placeholder="Введите название беседы..." 
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-400"
                                disabled={processing}
                                required
                            />
                            {errors.title && <span className="text-[11px] text-red-600">{errors.title}</span>}
                        </div>

                        {/* Блок выбора друзей */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-medium text-gray-500">Пригласить друзей (выберите хотя бы одного):</span>
                            {friends.length === 0 ? (
                                <div className="text-xs text-gray-400 italic py-1">У вас пока нет друзей, которых можно пригласить.</div>
                            ) : (
                                <div className="max-h-24 overflow-y-auto border border-gray-100 bg-white rounded p-2 flex flex-col gap-1">
                                    {friends.map(friend => (
                                        <label key={friend.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-0.5 hover:bg-gray-50">
                                            <input 
                                                type="checkbox" 
                                                checked={data.member_ids.includes(friend.id)}
                                                onChange={() => handleToggleMember(friend.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-400 w-3.5 h-3.5"
                                                disabled={processing}
                                            />
                                            <span>{friend.full_name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {errors.member_ids && <span className="text-[11px] text-red-600">{errors.member_ids}</span>}
                        </div>

                        <button 
                            type="submit"
                            disabled={processing || !data.title.trim() || data.member_ids.length === 0}
                            className="bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 self-end px-4"
                        >
                            {processing ? 'Создание...' : 'Начать беседу'}
                        </button>
                    </form>
                )}

                {/* Список чатов */}
                {/* <div className="flex flex-col"> */}
                {/* Список чатов со скролл-зоной */}
                <div className="flex-col flex-grow overflow-y-auto">
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
                                    <div className={`w-12 h-12 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center text-sm shrink-0 shadow-inner ${chat.type === 'group' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {chat.type === 'group' ? '👥' : chat.interlocutor_avatar ? (
                                            <img src={chat.interlocutor_avatar} alt="Собеседник" className="w-full h-full object-cover" />
                                        ) : (
                                            '💬'
                                        )}
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
