import React, { useEffect, useRef, useState } from 'react'; // Добавили useState
import MainLayout from '../../Layouts/MainLayout';
import { useForm, Link, router } from '@inertiajs/react';

interface AttachmentProps {
    id: number;
    filename: string;
    type: 'photo' | 'audio' | 'video' | 'document';
    metadata: any;
    likes_count: number;
    liked_by_me: boolean;
    localUrl?: string;
}

interface MessageProps {
    id: number;
    body: string;
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    is_me: boolean;
    date: string;
    is_read?: boolean;
    attachments: AttachmentProps[]; // Заменили одиночные поля на массив вложений!
}

interface ChatProps {
    id: number;
    title: string;
    type: 'dialog' | 'group';
}

interface ShowProps {
    chat: ChatProps;
    messages: MessageProps[];
    current_user_id: number;
}

const Show: React.FC<ShowProps> = ({ chat, messages, current_user_id  }) => {
    // 1. ИНИЦИАЛИЗИРУЕМ ЛОКАЛЬНОЕ СОСТОЯНИЕ ДЛЯ СООБЩЕНИЙ
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [localMessages, setLocalMessages] = useState<MessageProps[]>(messages);
    const [editingMessage, setEditingMessage] = useState<MessageProps | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        body: '',
        chat_file: null as File | null, // Сюда будет падать бинарник файла
    });

    // Синхронизируем локальное состояние, если Inertia обновляет пропсы жестким переходом
    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    // Реф для автоматического скролла вниз при открытии чата или новом сообщении
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Теперь автоскролл следит за обновлением локального массива сообщений сокетов!
    // useEffect(() => {
    //     scrollToBottom();
    // }, [localMessages]);
    useEffect(() => {
        if (localMessages.length === 0) return;

        const container = scrollContainerRef.current;
        if (!container) return;

        // // ЕСЛИ ЭТО ПЕРВАЯ ЗАГРУЗКА ЧАТА:
        // // Железно мотаем вниз без лишних проверок автора и позиции скролла
        // if (isInitialLoad) {
        //     scrollToBottom();
        //     setIsInitialLoad(false); // Выключаем режим первой загрузки навсегда
        //     return;
        // }

                // ЕСЛИ ЭТО ПЕРВАЯ ЗАГРУЗКА ЧАТА:
        if (isInitialLoad) {
            // Ищем первое чужое непрочитанное сообщение в истории
            const firstUnreadMessage = localMessages.find(
                msg => !msg.is_me && msg.is_read === false
            );

            if (firstUnreadMessage) {
                // Если такое сообщение нашли — ищем его элемент в DOM
                const unreadElement = document.getElementById(`message-${firstUnreadMessage.id}`);
                if (unreadElement) {
                    // Плавно скроллим контейнер так, чтобы это сообщение встало по центру или сверху экрана
                    unreadElement.scrollIntoView({ behavior: 'auto', block: 'center' });
                    setIsInitialLoad(false);
                    return;
                }
            }

            // Если непрочитанных сообщений нет — просто мотаем в самый низ чата как обычно
            scrollToBottom();
            setIsInitialLoad(false);
            return;
        }

        // Достаем последнее сообщение из массива
        const lastMessage = localMessages[localMessages.length - 1];

        // Проверяем: это Я отправил сообщение?
        // Обрати внимание: для оптимистичного UI у нас id = Date.now(), а sender_id равен current_user_id
        const isMyMessage = lastMessage.sender_id === current_user_id;

        if (isMyMessage) {
            // Если сообщение моё — скроллим вниз железно и плавно
            scrollToBottom();
        } else {
            // Если сообщение прилетело от друга по сокету:
            // Считаем, находится ли пользователь внизу экрана (с погрешностью в 150 пикселей)
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            
            if (isAtBottom) {
                scrollToBottom();
            } else {
                console.log('Пользователь читает историю чата наверху, не срываем скролл.');
                // Тут в будущем можно поставить стейт для кнопки "У вас новое сообщение ↓"
            }
        }
    }, [localMessages, current_user_id]);


    // 2. ПОДКЛЮЧАЕМ ПРИВАТНЫЙ WebSocket-СЛУШАТЕЛЬ LARAVEL ECHO
    useEffect(() => {
        // Подключаемся строго к приватному каналу этого конкретного чата
        const channel = window.Echo.private(`chat.${chat.id}`);

            channel.listen('.message.sent', (e: { messageData: any }) => {
            console.log('По закрытому каналу прилетело новое сообщение:', e.messageData);
            
            setLocalMessages(prevMessages => {
                // Если сообщение с таким ID из базы данных уже есть в чате — ничего не делаем
                if (prevMessages.some(msg => msg.id === e.messageData.id)) {
                    return prevMessages;
                }

                const senderId = Number(e.messageData.sender.id);
                const myId = Number(current_user_id);
                const isItMe = senderId === myId;

                // Мапим структуру бэкенда под интерфейс твоего экрана
                const incomingMessage: MessageProps = {
                    id: e.messageData.id,
                    body: e.messageData.body,
                    sender_id: senderId,
                    sender_name: e.messageData.sender.full_name,
                    sender_avatar: e.messageData.sender.avatar_url, 
                    is_me: isItMe, // ТЕПЕРЬ ФЛАГ ВЫЧИСЛЯЕТСЯ ДИНАМИЧЕСКИ, А НЕ ЗАШИТ КАК FALSE!
                    date: 'Только что',
                    attachments: e.messageData.attachments || [], 
                };

                // ЗАЩИТА ОТ ДУБЛИРОВАНИЯ (Умное замещение):
                // Если сокет вернул НАШЕ СОБСТВЕННОЕ сообщение, ищем в стейте оптимистичный фейк
                if (isItMe) {
                    const optimisticIndex = prevMessages.findIndex(
                        msg => msg.id > 1000000000000 && msg.body === incomingMessage.body
                    );

                    if (optimisticIndex !== -1) {
                        // Точечно меняем фейковый ID на реальный ID из базы данных СТРОГО на его позиции
                        const updated = [...prevMessages];
                        updated[optimisticIndex] = incomingMessage;
                        return updated;
                    }
                }

                // Если это реальное сообщение от собеседника — пушим в конец истории
                return [...prevMessages, incomingMessage];
            });
        });


        // ДОБАВЛЯЕМ НОВОГО СЛУШАТЕЛЯ: Ловим удаление сообщений по сокетам
        channel.listen('.message.deleted', (e: { messageId: number }) => {
            console.log('Сокет поймал удаление сообщения:', e.messageId);
            setLocalMessages(prevMessages => prevMessages.filter(msg => msg.id !== e.messageId));
        });

        channel.listen('.message.updated', (e: { messageId: number; newBody: string }) => {
            console.log('Сокет поймал редактирование сообщения:', e.messageId);
            setLocalMessages(prevMessages => 
                prevMessages.map(msg => msg.id === e.messageId ? { ...msg, body: e.newBody } : msg)
            );
        });

        // При изменении ID чата взводим флаг первой загрузки, чтобы новый чат тоже открылся внизу
        setIsInitialLoad(true);

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

    // Вспомогательные функции для редактирования сообщения
    // Вход в режим редактирования (вызывается по клику на карандаш)
    const startEditMessage = (msg: MessageProps) => {
        setEditingMessage(msg);
        setData('body', msg.body); // Вставляем старый текст в инпут
    };

    // Выход из режима редактирования (клик на крестик отмены)
    const cancelEditMessage = () => {
        setEditingMessage(null);
        reset('body');
    };

    const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
        // КРИТИЧЕСКИ ВАЖНО: Эта строчка должна стоять на самом первом месте!
        // Она полностью отключает нативную перезагрузку HTML-страницы в Chrome и Firefox!
        e.preventDefault(); 

        if (editingMessage) {
            if (!data.body.trim()) return;

            const msgId = editingMessage.id;
            const updatedBody = data.body;

            // 1. Оптимистично обновляем буквы на экране у себя
            setLocalMessages(prevMessages => 
                prevMessages.map(msg => msg.id === msgId ? { ...msg, body: updatedBody } : msg)
            );
            
            console.log("before PUT via useForm, msgId: ", msgId);

            // 2. ИСПОЛЬЗУЕМ МЕТОД put ИЗ ХУКА useForm (вместо router.post)
            // Inertia сама под капотом упакует это в POST с маркером _method=PUT,
            // правильно обработает AJAX и предотвратит ЛЮБЫЕ перезагрузки страниц!
            put(`/messages/${msgId}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Очищаем стейты строго ПОСЛЕ успешного ответа сервера
                    setEditingMessage(null);
                    reset('body');
                    console.log("PUT request successfully finished");
                }
            });

            return; // Выходим из функции, чтобы не сработал код отправки нового сообщения
        }
        e.preventDefault();
        // Теперь отправка разрешена, если есть либо текст, либо прикрепленный файл!
        if (!data.body.trim() && !data.chat_file) return; 

        // 1. ОПТИМИСТИЧНЫЙ UI: Создаем фейковый объект твоего сообщения
        // и мгновенно выводим его на твой экран до отправки в Docker!
        const myOptimisticMessage: MessageProps = {
            id: Date.now(), // Временный уникальный ID
            body: data.body,
            sender_id: current_user_id || 51, // Твой ID (например, 1 для sergey)
            sender_name: 'Вы',
            sender_avatar: null, // Аватар подгрузится после F5, либо оставь пустой
            is_me: true, // Флаг, чтобы облачко сразу улетело вправо и стало синим!
            date: 'Только что',
            // Если прикреплен файл — имитируем его отображение на экране из локальной памяти браузера!
            attachments: data.chat_file ? [{
                id: Date.now() + 1,
                filename: '', // Пустой путь, так как сервер еще не сохранил файл
                type: data.chat_file.type.includes('image') ? 'photo' : 'document',
                metadata: { title: data.chat_file.name },
                likes_count: 0,
                liked_by_me: false,
                // ХАК ДЛЯ ПРЕВЬЮ: Создаем временную blob-ссылку, чтобы картинка загорелась у тебя в облачке мгновенно!
                localUrl: data.chat_file.type.includes('image') ? URL.createObjectURL(data.chat_file) : undefined
            } as any] : []
        };

        // Мгновенно пушим сообщение в историю на твоем экране (оно появится за 0 миллисекунд!)
        setLocalMessages(prevMessages => [...prevMessages, myOptimisticMessage]);

        // 2. Спокойно отправляем бинарник файла в фоновом режиме на бэкенд в Docker
        // post(`/messages/${chat.id}`, {
        //     onSuccess: () => {
        //         reset('body');
        //         setData('chat_file', null);
        //         setFileError(null);
        //         const fileInput = document.getElementById('chat-file-input') as HTMLInputElement;
        //         if (fileInput) fileInput.value = '';
        //     },
        //     preserveScroll: true,
        //     preserveState: true, // КРИТИЧЕСКИ ВАЖНО: Запрещает Inertia затирать стейт React старым кэшем!
        // });

        // 2. Смещаем отправку запроса Inertia в следующий цикл Event Loop,
        // давая React 19 время чисто и без лагов вывести синее облачко на экран за 0 миллисекунд
        setTimeout(() => {
            post(`/messages/${chat.id}`, {
                onSuccess: () => {
                    reset('body');
                    setData('chat_file', null);
                    setFileError(null);
                    const fileInput = document.getElementById('chat-file-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                },
                preserveScroll: true,
                preserveState: true,
            });
        }, 0); // Задержка 0 — это хак для управления приоритетами процессора
    };

    const handleDeleteMessage = (messageId: number) => {
        // Подтверждение удаления
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.');
        if (!isConfirmed) return;
        
        // Оптимистично стираем сообщение у себя на экране мгновенно
        setLocalMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));

        // Фоновый запрос на бэкенд в Docker
        router.delete(`/messages/${messageId}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <MainLayout>
            {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[550px]"> */}
            {/* 100dvh — это вся высота экрана, вычитаем 140px на шапку сайта и отступы */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[calc(100dvh-140px)] min-h-[400px]">

                {/* 1. Шапка чата с кнопкой Назад */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50 shrink-0">
                    <Link href="/messages" className="text-blue-600 hover:underline text-sm font-medium">
                        ← Назад
                    </Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <h2 className="text-sm font-semibold text-gray-800 truncate">{chat.title}</h2>
                </div>

                {/* 2. Область сообщений (Читаем из localMessages вместо пропсов) */}
                <div ref={scrollContainerRef} className="flex-grow p-5 overflow-y-auto flex flex-col gap-3 bg-gray-50/30">
                    {/* НАХОДИМ ЦИКЛ ВЫВОДА СООБЩЕНИЙ ВНУТРИ ОБЛАСТИ ИСТОРИИ ПЕРЕПИСКИ */}
                    {localMessages.map((msg, index) => {
                        const stableKey = msg.id > 1000000000000 ? `opt-${index}` : `db-${msg.id}`;

                        return (
                            <div 
                                key={msg.id} 
                                id={`message-${msg.id}`}
                                // group: позволяет дочерним элементам ловить наведение мыши (hover)
                                // flex-row-reverse: переворачивает строку для ТВОИХ сообщений (улетают вправо)
                                className={`flex items-start gap-2 max-w-[75%] group transition-all ${
                                    msg.is_me ? 'self-end flex-row-reverse' : 'self-start flex-row'
                                }`}
                            >
                                {/* 1. АВАТАРКА: Всегда аккуратный круг, не сжимается благодаря shrink-0 */}
                                <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center text-sm shrink-0 shadow-inner ${
                                    msg.is_me ? 'bg-blue-100' : 'bg-gray-200'
                                }`}>
                                    {msg.is_me ? (
                                        msg.sender_avatar ? <img src={msg.sender_avatar} alt="Я" className="w-full h-full object-cover" /> : '😎'
                                    ) : (
                                        msg.sender_avatar ? <img src={msg.sender_avatar} alt="Собеседник" className="w-full h-full object-cover" /> : '💬'
                                    )}
                                </div>

                                {/* 2. ОБЛАКО СООБЩЕНИЯ: Автоматически подстраивается под контент */}
                                {/* <div className={`p-3 rounded-xl text-sm relative shadow-sm max-w-full ${
                                    msg.is_me 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                                }`}>
                                    Имя отправителя для групповых чатов
                                    {chat.type === 'group' && !msg.is_me && (
                                        <div className="text-[11px] font-semibold text-blue-700 mb-1">
                                            {msg.sender_name}
                                        </div>
                                    )}
                                    
                                    Текст сообщения с отступом справа под время
                                    <p className="leading-relaxed break-words pr-10">{msg.body}</p>
                                    
                                    Вывод вложений (цикл .map вложений, который мы отладили ранее)
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-2">
                                            {msg.attachments.map(file => (
                                                <div key={file.id} className="w-full">
                                                    {file.type === 'photo' && file.filename && (
                                                        <div className="rounded-lg overflow-hidden border border-black/5 bg-black/5 p-1 max-w-xs">
                                                            <img 
                                                                src={file.localUrl ? file.localUrl : `/storage/${file.filename}`} 
                                                                alt="Вложение" 
                                                                className="max-w-full max-h-48 object-contain rounded-md" 
                                                            />
                                                        </div>
                                                    )}
                                                    {file.type === 'document' && file.filename && (
                                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-black/5 text-xs font-medium truncate max-w-xs">
                                                            <span>📄</span>
                                                            <a href={`/storage/${file.filename}`} target="_blank" rel="noreferrer" className="underline hover:text-blue-200 truncate">
                                                                Открыть документ
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    Метка времени в нижнем правом углу
                                    <span className={`text-[9px] absolute bottom-1 right-2 shrink-0 ${
                                        msg.is_me ? 'text-blue-200' : 'text-gray-400'
                                    }`}>
                                        {msg.date}
                                    </span>
                                </div> */}

                                <div className={`p-2.5 rounded-xl text-sm shadow-sm max-w-full min-w-[70px] flex flex-col justify-between ${
                                    msg.is_me 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                                }`}>
                                    {/* Имя отправителя для групповых чатов */}
                                    {chat.type === 'group' && !msg.is_me && (
                                        <div className="text-[11px] font-semibold text-blue-700 mb-1 shrink-0">
                                            {msg.sender_name}
                                        </div>
                                    )}
                                    
                                    {/* Контейнер для контента сообщения и времени в одну строку/блок */}
                                    <div className="flex flex-col w-full relative">
                                        {/* Текст сообщения без жестких правых отступов, переносится корректно */}
                                        <p className="leading-relaxed break-words pb-3">{msg.body}</p>
                                        
                                        {/* Вывод вложений (оставляем без изменений внутри структуры) */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-1 mb-3 flex flex-col gap-2 shrink-0">
                                                {msg.attachments.map(file => (
                                                    <div key={file.id} className="w-full">
                                                        {file.type === 'photo' && file.filename && (
                                                            <div className="rounded-lg overflow-hidden border border-black/5 bg-black/5 p-1 max-w-xs">
                                                                <img 
                                                                    src={file.localUrl ? file.localUrl : file.filename}
                                                                    alt="Вложение" 
                                                                    className="max-w-full max-h-48 object-contain rounded-md" 
                                                                />
                                                            </div>
                                                        )}
                                                        {file.type === 'document' && file.filename && (
                                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-black/5 text-xs font-medium truncate max-w-xs">
                                                                <span>📄</span>
                                                                <a href={file.filename} target="_blank" rel="noreferrer" className="underline hover:text-blue-200 truncate">
                                                                    Открыть документ
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Метка времени: теперь позиционируется аккуратно снизу справа, 
                                            не накладываясь на текст, благодаря pb-3 у параграфа выше */}
                                        <span className={`text-[9px] absolute -bottom-1.5 right-0 shrink-0 select-none ${
                                            msg.is_me ? 'text-blue-200' : 'text-gray-400'
                                        }`}>
                                            {msg.date}
                                        </span>
                                    </div>
                                </div>


                                {/* 3. КНОПКА УДАЛЕНИЯ (КОРЗИНА): */}
                                {/* Встает идеально рядом с облачком. Для твоих сообщений она будет СЛЕВА от текста благодаря flex-row-reverse */}
                                {msg.is_me && (
                                    <div className="opacity-0 group-hover:opacity-100" >
                                        <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            // opacity-0 group-hover:opacity-100: Кнопка скрыта и плавно проявляется только при наведении на элемент!
                                            className="transition-all duration-150 text-gray-400 hover:text-red-500 text-xs p-1.5 rounded-full hover:bg-gray-100 shrink-0 self-center"
                                            title="Удалить сообщение"
                                        >
                                            🗑️
                                        </button>
                                        <span>
                                            <button onClick={() => startEditMessage(msg)} className="text-gray-400 hover:text-blue-600 text-xs p-1 hover:bg-gray-100"
                                            title="Редактировать сообщение"    
                                            >
                                                ✏️
                                            </button>
                                        </span>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* 3. Форма отправки сообщения (Нижняя панель) */}
                {/* Заменяем блок формы отправки (Нижняя панель) */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex flex-col gap-2">
                    {editingMessage && (
                        <div className="flex justify-between bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-lg text-xs font-medium text-blue-700 mb-2">
                            <span>✏️ Редактирование: <span className="italic text-gray-500">"{editingMessage.body}"</span></span>
                            <button onClick={cancelEditMessage} className="text-blue-400 hover:text-blue-700 font-bold">✕</button>
                        </div>
                    )}
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
