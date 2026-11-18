export const getTabClass = (isActive: boolean): string => {
    const base = 'tab-item'; // Наш базовый класс из app.css
    const state = isActive 
        ? 'border-blue-600 text-black' 
        : 'border-transparent text-gray-500 hover:text-black';
        
    return `${base} ${state}`;
};
