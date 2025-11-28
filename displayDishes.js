//функция для создания карточки блюда
function createDishCard(dish) {
    const dishItem = document.createElement('div');
    dishItem.className = 'dish-item';
    dishItem.setAttribute('data-dish', dish.keyword);
    dishItem.setAttribute('data-kind', dish.kind);
    
    dishItem.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="dish-image">
        <p class="dish-name">${dish.name}</p>
        <p class="dish-weight">${dish.count}</p>
        <p class="dish-price">${dish.price}Р</p>
        <button class="add-button">Добавить</button>
    `;
    
    return dishItem;
}

//функция для создания фильтров
function createFilters(category, filters) {
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'filters';
    
    filters.forEach(filter => {
        const filterButton = document.createElement('button');
        filterButton.className = 'filter-btn';
        filterButton.setAttribute('data-kind', filter.value);
        filterButton.textContent = filter.label;
        filtersContainer.appendChild(filterButton);
    });
    
    return filtersContainer;
}

//функция для отображения блюд по категориям с фильтрацией
function displayDishes(filterKind = null, categoryType = null) {
    //сортируем блюда по алфавиту
    const sortedDishes = [...dishes].sort((a, b) => a.name.localeCompare(b.name));
    
    //группируем блюда по категориям
    const categories = {
        soup: document.getElementById('soups').querySelector('.dishes-grid'),
        main: document.getElementById('main-dishes').querySelector('.dishes-grid'),
        drink: document.getElementById('drinks').querySelector('.dishes-grid'),
        starter: document.getElementById('starters').querySelector('.dishes-grid'),
        dessert: document.getElementById('desserts').querySelector('.dishes-grid')
    };
    
    //очищаем контейнеры
    Object.values(categories).forEach(container => {
        container.innerHTML = '';
    });
    
    //добавляем блюда в соответствующие категории
    sortedDishes.forEach(dish => {
        const container = categories[dish.category];
        if (container) {
            //если применен фильтр, показываем только соответствующие блюда
            if (filterKind && categoryType === dish.category) {
                if (dish.kind === filterKind) {
                    const dishCard = createDishCard(dish);
                    container.appendChild(dishCard);
                }
            } else {
                const dishCard = createDishCard(dish);
                container.appendChild(dishCard);
            }
        }
    });
}

//функция для инициализации фильтров
function initFilters() {
    const filterConfig = {
        soup: [
            { label: 'рыбный', value: 'fish' },
            { label: 'мясной', value: 'meat' },
            { label: 'вегетарианский', value: 'veg' }
        ],
        main: [
            { label: 'рыбное', value: 'fish' },
            { label: 'мясное', value: 'meat' },
            { label: 'вегетарианское', value: 'veg' }
        ],
        drink: [
            { label: 'холодный', value: 'cold' },
            { label: 'горячий', value: 'hot' }
        ],
        starter: [
            { label: 'рыбный', value: 'fish' },
            { label: 'мясной', value: 'meat' },
            { label: 'вегетарианский', value: 'veg' }
        ],
        dessert: [
            { label: 'маленькая порция', value: 'small' },
            { label: 'средняя порция', value: 'medium' },
            { label: 'большая порция', value: 'large' }
        ]
    };
    
    //добавляем фильтры для каждой категории
    Object.keys(filterConfig).forEach(category => {
        const section = document.getElementById(category === 'starter' ? 'starters' : category + 's');
        if (section) {
            const filtersContainer = createFilters(category, filterConfig[category]);
            const dishesGrid = section.querySelector('.dishes-grid');
            section.insertBefore(filtersContainer, dishesGrid);
        }
    });
    
    //обработчики для фильтров
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const filterBtn = e.target;
            const filterKind = filterBtn.getAttribute('data-kind');
            const category = filterBtn.closest('section').id.replace('s', '');
            
            //убираем активный класс у всех фильтров в этой категории
            const allFilters = filterBtn.parentElement.querySelectorAll('.filter-btn');
            allFilters.forEach(btn => btn.classList.remove('active'));
            
            //если фильтр уже был активен, снимаем фильтрацию
            if (filterBtn.classList.contains('active')) {
                filterBtn.classList.remove('active');
                displayDishes(null, null);
            } else {
                //активируем фильтр и применяем фильтрацию
                filterBtn.classList.add('active');
                displayDishes(filterKind, category);
            }
        }
    });
}

//запускаем отображение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    displayDishes();
    initFilters();
});
