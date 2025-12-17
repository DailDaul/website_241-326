// Функция для загрузки блюд с API
async function loadDishes() {
    try {
        console.log('Загрузка блюд с API...');
        
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Блюда загружены с API:', data.length, 'шт.');
        
        // Преобразуем данные к нашему формату
        const transformedDishes = data.map(dish => {
            // Приводим категории к нашему формату
            let category = dish.category;
            
            // Преобразуем категории API в наши категории
            if (category === 'main-course') {
                category = 'main';
            } else if (category === 'salad') {
                category = 'starter';
            }
            // 'soup', 'drink', 'dessert' - оставляем как есть
            
            return {
                keyword: dish.keyword,
                name: dish.name,
                price: dish.price,
                category: category,
                kind: dish.kind,
                count: dish.count,
                image: dish.image
            };
        });
        
        return transformedDishes;
        
    } catch (error) {
        console.error('Ошибка загрузки блюд:', error);
        throw error; // Пробрасываем ошибку дальше
    }
}

// Экспортируем функцию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadDishes };
}
