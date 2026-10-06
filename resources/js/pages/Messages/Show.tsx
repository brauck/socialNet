import React, { useEffect, useRef, useState } from 'react'; // Добавили useState
import MainLayout from '../../Layouts/MainLayout';
import { useForm, Link } from '@inertiajs/react';

interface MessageProps {
    id: number;
    body: string;
    filename: string | null;
    file_type: string | null;
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
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
    const [fileError, setFileError] = useState<string | null>(null);

    const { data, setData, post, processing, reset } = useForm({
        body: '',
        chat_file: null as File | null, // Сюда будет падать бинарник файла
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
                    filename: e.messageData.filename,
                    file_type: e.messageData.file_type,
                    sender_id: e.messageData.sender.id,
                    sender_name: e.messageData.sender.full_name,
                    sender_avatar: e.messageData.sender.avatar_url,
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ХАК ДЛЯ TYPESCRIPT: Достаем строго первый файл [0] из коллекции FileList
        const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
        setFileError(null);

        if (file) {
            const maxSize = 20 * 1024 * 1024; // 20 МБ
            if (file.size > maxSize) {
                setFileError(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 20 МБ.`);
                setData('chat_file', null);
                e.target.value = '';
                return;
            }
            setData('chat_file', file);
        }
    };

    const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Теперь отправка разрешена, если есть либо текст, либо прикрепленный файл!
        if (!data.body.trim() && !data.chat_file) return; 

        post(`/messages/${chat.id}`, {
            onSuccess: () => {
                reset('body');
                setData('chat_file', null);
                setFileError(null);
                const fileInput = document.getElementById('chat-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
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
                                {/* Заменяем блок маленькой аватарки внутри localMessages.map */}
                                <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center text-sm shrink-0 shadow-inner ${msg.is_me ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                    {msg.is_me ? (
                                        // Для себя выводим аватарку из глобальных пропсов или заглушку. 
                                        // Но проще и чище брать msg.sender_avatar, если твой бэкенд прокидывает его и для тебя:
                                        msg.sender_avatar ? (
                                            <img src={msg.sender_avatar} alt="Я" className="w-full h-full object-cover" />
                                        ) : (
                                            '😎'
                                        )
                                    ) : (
                                        // Для собеседника выводим его реальную аватарку
                                        msg.sender_avatar ? (
                                            <img src={msg.sender_avatar} alt="Собеседник" className="w-full h-full object-cover" />
                                        ) : (
                                            '💬'
                                        )
                                    )}
                                </div>


                                {/* Облако сообщения */}
                                <div className={`p-3 rounded-xl text-sm relative shadow-sm ${msg.is_me ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}`}>
                                    {chat.type === 'group' && !msg.is_me && (
                                        <div className="text-[11px] font-semibold text-blue-700 mb-0.5">
                                            {msg.sender_name}
                                        </div>
                                    )}
                                    <p className="leading-relaxed break-words pr-8">{msg.body}</p>
                                    {/* НОВЫЙ БЛОК: Вывод прикрепленных изображений внутри облачка чата */}
                                    {msg.file_type === 'photo' && msg.filename && (
                                        <div className="mt-2 rounded-lg overflow-hidden max-w-xs border border-black/5 bg-black/5">
                                            <img src={`/storage/${msg.filename}`} alt="Фото" className="max-w-full max-h-60 object-contain rounded-md" />
                                        </div>
                                    )}

                                    {/* НОВЫЙ БЛОК: Вывод прикрепленных документов */}
                                    {msg.file_type === 'document' && msg.filename && (
                                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-black/5 text-xs font-medium max-w-xs truncate">
                                            <span>📄</span>
                                            <a href={`/storage/${msg.filename}`} target="_blank" rel="noreferrer" className="underline hover:text-blue-200 truncate">
                                                Открыть документ
                                            </a>
                                        </div>
                                    )}
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
                {/* Заменяем блок формы отправки (Нижняя панель) */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex flex-col gap-2">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                        
                        {/* Кнопка-скрепка прикрепления файлов */}
                        <div className="relative flex items-center justify-center shrink-0">
                            <label htmlFor="chat-file-input" className="cursor-pointer text-xl p-2 rounded-full hover:bg-gray-100 transition-colors" title="Прикрепить файл">
                                📎
                            </label>
                            <input 
                                id="chat-file-input" 
                                type="file" 
                                accept="image/*,.pdf,.zip,.docx" 
                                onChange={handleFileChange}
                                className="hidden" // Прячем стандартный некрасивый инпут
                                disabled={processing}
                            />
                        </div>

                        <input 
                            type="text" 
                            placeholder={data.chat_file ? `Файл прикреплен: ${data.chat_file.name}` : "Напишите сообщение..."} 
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            className="flex-grow bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                            disabled={processing}
                        />
                        <button 
                            type="submit" 
                            disabled={processing || (!data.body.trim() && !data.chat_file) || !!fileError}
                            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            Отправить
                        </button>
                    </form>

                    {/* Мгновенный вывод ошибки превышения 20 МБ без зависаний */}
                    {fileError && (
                        <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-md px-3 py-1 py-1.5 animate-fade-in">
                            ⚠️ {fileError}
                        </div>
                    )}
                </div>

            </div>
        </MainLayout>
    );
};

export default Show;
