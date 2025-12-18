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
        this.init();
    }
    
    async init() {
        try {
            // Ждем загрузки DOM
            if (document.readyState !== 'loading') {
                await this.initialize();
            } else {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            }
        } catch (error) {
            console.error('Ошибка при инициализации OrdersManager:', error);
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
            
            // Загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            // Отображаем выбранные блюда
            this.displayOrderItems();
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Настраиваем время доставки
            this.setupDeliveryTime();
            
            this.isInitialized = true;
            console.log('OrdersManager: Инициализация завершена');
            
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
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
            
            // Загружаем все блюда с API
            const dishes = await loadDishes();
            if (!dishes || !Array.isArray(dishes)) {
                throw new Error('Не удалось загрузить блюда с API');
            }
            
            // Восстанавливаем полные данные блюд
            Object.keys(savedOrderKeys).forEach(category => {
                const dishKeyword = savedOrderKeys[category];
                if (dishKeyword) {
                    const dish = dishes.find(d => d.keyword === dishKeyword);
                    if (dish) {
                        this.selectedDishes[category] = dish;
                        console.log(`Восстановлено блюдо: ${category} - ${dish.name}`);
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
            <button class="add-button remove-btn">Удалить</button>
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
            // Удаляем старые обработчики
            const newClearBtn = clearOrderBtn.cloneNode(true);
            clearOrderBtn.parentNode.replaceChild(newClearBtn, clearOrderBtn);
            
            // Добавляем новый обработчик
            newClearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearOrder();
            });
            console.log('Обработчик для "Очистить заказ" установлен');
        }
        
        // Обработчик для кнопки "Отправить заказ"
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            // Меняем type на button чтобы предотвратить стандартную отправку
            submitBtn.type = 'button';
            
            // Удаляем старые обработчики
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            // Добавляем новый обработчик
            newSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
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
        // Находим блюдо в глобальном массиве dishes
        const dish = dishes && dishes.find(d => d.keyword === dishKeyword);
        
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
        console.log('Обновление отображения формы заказа...');
        
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
            dessert: 'Десерт не выбран'
        };
        return texts[category] || 'Блюдо не выбрано';
    }
    
    updateFormHiddenFields() {
        // Заполняем скрытые поля формы
        document.getElementById('order-soup').value = this.selectedDishes.soup ? this.selectedDishes.soup.name : '';
        document.getElementById('order-main').value = this.selectedDishes.main ? this.selectedDishes.main.name : '';
        document.getElementById('order-starter').value = this.selectedDishes.starter ? this.selectedDishes.starter.name : '';
        document.getElementById('order-drink').value = this.selectedDishes.drink ? this.selectedDishes.drink.name : '';
        document.getElementById('order-dessert').value = this.selectedDishes.dessert ? this.selectedDishes.dessert.name : '';
        
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
        console.log('Отправка заказа...');
        
        try {
            // 1. Проверяем заполнение полей формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            
            if (!name || !email || !phone || !address) {
                showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            // 2. Проверяем валидность email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showNotification('Введите корректный email адрес', false);
                return;
            }
            
            // 3. Проверяем валидность телефона
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                showNotification('Введите корректный номер телефона', false);
                return;
            }
            
            // 4. Проверяем, что выбрано хотя бы одно блюдо
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                showNotification('Выберите блюда для заказа', false);
                return;
            }
            
            // 5. Проверяем валидность состава заказа
            const validation = validateOrder(this.selectedDishes);
            if (!validation.isValid) {
                showNotification(validation.message, false);
                return;
            }
            
            // 6. Проверяем время доставки если выбрано "по расписанию"
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            
            if (deliveryTime === 'scheduled' && !scheduledTime) {
                showNotification('Укажите время доставки', false);
                return;
            }
            
            // 7. Подготавливаем данные для отправки
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
            
            // Добавляем блюда
            Object.keys(this.selectedDishes).forEach(category => {
                if (this.selectedDishes[category]) {
                    orderData.dishes[category] = this.selectedDishes[category].keyword;
                    orderData.total_price += this.selectedDishes[category].price;
                }
            });
            
            console.log('Отправка заказа на сервер:', orderData);
            
            // 8. Отправляем запрос на сервер
            const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Ответ сервера:', result);
            
            // 9. Очищаем localStorage после успешной отправки
            clearOrderFromStorage();
            
            // 10. Показываем сообщение об успехе
            showNotification(
                `Заказ успешно оформлен!<br>Номер вашего заказа: ${result.orderNumber || '#' + Date.now()}<br>Сумма: ${orderData.total_price}Р`, 
                true
            );
            
            // 11. Очищаем форму
            document.getElementById('order-form').reset();
            
            // 12. Очищаем текущий заказ
            this.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            // 13. Обновляем отображение
            this.displayOrderItems();
            this.updateOrderFormDisplay();
            
            // 14. Скрываем панель выбора времени
            this.toggleTimeInput(false);
            
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            showNotification(
                `Ошибка при оформлении заказа: ${error.message}<br>Пожалуйста, попробуйте еще раз.`, 
                false
            );
        }
    }
    
    showErrorMessage(message) {
        const container = document.getElementById('order-items-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="
                    text-align: center;
                    padding: 40px;
                    color: #ff6b00;
                    font-size: 18px;
                    background-color: #fff5f0;
                    border-radius: 10px;
                    border: 2px solid #ff6b00;
                    margin: 20px 0;
                ">
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
        console.log('Инициализация OrdersManager для страницы оформления заказа...');
        ordersManager = new OrdersManager();
        
        // Экспортируем для отладки
        window.ordersManager = ordersManager;
    });
}
