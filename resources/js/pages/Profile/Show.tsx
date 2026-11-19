import { Head, Link, router } from '@inertiajs/react';
import React from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface UserProps {
    id: number;
    full_name: string;
    email: string | null;
    hometown: string;
    status: string;
    birthday: string;
    avatar_url: string | null;
}

interface ShowProps {
    user: UserProps;
    isMe: boolean;
    relationStatus: 'none' | 'outgoing' | 'incoming' | 'accepted';
    serverTime: string;
}

const Show: React.FC<ShowProps> = ({ user, isMe, relationStatus, serverTime }) => {
    const handleWriteMessage = () => {
        router.post('/chats/dialog', { interlocutor_id: user.id });
    };

    const handleSendRequest = () => {
        router.post(`/friends/request/${user.id}`, {}, { preserveScroll: true });
    };

    const handleAcceptRequest = () => {
        router.post(`/friends/accept/${user.id}`, {}, { preserveScroll: true });
    };

    const handleRemoveFriend = () => {
        router.delete(`/friends/${user.id}`, { preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title={isMe ? 'Моя страница' : user.full_name} />
            <div className="bg-white p-6 rounded-lg border border-[#dce1e6] shadow-sm">
                {/* Верхний блок: Аватарка, Имя и Кнопки действий */}
                <div className="flex gap-5 items-start mb-5">
                    <div className="w-24 h-24 rounded-full bg-[#f2f3f5] border border-[#dce1e6] overflow-hidden flex items-center justify-center text-4xl shrink-0">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                            '👨‍💻'
                        )}
                    </div>

                    <div className="grow min-w-0">
                        <div className="flex justify-between items-start gap-3">
                            <h1 className="text-black text-xl font-medium truncate">
                                {user.full_name}
                            </h1>

                            {/* Блок кнопок в зависимости от того, свой это профиль или чужой */}
                            <div className="flex gap-2 shrink-0">
                                {isMe ? (
                                    <Link href="/profile/edit" className="btn-secondary text-[#2a5885]!">
                                        Редактировать
                                    </Link>
                                ) : (
                                    <>
                                        <button onClick={handleWriteMessage} className="btn-primary">
                                            Написать сообщение
                                        </button>

                                        {relationStatus === 'none' && (
                                            <button onClick={handleSendRequest} className="btn-secondary">
                                                Добавить в друзья
                                            </button>
                                        )}
                                        {relationStatus === 'outgoing' && (
                                            <button onClick={handleRemoveFriend} className="btn-secondary" title="Нажмите, чтобы отписаться">
                                                Вы подписаны
                                            </button>
                                        )}
                                        {relationStatus === 'incoming' && (
                                            <button onClick={handleAcceptRequest} className="btn-primary">
                                                Принять заявку
                                            </button>
                                        )}
                                        {relationStatus === 'accepted' && (
                                            <button onClick={handleRemoveFriend} className="btn-secondary">
                                                У вас в друзьях
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Статус пользователя */}
                        <p className="text-[#65676b] mt-2 text-[13px] border-l-2 border-[#4c75a3] pl-2 truncate">
                            {user.status || (isMe ? 'Изменить статус' : 'Статус не указан')}
                        </p>
                    </div>
                </div>

                {/* Подробная информация профиля */}
                <div className="flex flex-col gap-3 text-[13px] border-t border-[#f0f2f5] pt-4">
                    <div>
                        <span className="text-[#828282] w-32 inline-block">Родной город:</span>
                        <span className="text-[#2a5885]">{user.hometown}</span>
                    </div>
                    <div>
                        <span className="text-[#828282] w-32 inline-block">День рождения:</span>
                        <span className="text-[#2a5885]">{user.birthday}</span>
                    </div>
                    {isMe && user.email && (
                        <div>
                            <span className="text-[#828282] w-32 inline-block">Email:</span>
                            <span>{user.email}</span>
                        </div>
                    )}
                </div>

                <div className="mt-7 text-[11px] text-[#939393] text-right">
                    socialNet Engine v1.0 | {serverTime}
                </div>
            </div>
        </MainLayout>
    );
};

export default Show;
