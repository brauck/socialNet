// import React from 'react';
// import MainLayout from '../../Layouts/MainLayout';
// import { router } from '@inertiajs/react';

// interface PostProps {
//     id: number;
//     body: string | null;
//     filename: string;
//     size: number;
//     type: 'photo' | 'video' | 'audio' | 'document';
//     metadata: any;
//     likes_count: number;
//     liked_by_me: boolean;
//     author: {
//         id: number;
//         full_name: string;
//     };
//     date: string;
// }

// interface IndexProps {
//     posts: PostProps[];
// }

// const Index: React.FC<IndexProps> = ({ posts }) => {
    
//     // Функция отправки лайка на бэкенд
//     const handleLike = (postId: number) => {
//         router.post(`/news/${postId}/like`, {}, {
//             preserveScroll: true, // КРИТИЧЕСКИ ВАЖНО: страница не будет прыгать вверх при лайке!
//         });
//     };

//     return (
//         <MainLayout>
//             <div className="flex flex-col gap-4">
//                 {posts.map(post => (
//                     <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
//                         {/* Шапка поста (Автор и дата) */}
//                         <div className="flex items-center gap-3 mb-3">
//                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
//                                 🧑‍💻
//                             </div>
//                             <div>
//                                 <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
//                                     {post.author.full_name}
//                                 </div>
//                                 <div className="text-xs text-gray-400 mt-0.5">{post.date}</div>
//                             </div>
//                         </div>

//                         {/* Текст поста */}
//                         {post.body && <p className="text-sm text-gray-900 mb-4 leading-relaxed">{post.body}</p>}

//                         {/* Специфичный контент на основе JSON-метаданных (VK стиль) */}
//                         <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 text-sm">
//                             {post.type === 'photo' && (
//                                 <div className="flex flex-col gap-1 text-gray-700">
//                                     <div className="text-xl">📸 Фотография</div>
//                                     <div className="text-xs text-gray-400 mt-1">Путь: {post.filename}</div>
//                                     <div className="text-xs text-gray-500 mt-1">
//                                         Камера: {post.metadata?.camera} · Разрешение: {post.metadata?.width}x{post.metadata?.height}
//                                     </div>
//                                 </div>
//                             )}

//                             {post.type === 'audio' && (
//                                 <div className="flex items-center gap-3">
//                                     <div className="text-2xl">🎵</div>
//                                     <div>
//                                         <div className="font-semibold text-gray-900">{post.metadata?.artist}</div>
//                                         <div className="text-xs text-gray-500 mt-0.5">{post.metadata?.title}</div>
//                                         <div className="text-[11px] text-gray-400 mt-1">
//                                             Длительность: {Math.floor((post.metadata?.duration_seconds || 0) / 60)} мин · {post.metadata?.bitrate} kbps
//                                         </div>
//                                     </div>
//                                 </div>
//                             )}

//                             {post.type === 'video' && (
//                                 <div className="flex flex-col gap-1 text-gray-700">
//                                     <div className="text-xl">🎥 Видеозапись</div>
//                                     <div className="text-xs text-gray-500 mt-1">
//                                         Качество: {post.metadata?.resolution} · Кодек: {post.metadata?.codec} · Длина: {Math.floor((post.metadata?.duration_seconds || 0) / 60)} мин
//                                     </div>
//                                 </div>
//                             )}

//                             {post.type === 'document' && (
//                                 <div className="flex items-center gap-3">
//                                     <div className="text-2xl">📄</div>
//                                     <div>
//                                         <div className="font-medium text-blue-700 hover:underline cursor-pointer truncate max-w-md">
//                                             {post.filename.split('/').pop()}
//                                         </div>
//                                         <div className="text-xs text-gray-400 mt-0.5">
//                                             Расширение: .{post.metadata?.extension} · Размер: {(post.size / 1024 / 1024).toFixed(2)} Мб
//                                         </div>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Нижняя панель (Кнопка лайка в стиле VK) */}
//                         <div className="flex items-center border-t border-gray-50 pt-3">
//                             <button 
//                                 onClick={() => handleLike(post.id)}
//                                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${post.liked_by_me ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
//                             >
//                                 <span className="text-sm">{post.liked_by_me ? '❤️' : '🤍'}</span>
//                                 <span>{post.likes_count}</span>
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </MainLayout>
//     );
// };

// export default Index;

// import React, { useState, useEffect } from 'react';
// import MainLayout from '../../Layouts/MainLayout';
// import { router } from '@inertiajs/react';

// interface PostProps {
//     id: number;
//     body: string | null;
//     filename: string;
//     size: number;
//     type: 'photo' | 'video' | 'audio' | 'document';
//     metadata: any;
//     likes_count: number;
//     liked_by_me: boolean;
//     author: { id: number; full_name: string; };
//     date: string;
// }

// interface IndexProps {
//     posts: PostProps[];
// }

// const Index: React.FC<IndexProps> = ({ posts }) => {
//     // Переносим массив постов в локальное состояние React для мгновенных изменений
//     const [localPosts, setLocalPosts] = useState<PostProps[]>(posts);

//     // Синхронизируем локальное состояние, если пропсы обновятся с бэкенда
//     useEffect(() => {
//         setLocalPosts(posts);
//     }, [posts]);

//     const handleLike = (postId: number) => {
//         // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: Меняем интерфейс мгновенно в памяти браузера
//         setLocalPosts(prevPosts => 
//             prevPosts.map(post => {
//                 if (post.id === postId) {
//                     return {
//                         ...post,
//                         liked_by_me: !post.liked_by_me,
//                         likes_count: post.liked_by_me ? post.likes_count - 1 : post.likes_count + 1
//                     };
//                 }
//                 return post;
//             })
//         );

//         // 2. Отправляем фоновый запрос на сервер Docker для синхронизации с PostgreSQL
//         router.post(`/news/${postId}/like`, {}, {
//             preserveScroll: true,
//             preserveState: true, // Сохраняем локальное состояние React во время запроса
//         });
//     };

//     return (
//         <MainLayout>
//             <div className="flex flex-col gap-4">
//                 {localPosts.map(post => (
//                     <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
//                         {/* Шапка поста */}
//                         <div className="flex items-center gap-3 mb-3">
//                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">🧑‍💻</div>
//                             <div>
//                                 <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
//                                     {post.author.full_name}
//                                 </div>
//                                 <div className="text-xs text-gray-400 mt-0.5">{post.date}</div>
//                             </div>
//                         </div>

//                         {/* Текст поста */}
//                         {post.body && <p className="text-sm text-gray-900 mb-4 leading-relaxed">{post.body}</p>}

//                         {/* Контент на основе метаданных JSON */}
//                         <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 text-sm">
//                             {post.type === 'photo' && (
//                                 <div className="flex flex-col gap-1 text-gray-700">
//                                     <div className="text-xl">📸 Фотография</div>
//                                     <div className="text-xs text-gray-500 mt-1">
//                                         Камера: {post.metadata?.camera} · Разрешение: {post.metadata?.width}x{post.metadata?.height}
//                                     </div>
//                                 </div>
//                             )}

//                             {post.type === 'audio' && (
//                                 <div className="flex items-center gap-3">
//                                     <div className="text-2xl">🎵</div>
//                                     <div>
//                                         <div className="font-semibold text-gray-900">{post.metadata?.artist}</div>
//                                         <div className="text-xs text-gray-500 mt-0.5">{post.metadata?.title}</div>
//                                     </div>
//                                 </div>
//                             )}

//                             {post.type === 'video' && (
//                                 <div className="flex flex-col gap-1 text-gray-700">
//                                     <div className="text-xl">🎥 Видеозапись</div>
//                                     <div className="text-xs text-gray-500 mt-1">Качество: {post.metadata?.resolution}</div>
//                                 </div>
//                             )}

//                             {post.type === 'document' && (
//                                 <div className="flex items-center gap-3">
//                                     <div className="text-2xl">📄</div>
//                                     <div>
//                                         <div className="font-medium text-blue-700 truncate max-w-md">{post.filename.split('/').pop()}</div>
//                                         <div className="text-xs text-gray-400 mt-0.5">Размер: {(post.size / 1024 / 1024).toFixed(2)} Мб</div>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Кнопка лайка */}
//                         <div className="flex items-center border-t border-gray-50 pt-3">
//                             <button 
//                                 onClick={() => handleLike(post.id)}
//                                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${post.liked_by_me ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
//                             >
//                                 <span className="text-sm">{post.liked_by_me ? '❤️' : '🤍'}</span>
//                                 <span>{post.likes_count}</span>
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </MainLayout>
//     );
// };

// export default Index;

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
    author: { id: number; full_name: string; };
    date: string;
}

interface IndexProps {
    posts: PostProps[];
}

const Index: React.FC<IndexProps> = ({ posts }) => {
    const [localPosts, setLocalPosts] = useState<PostProps[]>(posts);

    // Инициализируем форму создания поста через хук Inertia
    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
        media_type: 'none', // По умолчанию без вложений
    });

    useEffect(() => {
        setLocalPosts(posts);
    }, [posts]);

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
    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        post('/news', {
            onSuccess: () => {
                reset('body', 'media_type'); // Очищаем форму при успешном создании
            },
            preserveScroll: true,
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
                        {data.body && (
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
                        )}
                    </form>
                </div>

                {/* ВЫВОД ЛЕНТЫ ПОСТОВ */}
                {localPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                        {/* Шапка поста */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">🧑‍💻</div>
                            <div>
                                <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                                    {post.author.full_name}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{post.date}</div>
                            </div>
                        </div>

                        {/* Текст поста */}
                        {post.body && <p className="text-sm text-gray-900 mb-4 leading-relaxed">{post.body}</p>}

                        {/* Контент на основе метаданных JSON */}
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 text-sm">
                            {post.type === 'photo' && (
                                <div className="flex flex-col gap-1 text-gray-700">
                                    <div className="text-sm font-semibold text-gray-800">📸 Фотография</div>
                                    <div className="text-xs text-gray-400 mt-1">Камера: {post.metadata?.camera} · Разрешение: {post.metadata?.width}x{post.metadata?.height}</div>
                                </div>
                            )}

                            {post.type === 'audio' && (
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">🎵</div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{post.metadata?.artist || 'Неизвестный исполнитель'}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{post.metadata?.title}</div>
                                    </div>
                                </div>
                            )}

                            {post.type === 'video' && (
                                <div className="flex flex-col gap-1 text-gray-700">
                                    <div className="text-sm font-semibold text-gray-800">🎥 Видеозапись</div>
                                    <div className="text-xs text-gray-500 mt-1">Качество: {post.metadata?.resolution} · Длина: {Math.floor((post.metadata?.duration_seconds || 0) / 60)} мин</div>
                                </div>
                            )}

                            {post.type === 'document' && (
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📄</div>
                                    <div>
                                        <div className="font-medium text-blue-700 truncate max-w-md">{post.filename.split('/').pop()}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Размер: {(post.size / 1024 / 1024).toFixed(2)} Мб</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Кнопка лайка */}
                        <div className="flex items-center border-t border-gray-50 pt-3">
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
