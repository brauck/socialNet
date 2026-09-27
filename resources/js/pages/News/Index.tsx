import React, { useState, useEffect } from 'react';
import MainLayout from '../../Layouts/MainLayout';
import { router, useForm } from '@inertiajs/react'; // Добавляем импорт useForm

interface PostProps {
    id: number;
    body: string | null;
    filename: string;
    size: number;
    type: 'photo' | 'video' | 'audio' | 'document';
    metadata: any;
    likes_count: number;
    liked_by_me: boolean;
    author: {
        id: number;
        full_name: string;
        avatar_url: string | null;
    };
    date: string;
}

interface IndexProps {
    posts: PostProps[];
    current_user_id: number;
}

const Index: React.FC<IndexProps> = ({ posts, current_user_id }) => {
    const [localPosts, setLocalPosts] = useState<PostProps[]>(posts);
    const [fileError, setFileError] = useState<string | null>(null);

    // Инициализируем форму создания поста через хук Inertia
    // const { data, setData, post, processing, reset, errors } = useForm({
    //     body: '',
    //     media_type: 'none', // По умолчанию без вложений
    // });
    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
        media_file: null as File | null, // Сюда будет падать реальный файл
    });

    useEffect(() => {
        setLocalPosts(posts);
    }, [posts]);

    useEffect(() => {
        // Подключаемся к публичному каналу 'news'
        const channel = window.Echo.channel('news');
        
        //window.Echo.channel('news')
        // Слушаем событие 'media.liked' (обязательно с ведущей точкой!)
        channel.listen('.media.liked', (e: { mediaId: number; likesCount: number }) => {
            console.log('Real-time сокет поймал лайк:', e);
            
            // Находим нужный пост в локальном состоянии React и обновляем ему счетчик
            setLocalPosts(prevPosts => 
                prevPosts.map(post => {
                    if (post.id === e.mediaId) {
                        return {
                            ...post,
                            likes_count: e.likesCount
                        };
                    }
                    return post;
                })
            );
        });

        // Ловим новые посты по воздуху
        channel.listen('.post.published', (e: { post: PostProps }) => {
            console.log('Real-time сокет поймал новую публикацию постов:', e.post);
            
            // Добавляем свежий прилетевший пост в САМОЕ НАЧАЛО массива (в самый верх ленты новостей)
            setLocalPosts(prevPosts => [e.post, ...prevPosts]);
        });

        // Удаление постов по сокетам
        channel.listen('.post.deleted', (e: { postId: number }) => {
            console.log('Real-time сокет поймал удаление поста:', e.postId);
            
            // Фильтруем массив и убираем удаленный пост из ленты у других пользователей
            setLocalPosts(prevPosts => prevPosts.filter(post => post.id !== e.postId));
        });

        // Очистка при уходе со страницы, чтобы не плодить утечки памяти в SPA-режиме
        return () => {
            window.Echo.leaveChannel('news');
        };
    }, []);


    const handleLike = (postId: number) => {
        setLocalPosts(prevPosts => 
            prevPosts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        liked_by_me: !post.liked_by_me,
                        likes_count: post.liked_by_me ? post.likes_count - 1 : post.likes_count + 1
                    };
                }
                return post;
            })
        );

        router.post(`/news/${postId}/like`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Функция отправки нового поста
    // const handleCreatePost = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!data.body.trim()) return;

    //     post('/news', {
    //         onSuccess: () => {
    //             reset('body', 'media_type'); // Очищаем форму при успешном создании
    //         },
    //         preserveScroll: true,
    //     });
    // };
    const handleCreatePost = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        post('/news', {
            onSuccess: () => {
                reset('body');
                setData('media_file', null); // Чистим файл в стейте вручную
                setFileError(null); // Очищаем ошибку
                // Сбрасываем значение самого инпута в DOM, если нужно
                const fileInput = document.getElementById('news-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
            preserveScroll: true,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setFileError(null); // Сбрасываем старую ошибку

        if (file) {
            const maxSize = 20 * 1024 * 1024; // 20 МБ в байтах
            
            if (file.size > maxSize) {
                setFileError(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимальный размер — 20 МБ.`);
                setData('media_file', null); // Не записываем битый файл в форму
                e.target.value = ''; // Сбрасываем значение самого инпута в DOM
                return;
            }

            // Если файл прошел валидацию — сохраняем его в форму Inertia
            setData('media_file', file);
        }
    };

    const handleDeletePost = (postId: number) => {
        // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: Стираем пост с экрана у себя дома мгновенно
        setLocalPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

        // 2. Фоновый запрос на сервер в Docker
        router.delete(`/news/${postId}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                
                {/* БЛОК ФОРМЫ: «Что у вас нового?» в стиле VK */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                        <textarea
                            placeholder="Что у вас нового?"
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}                         
                            rows={data.body ? 3 : 1}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all resize-none text-gray-900 placeholder-gray-400"
                            disabled={processing}
                            required
                        />
                        {errors.body && <div className="text-xs text-red-600 px-1">{errors.body}</div>}

                        {/* Панель инструментов: показывается, когда пользователь начал писать текст */}
                        {/* {data.body && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50 animated fadeIn">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>📎 Прикрепить:</span>
                                    <select
                                        value={data.media_type}
                                        onChange={e => setData('media_type', e.target.value)}
                                        className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer font-medium"
                                    >
                                        <option value="none">Только текст</option>
                                        <option value="photo">📸 Фотографию</option>
                                        <option value="audio">🎵 Аудиозапись</option>
                                        <option value="video">🎥 Видеозапись</option>
                                        <option value="document">📄 Документ</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.body.trim()}
                                    className="bg-blue-600 text-white px-5 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Публикация...' : 'Опубликовать'}
                                </button>
                            </div>
                        )} */}
                        {data.body && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>📎 Прикрепить файл:</span>
                                    <input
                                        id="news-file-input"
                                        type="file"
                                        accept="image/*,audio/*,video/*,.pdf,.zip,.docx"
                                        // onChange={e => setData('media_file', e.target.files ? e.target.files[0] : null)}
                                        onChange={handleFileChange}
                                        className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        disabled={processing}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.body.trim() || !!fileError}
                                    className="bg-blue-600 text-white px-5 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Публикация...' : 'Опубликовать'}
                                </button>
                            </div>                            
                        )}
                        {/* НОВЫЙ БЛОК: Мгновенный вывод ошибки размера файла */}

                        {fileError && (
                            <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-md px-3 py-1.5 animated fadeIn">
                                ⚠️ {fileError}
                            </div>
                        )}
                    </form>
                </div>

                {/* ВЫВОД ЛЕНТЫ ПОСТОВ */}
                {localPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
                        
                        {/* 1. СТРОКА ПЕРВАЯ: Аватар и имя — в начале, кнопка удаления — строго в самом конце */}
                        <div className="flex justify-between items-center w-full">
                            {/* Блок автора (Аватар + Имя + Дата) */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 border border-gray-100 rounded-full overflow-hidden flex items-center justify-center text-lg shrink-0 shadow-inner">
                                    {post.author.avatar_url ? (
                                        <img src={post.author.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
                                    ) : (
                                        '💁‍♂️'
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                                        {post.author.full_name}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{post.date}</div>
                                </div>
                            </div>

                            {/* Кнопка удаления (Появится в самом конце строки благодаря flex justify-between) */}
                            {post.author.id === current_user_id && (
                                <button 
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-gray-400 hover:text-red-500 text-sm p-1.5 rounded-md hover:bg-gray-50 transition-colors shrink-0"
                                    title="Удалить публикацию"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Текст поста (если есть) */}
                        {post.body && <p className="text-sm text-gray-900 leading-relaxed">{post.body}</p>}

                        {/* 2. СТРОКА ВТОРАЯ: Картинка отображается ПОЛНОСТЬЮ, без обрезания и без растягивания на всю ширину */}
                        {/* max-h-[500px] защищает ленту от слишком длинных картинок, а object-contain сохраняет пропорции */}
                        {post.type === 'photo' && post.filename && (
                            <div className="w-full bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden p-2">
                                <img 
                                    src={`/storage/${post.filename}`} 
                                    alt="Медиаконтент" 
                                    className="max-w-full max-h-[500px] object-contain rounded-md" 
                                />
                            </div>
                        )}

                        {/* Отображение других типов файлов (Аудио, Видео, Документы — оставляем без изменений) */}
                        {post.type !== 'photo' && post.type !== 'document' && (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm">
                                {/* Твой существующий код для аудио/видео */}
                                {post.type === 'audio' && <div>🎵 {post.metadata?.artist} — {post.metadata?.title}</div>}
                                {post.type === 'video' && <div>🎥 Видеозапись ({post.metadata?.resolution})</div>}
                            </div>
                        )}

                        {/* 3. СТРОКА ТРЕТЬЯ: Лайк в самом низу карточки */}
                        <div className="border-t border-gray-100 pt-3 flex items-center">
                            <button 
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${post.liked_by_me ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <span className="text-sm">{post.liked_by_me ? '❤️' : '🤍'}</span>
                                <span>{post.likes_count}</span>
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </MainLayout>
    );
};

export default Index;
