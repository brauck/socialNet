import React from 'react';
import MainLayout from '../../Layouts/MainLayout';
import { useForm, Link } from '@inertiajs/react';

interface ProfileDataProps {
    first_name: string;
    last_name: string;
    hometown: string;
    status_text: string;
    birthday: string;
    avatar_url: string | null;
}

interface EditProps {
    profileData: ProfileDataProps;
}

const Edit: React.FC<EditProps> = ({ profileData }) => {
    const { data, setData, post, processing, errors } = useForm({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        hometown: profileData.hometown,
        status_text: profileData.status_text,
        birthday: profileData.birthday,
        avatar: null as File | null, // Поле для хранения файла
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // В Inertia для отправки файлов используется метод POST
        post('/profile/edit');
    };

    return (
        <MainLayout>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
                    <h2 className="text-base font-semibold text-gray-800">Редактирование профиля</h2>
                    <Link href="/" className="text-xs text-blue-600 hover:underline">Вернуться на страницу</Link>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
                    {/* Секция загрузки аватарки */}
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-gray-200">
                            {profileData.avatar_url ? (
                                <img src={profileData.avatar_url} alt="Аватар" className="w-full h-full object-cover" />
                            ) : (
                                '👨‍💻'
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Фотография профиля</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={e => setData('avatar', e.target.files ? e.target.files[0] : null)}
                                className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {errors.avatar && <div className="text-xs text-red-600 mt-1">{errors.avatar}</div>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Имя</label>
                            <input type="text" value={data.first_name} onChange={e => setData('first_name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white" required />
                            {errors.first_name && <div className="text-xs text-red-600 mt-1">{errors.first_name}</div>}
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Фамилия</label>
                            <input type="text" value={data.last_name} onChange={e => setData('last_name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white" required />
                            {errors.last_name && <div className="text-xs text-red-600 mt-1">{errors.last_name}</div>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Статус</label>
                        <input type="text" value={data.status_text} onChange={e => setData('status_text', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white" placeholder="Что у вас нового?" />
                        {errors.status_text && <div className="text-xs text-red-600 mt-1">{errors.status_text}</div>}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Родной город</label>
                            <input type="text" value={data.hometown} onChange={e => setData('hometown', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Дата рождения</label>
                            <input type="date" value={data.birthday} onChange={e => setData('birthday', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white" />
                        </div>
                    </div>

                    <button type="submit" disabled={processing} className="bg-blue-600 text-white px-6 py-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors self-start mt-2 disabled:opacity-50">
                        {processing ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </form>
            </div>
        </MainLayout>
    );
};

export default Edit;
