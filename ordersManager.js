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
        this.dishes = [];
        this.init();
    }
    
    async init() {
        try {
            console.log('OrdersManager: Начало инициализации...');
            
            // Используем DOMContentLoaded для гарантии загрузки DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                // DOM уже загружен
                setTimeout(() => this.initialize(), 100);
            }
        } catch (error) {
            console.error('OrdersManager: Ошибка инициализации:', error);
        }
    }
    
    async initialize() {
        try {
            console.log('OrdersManager: Инициализация...');
            
            // Проверяем, что мы на нужной странице
            if (!document.getElementById('order-form')) {
                console.log('OrdersManager: Не на странице оформления заказа');
                return;
            }
            
            // 1. Загружаем блюда с API
            await this.loadDishesFromAPI();
            
            // 2. Загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            // 3. Настраиваем обработчики событий ДО отображения
            this.setupEventListeners();
            
            // 4. Отображаем выбранные блюда
            this.displayOrderItems();
            
            // 5. Настраиваем время доставки
            this.setupDeliveryTime();
            
            // 6. Обновляем отображение формы
            this.updateOrderFormDisplay();
            
            this.isInitialized = true;
            console.log('OrdersManager: Инициализация завершена успешно');
            
        } catch (error) {
            console.error('OrdersManager: Ошибка при инициализации:', error);
            this.showErrorMessage('Не удалось загрузить данные меню');
        }
    }
    
    // ... (loadDishesFromAPI и другие методы остаются без изменений) ...
    
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
            container.innerHTML = '';
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
        
        // УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ОБРАБОТЧИКИ ПЕРЕД ДОБАВЛЕНИЕМ НОВЫХ
        this.removeAllEventListeners();
        
        // 1. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ для кнопок "Удалить"
        document.addEventListener('click', (e) => {
            // Проверяем, что клик был по кнопке "Удалить" или её дочерним элементам
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const dishItem = removeBtn.closest('.dish-item');
                if (dishItem) {
                    const dishKeyword = dishItem.getAttribute('data-dish');
                    const category = dishItem.getAttribute('data-category');
                    console.log(`Удаление блюда: ${dishKeyword}, категория: ${category}`);
                    this.removeDishFromOrder(dishKeyword, category);
                }
            }
        });
        
        // 2. Кнопка "Очистить заказ"
        const clearOrderBtn = document.getElementById('clear-order-btn');
        if (clearOrderBtn) {
            // Клонируем и заменяем кнопку для сброса обработчиков
            const newClearBtn = clearOrderBtn.cloneNode(true);
            clearOrderBtn.parentNode.replaceChild(newClearBtn, clearOrderBtn);
            
            newClearBtn.type = 'button';
            newClearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Кнопка "Очистить заказ" нажата');
                this.clearOrder();
            });
            console.log('Обработчик для "Очистить заказ" установлен');
        }
        
        // 3. Кнопка "Отправить заказ"
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            // Клонируем и заменяем кнопку для сброса обработчиков
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            newSubmitBtn.type = 'button';
            newSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Кнопка "Отправить заказ" нажата');
                this.submitOrder();
            });
            console.log('Обработчик для "Отправить заказ" установлен');
        }
        
        // 4. Обработчики для радио  кнопок времени доставки
        const deliveryRadios = document.querySelectorAll('input[name="delivery_time"]');
        deliveryRadios.forEach(radio => {
            const newRadio = radio.cloneNode(true);
            radio.parentNode.replaceChild(newRadio, radio);
            
            newRadio.addEventListener('change', (e) => {
                this.toggleTimeInput(e.target.value === 'scheduled');
            });
        });
        
        // 5. Блокируем стандартную отправку формы
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Стандартная отправка формы заблокирована');
                return false;
            }, true); // Используем capture phase
        }
        
        console.log('Все обработчики событий установлены');
    }
    
    removeAllEventListeners() {
        console.log('Удаление старых обработчиков...');
        
        // Создаем копии элементов для сброса обработчиков
        const elementsToReset = [
            '#clear-order-btn',
            '.submit-btn',
            'input[name="delivery_time"]',
            '#order-form'
        ];
        
        elementsToReset.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    const newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                }
            });
        });
    }
    
    // ... (остальные методы без изменений) ...
    
    removeDishFromOrder(dishKeyword, category) {
        console.log(`Удаление блюда из заказа: ${dishKeyword}, категория: ${category}`);
        
        // Находим блюдо
        const dish = this.dishes && this.dishes.find(d => d.keyword === dishKeyword);
        
        if (!dish) {
            console.error('Блюдо не найдено:', dishKeyword);
            return;
        }
        
        // Подтверждение удаления
        if (!confirm(`Удалить "${dish.name}" из заказа?`)) {
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
        console.log('Очистка всего заказа...');
        
        // Проверяем, есть ли что очищать
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        if (!hasSelectedDishes) {
            showNotification('Заказ уже пуст', false);
            return;
        }
        
        // Подтверждение
        if (!confirm('Вы уверены, что хотите очистить весь заказ?')) {
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
