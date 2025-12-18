class OrdersManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        this.isInitialized = false;
        this.dishes = []; // Массив для хранения блюд с API
        this.init();
    }
    
    async init() {
        try {
            console.log('OrdersManager: Начало инициализации...');
            
            // Ждем загрузки DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                await this.initialize();
            }
        } catch (error) {
            console.error('OrdersManager: Ошибка инициализации:', error);
            this.showErrorMessage('Ошибка загрузки данных заказа');
        }
    }
    
    async initialize() {
        try {
            console.log('OrdersManager: Инициализация...');
            
            // Проверяем, что мы на странице orders.html
            if (!document.getElementById('order-form')) {
                console.log('OrdersManager: Не на странице оформления заказа');
                return;
            }
            
            // 1. Загружаем блюда с API
            await this.loadDishesFromAPI();
            
            // 2. Загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            // 3. Отображаем выбранные блюда
            this.displayOrderItems();
            
            // 4. Настраиваем обработчики событий
            this.setupEventListeners();
            
            // 5. Настраиваем время доставки
            this.setupDeliveryTime();
            
            this.isInitialized = true;
            console.log('OrdersManager: Инициализация завершена успешно');
            
        } catch (error) {
            console.error('OrdersManager: Ошибка при инициализации:', error);
            this.showErrorMessage('Не удалось загрузить данные меню');
        }
    }
    
    // НОВАЯ ФУНКЦИЯ: Загрузка блюд с API
    async loadDishesFromAPI() {
        try {
            console.log('Загрузка блюд с API...');
            
            const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Блюда загружены с API:', data.length, 'шт.');
            
            // Преобразуем данные к нашему формату
            this.dishes = data.map(dish => {
                // Приводим категории к нашему формату
                let category = dish.category;
                
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
            
            console.log('Блюда преобразованы:', this.dishes.length);
            return this.dishes;
            
        } catch (error) {
            console.error('Ошибка загрузки блюд:', error);
            throw error;
        }
    }
    
    async loadSavedOrder() {
        try {
            // Загружаем ключи из localStorage
            const savedOrderKeys = loadOrderFromStorage();
            console.log('Загруженные ключи из localStorage:', savedOrderKeys);
            
            // Проверяем, есть ли сохраненные блюда
            const hasSavedOrder = Object.values(savedOrderKeys).some(key => key);
            
            if (!hasSavedOrder) {
                console.log('Нет сохраненного заказа');
                return;
            }
            
            // Проверяем, что блюда загружены
            if (!this.dishes || this.dishes.length === 0) {
                console.log('Блюда еще не загружены, ждем...');
                return;
            }
            
            // Восстанавливаем полные данные блюд
            Object.keys(savedOrderKeys).forEach(category => {
                const dishKeyword = savedOrderKeys[category];
                if (dishKeyword) {
                    const dish = this.dishes.find(d => d.keyword === dishKeyword);
                    if (dish) {
                        this.selectedDishes[category] = dish;
                        console.log(`Восстановлено блюдо: ${category} - ${dish.name}`);
                    } else {
                        console.warn(`Блюдо с ключом "${dishKeyword}" не найдено в загруженных данных`);
                    }
                }
            });
            
            // Обновляем отображение заказа в форме
            this.updateOrderFormDisplay();
            
        } catch (error) {
            console.error('Ошибка при загрузке сохраненного заказа:', error);
        }
    }
    
    displayOrderItems() {
        const container = document.getElementById('order-items-container');
        const emptyMessage = document.getElementById('empty-order-message');
        
        if (!container) return;
        
        // Проверяем, есть ли выбранные блюда
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        
        if (!hasSelectedDishes) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            container.innerHTML = ''; // Очищаем контейнер
            return;
        }
        
        // Скрываем сообщение о пустом заказе
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        // Очищаем и заполняем контейнер
        container.innerHTML = '';
        
        // Отображаем выбранные блюда
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish) {
                const dishCard = this.createOrderItemCard(dish);
                container.appendChild(dishCard);
            }
        });
    }
    
    createOrderItemCard(dish) {
        const dishItem = document.createElement('div');
        dishItem.className = 'dish-item';
        dishItem.setAttribute('data-dish', dish.keyword);
        dishItem.setAttribute('data-category', dish.category);
        
        dishItem.innerHTML = `
            <div class="dish-image-container">
                <img src="${dish.image}" alt="${dish.name}" class="dish-image">
            </div>
            <p class="dish-name">${dish.name}</p>
            <p class="dish-weight">${dish.count}</p>
            <p class="dish-price">${dish.price}Р</p>
            <button class="add-button remove-btn" type="button">Удалить</button>
        `;
        
        return dishItem;
    }
    
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Обработчик для кнопок "Удалить" (делегирование)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const dishItem = e.target.closest('.dish-item');
                if (dishItem) {
                    const dishKeyword = dishItem.getAttribute('data-dish');
                    const category = dishItem.getAttribute('data-category');
                    this.removeDishFromOrder(dishKeyword, category);
                }
            }
        });
        
        // Обработчик для кнопки "Очистить заказ"
        const clearOrderBtn = document.getElementById('clear-order-btn');
        if (clearOrderBtn) {
            // Убедимся, что это кнопка, а не submit
            clearOrderBtn.type = 'button';
            
            clearOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearOrder();
            });
            console.log('Обработчик для "Очистить заказ" установлен');
        }
        
        // Обработчик для кнопки "Отправить заказ"
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            // Меняем type на button чтобы предотвратить стандартную отправку формы
            submitBtn.type = 'button';
            
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Кнопка "Отправить заказ" нажата');
                this.submitOrder();
            });
            console.log('Обработчик для "Отправить заказ" установлен');
        }
        
        // Обработчик для выбора времени доставки
        const deliveryRadios = document.querySelectorAll('input[name="delivery_time"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleTimeInput(e.target.value === 'scheduled');
            });
        });
        
        // Обработчик для предотвращения стандартной отправки формы
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Форма пытается отправиться, блокируем...');
                return false;
            });
        }
    }
    
    setupDeliveryTime() {
        const timePanel = document.getElementById('time-panel');
        if (timePanel) {
            // По умолчанию скрываем панель выбора времени
            timePanel.style.display = 'none';
            
            // Устанавливаем текущее время + 1 час как значение по умолчанию
            const now = new Date();
            now.setHours(now.getHours() + 1);
            const timeInput = document.getElementById('scheduled-time');
            if (timeInput) {
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                timeInput.value = `${hours}:${minutes}`;
            }
        }
    }
    
    toggleTimeInput(show) {
        const timePanel = document.getElementById('time-panel');
        if (timePanel) {
            timePanel.style.display = show ? 'block' : 'none';
            if (show) {
                timePanel.style.animation = 'fadeIn 0.3s ease';
            }
        }
    }
    
    removeDishFromOrder(dishKeyword, category) {
        // Находим блюдо в нашем массиве dishes
        const dish = this.dishes && this.dishes.find(d => d.keyword === dishKeyword);
        
        if (!dish) {
            console.error('Блюдо не найдено:', dishKeyword);
            return;
        }
        
        // Удаляем блюдо из текущего заказа
        this.selectedDishes[category] = null;
        
        // Удаляем из localStorage
        removeDishFromStorage(category);
        
        // Обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // Показываем уведомление
        showNotification(`Блюдо "${dish.name}" удалено из заказа`, true);
    }
    
    clearOrder() {
        console.log('Очистка заказа...');
        
        // Показываем подтверждение
        if (!confirm('Вы уверены, что хотите очистить заказ?')) {
            return;
        }
        
        // Очищаем текущий заказ
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        // Очищаем localStorage
        clearOrderFromStorage();
        
        // Обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // Показываем уведомление
        showNotification('Заказ успешно очищен', true);
    }
    
    updateOrderFormDisplay() {
        const orderBlocks = {
            soup: document.getElementById('selected-soup'),
            main: document.getElementById('selected-main'),
            starter: document.getElementById('selected-starter'),
            drink: document.getElementById('selected-drink'),
            dessert: document.getElementById('selected-dessert')
        };
        
        const categoryTitles = {
            soup: document.getElementById('soup-title'),
            main: document.getElementById('main-title'),
            starter: document.getElementById('starter-title'),
            drink: document.getElementById('drink-title'),
            dessert: document.getElementById('dessert-title')
        };
        
        const totalPriceElement = document.getElementById('total-price');
        const orderTotalElement = document.getElementById('order-total');
        const emptyMessage = document.getElementById('empty-message');
        
        let hasSelectedDishes = false;
        let totalPrice = 0;
        
        // Обновляем отображение для каждой категории
        Object.keys(this.selectedDishes).forEach(category => {
            const dish = this.selectedDishes[category];
            const orderBlock = orderBlocks[category];
            const categoryTitle = categoryTitles[category];
            
            if (orderBlock && categoryTitle) {
                if (dish) {
                    orderBlock.innerHTML = `
                        <div class="selected-dish">
                            <span class="dish-name">${dish.name}</span>
                            <span class="dish-price">${dish.price}Р</span>
                        </div>
                    `;
                    categoryTitle.style.display = 'block';
                    orderBlock.style.display = 'block';
                    hasSelectedDishes = true;
                    totalPrice += dish.price;
                } else {
                    orderBlock.innerHTML = `
                        <div class="not-selected">
                            ${this.getNotSelectedText(category)}
                        </div>
                    `;
                    categoryTitle.style.display = 'block';
                    orderBlock.style.display = 'block';
                }
            }
        });
        
        // Управляем отображением сообщения "Ничего не выбрано"
        if (emptyMessage) {
            emptyMessage.style.display = hasSelectedDishes ? 'none' : 'block';
        }
        
        // Управляем отображением блока с итоговой стоимостью
        if (orderTotalElement) {
            orderTotalElement.style.display = hasSelectedDishes ? 'block' : 'none';
        }
        
        // Обновляем общую стоимость
        if (totalPriceElement) {
            totalPriceElement.textContent = totalPrice;
        }
        
        // Заполняем скрытые поля формы
        this.updateFormHiddenFields();
    }
    
    getNotSelectedText(category) {
        const texts = {
            soup: 'Суп не выбран',
            main: 'Главное блюдо не выбрано',
            starter: 'Салат или стартер не выбран',
            drink: 'Напиток не выбран',
            dessert: 'Десерт не выбрано'
        };
        return texts[category] || 'Блюдо не выбрано';
    }
    
    updateFormHiddenFields() {
        // Заполняем скрытые поля формы
        document.getElementById('order-soup').value = this.selectedDishes.soup ? this.selectedDishes.soup.keyword : '';
        document.getElementById('order-main').value = this.selectedDishes.main ? this.selectedDishes.main.keyword : '';
        document.getElementById('order-starter').value = this.selectedDishes.starter ? this.selectedDishes.starter.keyword : '';
        document.getElementById('order-drink').value = this.selectedDishes.drink ? this.selectedDishes.drink.keyword : '';
        document.getElementById('order-dessert').value = this.selectedDishes.dessert ? this.selectedDishes.dessert.keyword : '';
        
        // Рассчитываем и заполняем общую стоимость
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish && dish.price) {
                totalPrice += dish.price;
            }
        });
        document.getElementById('order-total-price').value = totalPrice;
    }
    
    async submitOrder() {
        console.log('=== НАЧАЛО ОТПРАВКИ ЗАКАЗА ===');
        
        try {
            // 1. ВАЛИДАЦИЯ ФОРМЫ
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            
            if (!name || !email || !phone || !address) {
                showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            // 2. ВАЛИДАЦИЯ EMAIL
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showNotification('Введите корректный email адрес', false);
                return;
            }
            
            // 3. ВАЛИДАЦИЯ ТЕЛЕФОНА
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                showNotification('Введите корректный номер телефона', false);
                return;
            }
            
            // 4. ПРОВЕРКА ВЫБРАННЫХ БЛЮД
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                showNotification('Выберите блюда для заказа', false);
                return;
            }
            
            // 5. ВАЛИДАЦИЯ КОМБО-ЛАНЧА
            const validation = validateOrder(this.selectedDishes);
            if (!validation.isValid) {
                showNotification(validation.message, false);
                return;
            }
            
            // 6. ПРОВЕРКА ВРЕМЕНИ ДОСТАВКИ
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            
            if (deliveryTime === 'scheduled' && !scheduledTime) {
                showNotification('Укажите время доставки', false);
                return;
            }
            
            // 7. ПОДГОТОВКА ДАННЫХ ДЛЯ ОТПРАВКИ
            const orderData = {
                name: name,
                email: email,
                phone: phone,
                address: address,
                delivery_time: deliveryTime,
                scheduled_time: deliveryTime === 'scheduled' ? scheduledTime : null,
                dishes: {},
                total_price: 0
            };
            
            // Добавляем блюда (используем keyword, как требует API)
            Object.keys(this.selectedDishes).forEach(category => {
                if (this.selectedDishes[category]) {
                    orderData.dishes[category] = this.selectedDishes[category].keyword;
                    orderData.total_price += this.selectedDishes[category].price;
                }
            });
            
            console.log('Данные для отправки на сервер:', orderData);
            
            // 8. ОТПРАВКА НА СЕРВЕР ЧЕРЕЗ fetch
            console.log('Отправка запроса на сервер...');
            
            const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            console.log('Ответ сервера получен. Статус:', response.status);
            
            if (!response.ok) {
                // Если сервер вернул ошибку
                let errorMessage = `Ошибка сервера: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Если не удалось распарсить JSON
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            // 9. ОБРАБОТКА УСПЕШНОГО ОТВЕТА
            const result = await response.json();
            console.log('Успешный ответ сервера:', result);
            
            // 10. ОЧИСТКА localStorage ПОСЛЕ УСПЕШНОЙ ОТПРАВКИ
            clearOrderFromStorage();
            console.log('Данные удалены из localStorage');
            
            // 11. ПОКАЗ УВЕДОМЛЕНИЯ ОБ УСПЕХЕ
            showNotification(
                `✅ Заказ успешно оформлен!<br><br>
                <strong>Номер заказа:</strong> ${result.orderNumber || '#' + Date.now()}<br>
                <strong>Сумма:</strong> ${orderData.total_price}Р<br>
                <strong>Статус:</strong> ${result.status || 'принят'}<br><br>
                Мы свяжемся с вами для подтверждения.`,
                true
            );
            
            // 12. ОЧИСТКА ФОРМЫ И ЗАКАЗА
            document.getElementById('order-form').reset();
            
            this.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            // 13. ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ
            this.displayOrderItems();
            this.updateOrderFormDisplay();
            this.toggleTimeInput(false);
            
            console.log('=== ЗАКАЗ УСПЕШНО ОТПРАВЛЕН ===');
            
        } catch (error) {
            console.error('=== ОШИБКА ПРИ ОТПРАВКЕ ЗАКАЗА ===', error);
            
            // ПОКАЗ УВЕДОМЛЕНИЯ ОБ ОШИБКЕ
            showNotification(
                `❌ Ошибка при оформлении заказа!<br><br>
                <strong>Причина:</strong> ${error.message}<br><br>
                Пожалуйста, проверьте данные и попробуйте еще раз.<br>
                <small>Данные заказа сохранены в корзине.</small>`,
                false
            );
            
            // В случае ошибки НЕ удаляем данные из localStorage
            console.log('Данные сохранены в localStorage из-за ошибки');
        }
    }
    
    showErrorMessage(message) {
        const container = document.getElementById('order-items-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    ${message}
                </div>
            `;
        }
    }
}

// Инициализируем менеджер заказов только на странице orders.html
let ordersManager = null;

// Проверяем, что мы на странице orders.html
if (window.location.pathname.includes('orders.html') || 
    document.getElementById('order-form')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('=== ИНИЦИАЛИЗАЦИЯ OrdersManager ===');
        ordersManager = new OrdersManager();
        
        // Экспортируем для отладки
        window.ordersManager = ordersManager;
    });
} else {
    console.log('OrdersManager: Эта страница не требует инициализации менеджера заказов');
}
