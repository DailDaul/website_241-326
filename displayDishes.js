//функция для создания карточки блюда
function createDishCard(dish) {
    const dishItem = document.createElement('div');
    dishItem.className = 'dish-item';
    dishItem.setAttribute('data-dish', dish.keyword);
    
    dishItem.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="dish-image">
        <p class="dish-name">${dish.name}</p>
        <p class="dish-weight">${dish.count}</p>
        <p class="dish-price">${dish.price}Р</p>
        <button class="add-button">Добавить</button>
    `;
    
    return dishItem;
}

//функция для отображения блюд по категориям
function displayDishes() {
    // Сортируем блюда по алфавиту
    const sortedDishes = [...dishes].sort((a, b) => a.name.localeCompare(b.name));
    
    //группируем блюда по категориям
    const categories = {
        soup: document.getElementById('soups').querySelector('.dishes-grid'),
        main: document.getElementById('main-dishes').querySelector('.dishes-grid'),
        drink: document.getElementById('drinks').querySelector('.dishes-grid')
    };
    
    //очищаем контейнеры
    Object.values(categories).forEach(container => {
        container.innerHTML = '';
    });
    
    //добавляем блюда в соответствующие категории
    sortedDishes.forEach(dish => {
        const container = categories[dish.category];
        if (container) {
            const dishCard = createDishCard(dish);
            container.appendChild(dishCard);
        }
    });
}

//запускаем отображение при загрузке страницы
document.addEventListener('DOMContentLoaded', displayDishes);
