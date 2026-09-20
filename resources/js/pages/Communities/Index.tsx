import React, { useState } from 'react';
import MainLayout from '../../Layouts/MainLayout';

// Описываем тип данных сообщества, прилетающих из PostgreSQL
interface CommunityProps {
    id: number;
    name: string;
    slug: string;
    type: 'group' | 'public' | 'event';
    description: string | null;
    avatar_url: string | null;
    members_count: number; // Поле из withCount('members')
}

interface IndexProps {
    myCommunities: CommunityProps[];
    allCommunities: CommunityProps[];
}

const Index: React.FC<IndexProps> = ({ myCommunities, allCommunities }) => {
    // Состояние для управления активной вкладкой: 'my' или 'all'
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // Хелпер для красивого перевода типов сообществ в стиле VK
    const formatType = (type: string) => {
        if (type === 'public') return 'Публичная страница';
        if (type === 'group') return 'Группа';
        return 'Мероприятие';
    };

    const currentCommunities = activeTab === 'my' ? myCommunities : allCommunities;

    return (
        <MainLayout>
            <div style={containerStyle}>
                {/* 1. Панель переключения вкладок (В стиле VK) */}
                <div style={tabsContainerStyle}>
                    <button 
                        onClick={() => setActiveTab('my')}
                        style={{ ...tabButtonStyle, borderBottom: activeTab === 'my' ? '2px solid #4c75a3' : 'none', color: activeTab === 'my' ? '#000' : '#555' }}
                    >
                        Мои сообщества ({myCommunities.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('all')}
                        style={{ ...tabButtonStyle, borderBottom: activeTab === 'all' ? '2px solid #4c75a3' : 'none', color: activeTab === 'all' ? '#000' : '#555' }}
                    >
                        Все сообщества ({allCommunities.length})
                    </button>
                </div>

                {/* 2. Список сообществ */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {currentCommunities.length === 0 ? (
                        <div style={emptyStateStyle}>Вы пока не состоите ни в одном сообществе.</div>
                    ) : (
                        currentCommunities.map(community => (
                            <div key={community.id} style={communityRowStyle}>
                                {/* Заглушка аватарки в стиле пабликов VK */}
                                <div style={avatarPlaceholderStyle}>👥</div>
                                
                                <div style={{ flexGrow: 1 }}>
                                    <div style={nameStyle}>{community.name}</div>
                                    <div style={metaStyle}>
                                        {formatType(community.type)} · {community.members_count} участников
                                    </div>
                                    {community.description && (
                                        <div style={descStyle}>{community.description}</div>
                                    )}
                                </div>

                                <button style={actionButtonStyle}>
                                    {activeTab === 'my' ? 'Выйти' : 'Подписаться'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

// Стили интерфейса сообществ в духе оригинального VK
const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dce1e6',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)',
    padding: '0 20px 20px 20px'
};

const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    borderBottom: '1px solid #f0f2f5',
    marginBottom: '10px'
};

const tabButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '15px 5px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease'
};

const communityRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 0',
    borderBottom: '1px solid #f0f2f5'
};

const avatarPlaceholderStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: '#f2f3f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0
};

const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2a5885',
    cursor: 'pointer'
};

const metaStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#818c99',
    marginTop: '2px'
};

const descStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#000000',
    marginTop: '6px',
    lineHeight: '1.4'
};

const actionButtonStyle: React.CSSProperties = {
    backgroundColor: '#f0f2f5',
    color: '#333333',
    border: 'none',
    padding: '7px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flexShrink: 0
};

const emptyStateStyle: React.CSSProperties = {
    padding: '40px 0',
    textAlign: 'center',
    color: '#818c99',
    fontSize: '14px'
};

export default Index;
