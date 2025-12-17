// displayDishes.js
// функция для создания карточки блюда
function createDishCard(dish) {
    const dishItem = document.createElement('div');
    dishItem.className = 'dish-item';
    dishItem.setAttribute('data-dish', dish.keyword);
    dishItem.setAttribute('data-kind', dish.kind);
    dishItem.setAttribute('data-category', dish.category);
    
    // Проверяем, выбрано ли это блюдо
    let isSelected = false;
    if (typeof orderManager !== 'undefined' && orderManager && orderManager.selectedDishes) {
        isSelected = orderManager.selectedDishes[dish.category]?.keyword === dish.keyword;
    }
    
    dishItem.innerHTML = `
        <div class="dish-image-container">
            <img src="${dish.image}" alt="${dish.name}" class="dish-image" onerror="this.onerror=null; this.src='images/default.jpg';">
        </div>
        <p class="dish-name">${dish.name}</p>
        <p class="dish-weight">${dish.count}</p>
        <p class="dish-price">${dish.price}Р</p>
        <button class="add-button">${isSelected ? 'Добавлено' : 'Добавить'}</button>
    `;
    
    // Добавляем класс selected если блюдо выбрано
    if (isSelected) {
        dishItem.classList.add('selected');
    }
    
    return dishItem;
}

// функция для создания фильтров
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

// текущие активные фильтры для каждой категории
let activeFilters = {
    soup: null,
    main: null,
    drink: null,
    starter: null,
    dessert: null
};

// глобальная переменная для блюд
let dishes = [];

// функция для отображения блюд по категориям с фильтрацией
function displayDishes() {
    console.log('Displaying dishes with filters:', activeFilters);
    
    // Проверяем, что dishes существует
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        console.error('Dishes array is empty or not defined');
        
        // Показываем сообщение об отсутствии блюд
        const sections = ['soups', 'main-dishes', 'drinks', 'starters', 'desserts'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const grid = section.querySelector('.dishes-grid');
                if (grid) {
                    grid.innerHTML = '<div class="loading-message">Загрузка блюд...</div>';
                }
            }
        });
        
        return;
    }
    
    // сортируем блюда по алфавиту
    const sortedDishes = [...dishes].sort((a, b) => a.name.localeCompare(b.name));
    
    // группируем блюда по категориям (исправленные ID)
    const categories = {
        soup: document.getElementById('soups')?.querySelector('.dishes-grid'),
        main: document.getElementById('main-dishes')?.querySelector('.dishes-grid'),
        drink: document.getElementById('drinks')?.querySelector('.dishes-grid'),
        starter: document.getElementById('starters')?.querySelector('.dishes-grid'),
        dessert: document.getElementById('desserts')?.querySelector('.dishes-grid')
    };
    
    console.log('Categories found:', categories);
    
    // очищаем контейнеры
    Object.values(categories).forEach(container => {
        if (container) container.innerHTML = '';
    });
    
    // добавляем блюда в соответствующие категории с учетом фильтров
    sortedDishes.forEach(dish => {
        const container = categories[dish.category];
        if (container) {
            const activeFilter = activeFilters[dish.category];
            
            // если есть активный фильтр для этой категории, проверяем соответствие
            if (activeFilter) {
                if (dish.kind === activeFilter) {
                    const dishCard = createDishCard(dish);
                    container.appendChild(dishCard);
                }
            } else {
                // если фильтра нет, показываем все блюда
                const dishCard = createDishCard(dish);
                container.appendChild(dishCard);
            }
        }
    });
    
    // ВЫЗЫВАЕМ ПОДСВЕТКУ ПОСЛЕ ОТОБРАЖЕНИЯ ВСЕХ КАРТОЧЕК
    if (typeof orderManager !== 'undefined' && orderManager && orderManager.updateDishCardsHighlight) {
        setTimeout(() => {
            orderManager.updateDishCardsHighlight();
        }, 50);
    }
}

// функция для инициализации фильтров
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
    
    // добавляем фильтры для каждой категории
    Object.keys(filterConfig).forEach(category => {
        let sectionId;
        
        // определяем правильный ID секции
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
            
            // Вставляем фильтры ПОСЛЕ заголовка и ПЕРЕД контейнером с блюдами
            if (heading && heading.nextElementSibling) {
                section.insertBefore(filtersContainer, heading.nextElementSibling);
                console.log(`Filters added to ${sectionId}`);
            }
        } else {
            console.log(`Section ${sectionId} not found!`);
        }
    });
    
    // обработчики для фильтров
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const filterBtn = e.target;
            const filterKind = filterBtn.getAttribute('data-kind');
            const category = filterBtn.getAttribute('data-category');
            
            console.log(`Filter clicked: ${filterKind} for category ${category}`);
            
            // находим секцию и все фильтры в ней
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
            
            // убираем активный класс у всех фильтров в этой категории
            const allFilters = section.querySelectorAll('.filter-btn');
            allFilters.forEach(btn => btn.classList.remove('active'));
            
            // проверяем, был ли этот фильтр уже активен
            const wasActive = activeFilters[category] === filterKind;
            
            if (wasActive) {
                // если фильтр уже был активен, снимаем фильтрацию
                activeFilters[category] = null;
                filterBtn.classList.remove('active');
                console.log(`Filter ${filterKind} deactivated for ${category}`);
            } else {
                // активируем фильтр
                activeFilters[category] = filterKind;
                filterBtn.classList.add('active');
                console.log(`Filter ${filterKind} activated for ${category}`);
            }
            
            // обновляем отображение блюд
            displayDishes();
        }
    });
}

// функция для инициализации загрузки блюд
async function initializeDishes() {
    try {
        // Показываем индикатор загрузки
        const sections = ['soups', 'main-dishes', 'drinks', 'starters', 'desserts'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const grid = section.querySelector('.dishes-grid');
                if (grid) {
                    grid.innerHTML = '<div class="loading-message">Загрузка блюд...</div>';
                }
            }
        });
        
        // Загружаем блюда через API
        if (typeof loadDishes === 'function') {
            const loadedDishes = await loadDishes();
            
            if (loadedDishes && loadedDishes.length > 0) {
                dishes = loadedDishes;
                console.log('Блюда успешно загружены:', dishes.length);
                
                // Инициализируем фильтры и отображаем блюда
                initFilters();
                displayDishes();
                
                // Инициализируем OrderManager после загрузки блюд
                if (typeof orderManager !== 'undefined' && orderManager) {
                    orderManager.updateDishCardsHighlight();
                }
                
                return true;
            } else {
                console.error('Не удалось загрузить блюда или список пуст');
                showErrorMessage('Не удалось загрузить меню. Пожалуйста, обновите страницу.');
                return false;
            }
        } else {
            console.error('Функция loadDishes не найдена');
            showErrorMessage('Ошибка загрузки. Пожалуйста, проверьте подключение файлов.');
            return false;
        }
    } catch (error) {
        console.error('Ошибка при инициализации блюд:', error);
        showErrorMessage('Ошибка при загрузке меню. Пожалуйста, обновите страницу.');
        return false;
    }
}

// функция для показа сообщения об ошибке
function showErrorMessage(message) {
    const sections = ['soups', 'main-dishes', 'drinks', 'starters', 'desserts'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const grid = section.querySelector('.dishes-grid');
            if (grid) {
                grid.innerHTML = `<div class="error-message">${message}</div>`;
            }
        }
    });
}

// запускаем отображение при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...');
    
    // Добавляем стили для сообщений
    const style = document.createElement('style');
    style.textContent = `
        .loading-message, .error-message {
            text-align: center;
            padding: 40px;
            font-size: 18px;
            color: #666;
            background-color: #f9f9f9;
            border-radius: 10px;
            margin: 20px 0;
        }
        .error-message {
            color: #ff6b00;
            border: 2px solid #ff6b00;
        }
    `;
    document.head.appendChild(style);
    
    // Инициализируем загрузку блюд
    await initializeDishes();
});

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayDishes,
        initFilters,
        activeFilters,
        dishes,
        initializeDishes
    };
}
