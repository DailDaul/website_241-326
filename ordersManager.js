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
            // Ждем загрузки DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                setTimeout(() => this.initialize(), 100);
            }
        } catch (error) {
            console.error('OrdersManager: Ошибка инициализации:', error);
        }
    }
    
    async initialize() {
        try {
            // Проверяем, что мы на странице orders.html
            if (!document.getElementById('order-form')) {
                return;
            }
            
            // 1. Загружаем блюда с API
            await this.loadDishesFromAPI();
            
            // 2. Загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            // 3. Настраиваем обработчики событий
            this.setupEventListeners();
            
            // 4. Отображаем выбранные блюда
            this.displayOrderItems();
            
            // 5. Настраиваем время доставки
            this.setupDeliveryTime();
            
            // 6. Обновляем отображение формы
            this.updateOrderFormDisplay();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('OrdersManager: Ошибка при инициализации:', error);
        }
    }
    
    async loadDishesFromAPI() {
        try {
            const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Преобразуем данные к нашему формату
            this.dishes = data.map(dish => {
                let category = dish.category;
                
                if (category === 'main-course') {
                    category = 'main';
                } else if (category === 'salad') {
                    category = 'starter';
                }
                
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
            
            return this.dishes;
            
        } catch (error) {
            console.error('Ошибка загрузки блюд:', error);
            throw error;
        }
    }
    
    async loadSavedOrder() {
        try {
            const savedOrderKeys = loadOrderFromStorage();
            
            const hasSavedOrder = Object.values(savedOrderKeys).some(key => key);
            
            if (!hasSavedOrder) {
                return;
            }
            
            if (!this.dishes || this.dishes.length === 0) {
                return;
            }
            
            Object.keys(savedOrderKeys).forEach(category => {
                const dishKeyword = savedOrderKeys[category];
                if (dishKeyword) {
                    const dish = this.dishes.find(d => d.keyword === dishKeyword);
                    if (dish) {
                        this.selectedDishes[category] = dish;
                    }
                }
            });
            
            this.updateOrderFormDisplay();
            
        } catch (error) {
            console.error('Ошибка при загрузке сохраненного заказа:', error);
        }
    }
    
    displayOrderItems() {
        const container = document.getElementById('order-items-container');
        const emptyMessage = document.getElementById('empty-order-message');
        
        if (!container) return;
        
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        
        if (!hasSelectedDishes) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            container.innerHTML = '';
            return;
        }
        
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        container.innerHTML = '';
        
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
        // 1. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ для кнопок "Удалить"
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const dishItem = removeBtn.closest('.dish-item');
                if (dishItem) {
                    const dishKeyword = dishItem.getAttribute('data-dish');
                    const category = dishItem.getAttribute('data-category');
                    this.removeDishFromOrder(dishKeyword, category);
                }
            }
        });
        
        // 2. Кнопка "Очистить заказ"
        const clearOrderBtn = document.getElementById('clear-order-btn');
        if (clearOrderBtn) {
            clearOrderBtn.type = 'button';
            
            clearOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearOrder();
            });
        }
        
        // 3. Кнопка "Отправить заказ"
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.type = 'button';
            
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.submitOrder();
            });
        }
        
        // 4. Обработчики для радио кнопок времени доставки
        const deliveryRadios = document.querySelectorAll('input[name="delivery_time"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleTimeInput(e.target.value === 'scheduled');
            });
        });
        
        // 5. Блокируем стандартную отправку формы
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }
    }
    
    setupDeliveryTime() {
        const timePanel = document.getElementById('time-panel');
        if (timePanel) {
            timePanel.style.display = 'none';
            
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
        }
    }
    
    removeDishFromOrder(dishKeyword, category) {
        const dish = this.dishes && this.dishes.find(d => d.keyword === dishKeyword);
        
        if (!dish) {
            return;
        }
        
        if (!confirm(`Удалить "${dish.name}" из заказа?`)) {
            return;
        }
        
        this.selectedDishes[category] = null;
        
        removeDishFromStorage(category);
        
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // УБИРАЕМ УВЕДОМЛЕНИЕ ОБ УДАЛЕНИИ
        // showNotification(`Блюдо "${dish.name}" удалено из заказа`, true);
    }
    
    clearOrder() {
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        if (!hasSelectedDishes) {
            return;
        }
        
        if (!confirm('Вы уверены, что хотите очистить весь заказ?')) {
            return;
        }
        
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        clearOrderFromStorage();
        
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // УБИРАЕМ УВЕДОМЛЕНИЕ ОБ ОЧИСТКЕ
        // showNotification('Заказ успешно очищен', true);
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
        
        if (emptyMessage) {
            emptyMessage.style.display = hasSelectedDishes ? 'none' : 'block';
        }
        
        if (orderTotalElement) {
            orderTotalElement.style.display = hasSelectedDishes ? 'block' : 'none';
        }
        
        if (totalPriceElement) {
            totalPriceElement.textContent = totalPrice;
        }
        
        this.updateFormHiddenFields();
    }
    
    getNotSelectedText(category) {
        const texts = {
            soup: 'Суп не выбран',
            main: 'Главное блюдо не выбрано',
            starter: 'Салат или стартер не выбран',
            drink: 'Напиток не выбран',
            dessert: 'Десерт не выбран'
        };
        return texts[category] || 'Блюдо не выбрано';
    }
    
    updateFormHiddenFields() {
        document.getElementById('order-soup').value = this.selectedDishes.soup ? this.selectedDishes.soup.keyword : '';
        document.getElementById('order-main').value = this.selectedDishes.main ? this.selectedDishes.main.keyword : '';
        document.getElementById('order-starter').value = this.selectedDishes.starter ? this.selectedDishes.starter.keyword : '';
        document.getElementById('order-drink').value = this.selectedDishes.drink ? this.selectedDishes.drink.keyword : '';
        document.getElementById('order-dessert').value = this.selectedDishes.dessert ? this.selectedDishes.dessert.keyword : '';
        
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish && dish.price) {
                totalPrice += dish.price;
            }
        });
        document.getElementById('order-total-price').value = totalPrice;
    }
    
    async submitOrder() {
        try {
            // 1. ВАЛИДАЦИЯ ФОРМЫ
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            
            if (!name || !email || !phone || !address) {
                if (typeof showNotification === 'function') {
                    showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                }
                return;
            }
            
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                if (typeof showNotification === 'function') {
                    showNotification('Введите корректный email адрес', false);
                }
                return;
            }
            
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                if (typeof showNotification === 'function') {
                    showNotification('Введите корректный номер телефона', false);
                }
                return;
            }
            
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                if (typeof showNotification === 'function') {
                    showNotification('Выберите блюда для заказа', false);
                }
                return;
            }
            
            if (typeof validateOrder === 'function') {
                const validation = validateOrder(this.selectedDishes);
                if (!validation.isValid) {
                    if (typeof showNotification === 'function') {
                        showNotification(validation.message, false);
                    }
                    return;
                }
            }
            
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            
            if (deliveryTime === 'scheduled' && !scheduledTime) {
                if (typeof showNotification === 'function') {
                    showNotification('Укажите время доставки', false);
                }
                return;
            }
            
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
            
            Object.keys(this.selectedDishes).forEach(category => {
                if (this.selectedDishes[category]) {
                    orderData.dishes[category] = this.selectedDishes[category].keyword;
                    orderData.total_price += this.selectedDishes[category].price;
                }
            });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            let response;
            try {
                response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(orderData),
                    signal: controller.signal
                });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    throw new Error('Таймаут запроса. Сервер не отвечает.');
                } else if (fetchError.message.includes('Failed to fetch')) {
                    throw new Error('Ошибка сети. Проверьте подключение к интернету.');
                } else {
                    throw new Error(`Ошибка подключения: ${fetchError.message}`);
                }
            }
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorMessage = `Ошибка сервера: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                    } catch (textError) {
                        errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            
            if (typeof clearOrderFromStorage === 'function') {
                clearOrderFromStorage();
            }
            
            // ОСТАВЛЯЕМ ТОЛЬКО ВАЖНОЕ УВЕДОМЛЕНИЕ ОБ УСПЕШНОЙ ОТПРАВКЕ
            if (typeof showNotification === 'function') {
                showNotification(
                    `✅ Заказ успешно оформлен!<br><br>
                    <strong>Сумма:</strong> ${orderData.total_price}Р<br>
                    <strong>Номер заказа:</strong> ${result.orderNumber || '#' + Date.now()}<br><br>
                    Мы свяжемся с вами для подтверждения.`,
                    true
                );
            }
            
            if (document.getElementById('order-form')) {
                document.getElementById('order-form').reset();
            }
            
            this.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            this.displayOrderItems();
            this.updateOrderFormDisplay();
            this.toggleTimeInput(false);
            
        } catch (error) {
            // ОСТАВЛЯЕМ ТОЛЬКО ВАЖНЫЕ УВЕДОМЛЕНИЯ ОБ ОШИБКАХ ОТПРАВКИ
            if (typeof showNotification === 'function') {
                let userErrorMessage = '';
                
                if (error.message.includes('Таймаут') || error.message.includes('не отвечает')) {
                    userErrorMessage = `⏱️ Сервер не отвежает. Пожалуйста, попробуйте позже.`;
                } else if (error.message.includes('сеть') || error.message.includes('Failed to fetch')) {
                    userErrorMessage = `📶 Проблема с подключением к интернету. Проверьте ваше интернет-соединение.`;
                } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
                    userErrorMessage = `❌ Неверные данные в заказе. Проверьте правильность заполнения формы.`;
                } else if (error.message.includes('500') || error.message.includes('Internal Server')) {
                    userErrorMessage = `🔧 Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.`;
                } else {
                    userErrorMessage = `❌ Ошибка при оформлении заказа: ${error.message}`;
                }
                
                showNotification(userErrorMessage, false);
            }
            
            console.error('Ошибка при отправке заказа:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const isOrdersPage = window.location.pathname.includes('orders.html') || 
                         document.getElementById('order-form') ||
                         document.querySelector('.order-form');
    
    if (isOrdersPage) {
        window.ordersManager = new OrdersManager();
    }
});
