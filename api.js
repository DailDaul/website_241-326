// api.js
// Функция для загрузки блюд с API
async function loadDishes() {
    try {
        console.log('Загрузка блюд с API...');
        
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Блюда загружены:', data.length, 'шт.');
        
        // Преобразуем данные, если нужно привести к тому же формату
        const transformedDishes = data.map(dish => {
            return {
                keyword: dish.keyword,
                name: dish.name,
                price: dish.price,
                category: dish.category,
                kind: dish.kind,
                count: dish.count,
                image: dish.image
            };
        });
        
        return transformedDishes;
        
    } catch (error) {
        console.error('Ошибка загрузки блюд:', error);
        // Возвращаем пустой массив или можно загрузить fallback данные
        return [];
    }
}

// Экспортируем функцию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadDishes };
}
