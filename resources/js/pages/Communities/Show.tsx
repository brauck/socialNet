import { Head, Link, router } from '@inertiajs/react';
import React from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface CommunityDetailProps {
    id: number;
    name: string;
    slug: string;
    type: 'group' | 'public' | 'event';
    description: string | null;
    avatar_url: string | null;
    members_count: number;
    creator_name: string;
    is_member: boolean;
    is_creator: boolean;
}

interface ShowProps {
    community: CommunityDetailProps;
}

const Show: React.FC<ShowProps> = ({ community }) => {
    const formatType = (type: string) => {
        if (type === 'public') return 'Публичная страница';
        if (type === 'group') return 'Группа';
        return 'Мероприятие';
    };

    const handleJoin = () => {
        router.post(`/communities/${community.id}/join`, {}, { preserveScroll: true });
    };

    const handleLeave = () => {
        router.delete(`/communities/${community.id}/leave`, { preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title={community.name} />
            <div className="bg-white p-6 rounded-lg border border-[#dce1e6] shadow-sm">
                <div className="mb-4">
                    <Link href="/communities" className="text-xs text-blue-700 hover:underline">
                        ← Вернуться к списку сообществ
                    </Link>
                </div>

                {/* Шапка сообщества */}
                <div className="flex gap-5 items-start mb-5">
                    <div className="w-24 h-24 rounded-full bg-[#f2f3f5] border border-[#dce1e6] overflow-hidden flex items-center justify-center text-4xl shrink-0">
                        {community.avatar_url ? (
                            <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                        ) : (
                            '👥'
                        )}
                    </div>

                    <div className="grow min-w-0">
                        <div className="flex justify-between items-start gap-3">
                            <div>
                                <h1 className="text-black text-xl font-medium truncate">
                                    {community.name}
                                </h1>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatType(community.type)} · {community.members_count} участников
                                </div>
                            </div>

                            <div className="shrink-0">
                                {community.is_creator ? (
                                    <span className="btn-secondary inline-block cursor-default!">
                                        Вы администратор
                                    </span>
                                ) : community.is_member ? (
                                    <button onClick={handleLeave} className="btn-secondary">
                                        Вы подписаны
                                    </button>
                                ) : (
                                    <button onClick={handleJoin} className="btn-primary">
                                        Подписаться
                                    </button>
                                )}
                            </div>
                        </div>

                        {community.description && (
                            <p className="text-gray-700 mt-3 text-[13px] leading-relaxed border-t border-gray-100 pt-3">
                                {community.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 flex justify-between">
                    <span>Создатель: {community.creator_name}</span>
                    <span>Адрес: /communities/{community.slug}</span>
                </div>
            </div>
        </MainLayout>
    );
};

export default Show;
