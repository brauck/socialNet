import { Head, Link, router, useForm, useRemember } from '@inertiajs/react';
import React, { useState } from 'react';
import MainLayout from '../../Layouts/MainLayout';

interface CommunityProps {
    id: number;
    name: string;
    slug: string;
    type: 'group' | 'public' | 'event';
    description: string | null;
    avatar_url: string | null;
    members_count: number;
    is_member: boolean;
    is_creator: boolean;
}

interface IndexProps {
    myCommunities: CommunityProps[];
    allCommunities: CommunityProps[];
}

const Index: React.FC<IndexProps> = ({ myCommunities, allCommunities }) => {
    const [activeTab, setActiveTab] = useRemember<'my' | 'all'>('my', 'Communities/ActiveTab');
    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        type: 'public' as 'group' | 'public' | 'event',
        description: '',
    });

    const formatType = (type: string) => {
        if (type === 'public') return 'Публичная страница';
        if (type === 'group') return 'Группа';
        return 'Мероприятие';
    };

    const currentCommunities = activeTab === 'my' ? myCommunities : allCommunities;

    const handleCreateSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!data.name.trim()) return;

        post('/communities', {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            },
        });
    };

    const handleJoin = (id: number) => {
        router.post(`/communities/${id}/join`, {}, { preserveScroll: true });
    };

    const handleLeave = (id: number) => {
        router.delete(`/communities/${id}/leave`, { preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title="Сообщества" />
            <div className="page-card">
                {/* Фиксированная шапка с вкладками и кнопкой создания */}
                <div className="px-5 pt-3.5 border-b border-gray-100 bg-gray-50 shrink-0 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-5">
                            <button
                                onClick={() => setActiveTab('my')}
                                data-active={activeTab === 'my'}
                                className="tab-item"
                            >
                                Мои сообщества ({myCommunities.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                data-active={activeTab === 'all'}
                                className="tab-item"
                            >
                                Все сообщества ({allCommunities.length})
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setIsCreating(!isCreating);
                                if (isCreating) reset();
                            }}
                            className={`mb-2 ${isCreating ? 'btn-secondary' : 'btn-primary'}`}
                        >
                            {isCreating ? '✕ Отмена' : '+ Создать сообщество'}
                        </button>
                    </div>

                    {/* Разворачивающаяся форма создания сообщества */}
                    {isCreating && (
                        <form onSubmit={handleCreateSubmit} className="border-t border-gray-200 pt-3 pb-4 flex flex-col gap-3">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Название сообщества..."
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="grow bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-400"
                                    disabled={processing}
                                    required
                                />
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value as 'group' | 'public' | 'event')}
                                    className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
                                    disabled={processing}
                                >
                                    <option value="public">Публичная страница</option>
                                    <option value="group">Группа</option>
                                    <option value="event">Мероприятие</option>
                                </select>
                            </div>
                            {errors.name && <span className="text-[11px] text-red-600">{errors.name}</span>}

                            <textarea
                                placeholder="Краткое описание (необязательно)..."
                                rows={2}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
                                disabled={processing}
                            />

                            <button
                                type="submit"
                                disabled={processing || !data.name.trim()}
                                className="btn-primary self-end"
                            >
                                {processing ? 'Создание...' : 'Создать'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Прокручиваемый список сообществ */}
                <div className="flex flex-col grow overflow-y-auto px-5">
                    {currentCommunities.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                            {activeTab === 'my' ? 'Вы пока не состоите ни в одном сообществе.' : 'Сообщества ещё не созданы.'}
                        </div>
                    ) : (
                        currentCommunities.map((community) => (
                            <div key={community.id} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                                <Link
                                    href={`/communities/${community.slug}`}
                                    className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-xl shrink-0"
                                >
                                    {community.avatar_url ? (
                                        <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                                    ) : (
                                        '👥'
                                    )}
                                </Link>

                                <div className="grow min-w-0">
                                    <Link
                                        href={`/communities/${community.slug}`}
                                        className="text-sm font-semibold text-blue-800 hover:underline truncate block"
                                    >
                                        {community.name}
                                    </Link>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {formatType(community.type)} · {community.members_count} участников
                                    </div>
                                    {community.description && (
                                        <div className="text-xs text-gray-700 mt-1 line-clamp-2">
                                            {community.description}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    {community.is_creator ? (
                                        <span className="text-xs text-gray-400 font-medium px-3 py-1.5">
                                            Вы создатель
                                        </span>
                                    ) : community.is_member ? (
                                        <button onClick={() => handleLeave(community.id)} className="btn-secondary">
                                            Выйти
                                        </button>
                                    ) : (
                                        <button onClick={() => handleJoin(community.id)} className="btn-primary">
                                            Подписаться
                                        </button>
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
