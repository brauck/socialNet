import React, { useEffect, useRef, useState } from 'react'; // Добавили useState
import MainLayout from '../../Layouts/MainLayout';
import { useForm, Link } from '@inertiajs/react';

interface MessageProps {
    id: number;
    body: string;
    sender_id: number;
    sender_name: string;
    is_me: boolean;
    date: string;
}

interface ChatProps {
    id: number;
    title: string;
    type: 'dialog' | 'group';
}

interface ShowProps {
    chat: ChatProps;
    messages: MessageProps[];
}

const Show: React.FC<ShowProps> = ({ chat, messages }) => {
    // 1. ИНИЦИАЛИЗИРУЕМ ЛОКАЛЬНОЕ СОСТОЯНИЕ ДЛЯ СООБЩЕНИЙ
    const [localMessages, setLocalMessages] = useState<MessageProps[]>(messages);

    const { data, setData, post, processing, reset } = useForm({
        body: '',
    });

    // Синхронизируем локальное состояние, если Inertia обновляет пропсы жестким переходом
    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    // Реф для автоматического скролла вниз при открытии чата или новом сообщении
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Теперь автоскролл следит за обновлением локального массива сообщений сокетов!
    useEffect(() => {
        scrollToBottom();
    }, [localMessages]);

    // 2. ПОДКЛЮЧАЕМ ПРИВАТНЫЙ WebSocket-СЛУШАТЕЛЬ LARAVEL ECHO
    useEffect(() => {
        // Подключаемся строго к приватному каналу этого конкретного чата
        const channel = window.Echo.private(`chat.${chat.id}`);

        channel.listen('.message.sent', (e: { messageData: any }) => {
            console.log('По закрытому каналу прилетело новое сообщение:', e.messageData);
            
            // Защита от дублирования: проверяем, нет ли уже такого сообщения в нашем массиве
            setLocalMessages(prevMessages => {
                if (prevMessages.some(msg => msg.id === e.messageData.id)) {
                    return prevMessages;
                }

                // Мапим структуру бэкенда под интерфейс MessageProps твоего экрана
                const incomingMessage: MessageProps = {
                    id: e.messageData.id,
                    body: e.messageData.body,
                    sender_id: e.messageData.sender.id,
                    sender_name: e.messageData.sender.full_name,
                    is_me: false, // Раз оно прилетело по сокетам — его гарантированно отправил КТО-ТО ДРУГОЙ!
                    date: 'Только что', // В реальном продакшене тут используют js-библиотеки времени
                };

                return [...prevMessages, incomingMessage];
            });
        });

        // Отписываемся от приватного канала при уходе из чата (SPA-безопасность)
        return () => {
            window.Echo.leaveChannel(`chat.${chat.id}`);
        };
    }, [chat.id]);

    const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        // Отправляем сообщение на бэкенд
        post(`/messages/${chat.id}`, {
            onSuccess: () => {
                reset('body'); // Очищаем поле ввода при успехе
                
                // Чтобы твое собственное отправленное сообщение появилось на экране СРАЗУ,
                // Inertia сделает redirect()->back() и обновит пропсы, 
                // которые наш первый useEffect автоматически положит в localMessages!
            }, 
            preserveScroll: true,
        });
    };

    return (
        <MainLayout>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[550px]">
                {/* 1. Шапка чата с кнопкой Назад */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50 shrink-0">
                    <Link href="/messages" className="text-blue-600 hover:underline text-sm font-medium">
                        ← Назад
                    </Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <h2 className="text-sm font-semibold text-gray-800 truncate">{chat.title}</h2>
                </div>

                {/* 2. Область сообщений (Читаем из localMessages вместо пропсов) */}
                <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-3 bg-gray-50/30">
                    {localMessages.length === 0 ? (
                        <div className="my-auto text-center text-gray-400 text-sm italic">
                            В этом чате пока нет сообщений. Напишите первое!
                        </div>
                    ) : (
                        localMessages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`flex gap-3 max-w-[70%] ${msg.is_me ? 'self-end flex-row-reverse' : 'self-start'}`}
                            >
                                {/* Маленькая аватарка */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${msg.is_me ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                    {msg.is_me ? '😎' : '💬'}
                                </div>

                                {/* Облако сообщения */}
                                <div className={`p-3 rounded-xl text-sm relative shadow-sm ${msg.is_me ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}`}>
                                    {chat.type === 'group' && !msg.is_me && (
                                        <div className="text-[11px] font-semibold text-blue-700 mb-0.5">
                                            {msg.sender_name}
                                        </div>
                                    )}
                                    <p className="leading-relaxed break-words pr-8">{msg.body}</p>
                                    <span className={`text-[10px] absolute bottom-1 right-2 ${msg.is_me ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {msg.date}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 3. Форма отправки сообщения (Нижняя панель) */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                        <input 
                            type="text" 
                            placeholder="Напишите сообщение..." 
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            className="flex-grow bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                            disabled={processing}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={processing || !data.body.trim()}
                            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Отправить
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default Show;
