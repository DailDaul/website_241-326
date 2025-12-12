//функция для создания карточки блюда
function createDishCard(dish) {
    const dishItem = document.createElement('div');
    dishItem.className = 'dish-item';
    dishItem.setAttribute('data-dish', dish.keyword);
    dishItem.setAttribute('data-kind', dish.kind);
    dishItem.setAttribute('data-category', dish.category);
    
    // Проверяем, выбрано ли это блюдо
    let isSelected = false;
    if (orderManager && orderManager.selectedDishes) {
        isSelected = orderManager.selectedDishes[dish.category]?.keyword === dish.keyword;
    }
    
    dishItem.innerHTML = `
        <div class="dish-image-container">
            <img src="${dish.image}" alt="${dish.name}" class="dish-image">
        </div>
        <p class="dish-name">${dish.name}</p>
        <p class="dish-weight">${dish.count}</p>
        <p class="dish-price">${dish.price}Р</p>
        <button class="add-button">${isSelected ? 'Добавлено' : 'Добавить'}</button>
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
        filterButton.setAttribute('data-category', category);
        filterButton.textContent = filter.label;
        filtersContainer.appendChild(filterButton);
    });
    
    return filtersContainer;
}

//текущие активные фильтры для каждой категории
let activeFilters = {
    soup: null,
    main: null,
    drink: null,
    starter: null,
    dessert: null
};

//функция для отображения блюд по категориям с фильтрацией
function displayDishes() {
    console.log('Displaying dishes with filters:', activeFilters);
    
    // Проверяем, что dishes существует
    if (!dishes || !Array.isArray(dishes)) {
        console.error('Dishes array is not defined or empty');
        return;
    }
    
    //сортируем блюда по алфавиту
    const sortedDishes = [...dishes].sort((a, b) => a.name.localeCompare(b.name));
    
    //группируем блюда по категориям (исправленные ID)
    const categories = {
        soup: document.getElementById('soups')?.querySelector('.dishes-grid'),
        main: document.getElementById('main-dishes')?.querySelector('.dishes-grid'),
        drink: document.getElementById('drinks')?.querySelector('.dishes-grid'),
        starter: document.getElementById('starters')?.querySelector('.dishes-grid'),
        dessert: document.getElementById('desserts')?.querySelector('.dishes-grid')
    };
    
    console.log('Categories found:', categories);
    
    //очищаем контейнеры
    Object.values(categories).forEach(container => {
        if (container) container.innerHTML = '';
    });
    
    //добавляем блюда в соответствующие категории с учетом фильтров
    sortedDishes.forEach(dish => {
        const container = categories[dish.category];
        if (container) {
            const activeFilter = activeFilters[dish.category];
            
            //если есть активный фильтр для этой категории, проверяем соответствие
            if (activeFilter) {
                if (dish.kind === activeFilter) {
                    const dishCard = createDishCard(dish);
                    container.appendChild(dishCard);
                }
            } else {
                //если фильтра нет, показываем все блюда
                const dishCard = createDishCard(dish);
                container.appendChild(dishCard);
            }
        }
    });
}

//функция для инициализации фильтров
function initFilters() {
    console.log('Initializing filters...');
    
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
        let sectionId;
        
        //определяем правильный ID секции
        switch(category) {
            case 'soup': sectionId = 'soups'; break;
            case 'main': sectionId = 'main-dishes'; break;
            case 'drink': sectionId = 'drinks'; break;
            case 'starter': sectionId = 'starters'; break;
            case 'dessert': sectionId = 'desserts'; break;
            default: sectionId = category + 's';
        }
        
        const section = document.getElementById(sectionId);
        console.log(`Looking for section ${sectionId}:`, section);
        
        if (section) {
            const filtersContainer = createFilters(category, filterConfig[category]);
            const heading = section.querySelector('h2');
            
            //Вставляем фильтры ПОСЛЕ заголовка и ПЕРЕД контейнером с блюдами
            if (heading && heading.nextElementSibling) {
                section.insertBefore(filtersContainer, heading.nextElementSibling);
                console.log(`Filters added to ${sectionId}`);
            }
        } else {
            console.log(`Section ${sectionId} not found!`);
        }
    });
    
    //обработчики для фильтров
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const filterBtn = e.target;
            const filterKind = filterBtn.getAttribute('data-kind');
            const category = filterBtn.getAttribute('data-category');
            
            console.log(`Filter clicked: ${filterKind} for category ${category}`);
            
            //находим секцию и все фильтры в ней
            let sectionId;
            switch(category) {
                case 'soup': sectionId = 'soups'; break;
                case 'main': sectionId = 'main-dishes'; break;
                case 'drink': sectionId = 'drinks'; break;
                case 'starter': sectionId = 'starters'; break;
                case 'dessert': sectionId = 'desserts'; break;
                default: sectionId = category + 's';
            }
            
            const section = document.getElementById(sectionId);
            if (!section) {
                console.log(`Section ${sectionId} not found!`);
                return;
            }
            
            //убираем активный класс у всех фильтров в этой категории
            const allFilters = section.querySelectorAll('.filter-btn');
            allFilters.forEach(btn => btn.classList.remove('active'));
            
            //проверяем, был ли этот фильтр уже активен
            const wasActive = activeFilters[category] === filterKind;
            
            if (wasActive) {
                //если фильтр уже был активен, снимаем фильтрацию
                activeFilters[category] = null;
                filterBtn.classList.remove('active');
                console.log(`Filter ${filterKind} deactivated for ${category}`);
            } else {
                //активируем фильтр
                activeFilters[category] = filterKind;
                filterBtn.classList.add('active');
                console.log(`Filter ${filterKind} activated for ${category}`);
            }
            
            //обновляем отображение блюд
            displayDishes();
        }
    });
}

//запускаем отображение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Проверяем, что dishes загружен
    if (typeof dishes !== 'undefined') {
        console.log('Dishes loaded:', dishes.length);
        initFilters();
        displayDishes();
        
        // Если orderManager уже инициализирован, обновляем подсветку
        if (orderManager && typeof orderManager.updateDishCardsHighlight === 'function') {
            orderManager.updateDishCardsHighlight();
        }
    } else {
        console.error('Dishes not loaded!');
        // Пробуем снова через небольшую задержку
        setTimeout(() => {
            if (typeof dishes !== 'undefined') {
                initFilters();
                displayDishes();
            } else {
                console.error('Failed to load dishes after retry');
            }
        }, 500);
    }
});

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayDishes,
        initFilters,
        activeFilters
    };
}
