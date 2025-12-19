class OrdersManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Проверяем, что storageManager загружен
            if (typeof saveOrderToStorage === 'undefined') {
                console.error('storageManager.js не загружен!');
                throw new Error('storageManager.js не загружен');
            }
            
            // Загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            // Отображаем выбранные блюда
            this.displayOrderItems();
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Настраиваем валидацию формы
            this.setupFormValidation();
            
        } catch (error) {
            console.error('Ошибка при инициализации OrdersManager:', error);
            this.showErrorMessage('Ошибка загрузки данных заказа');
        }
    }
    
    async loadSavedOrder() {
        try {
            // Загружаем ключи из localStorage
            const savedOrderKeys = loadOrderFromStorage();
            
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
                    }
                }
            });
            
            console.log('Загружен заказ из localStorage:', this.selectedDishes);
            
            // Обновляем отображение заказа в форме
            this.updateOrderFormDisplay();
            
        } catch (error) {
            console.error('Ошибка при загрузке сохраненного заказа:', error);
            throw error;
        }
    }
    
    displayOrderItems() {
        const container = document.getElementById('order-items-container');
        const emptyMessage = document.getElementById('empty-order-message');
        
        if (!container) return;
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Проверяем, есть ли выбранные блюда
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        
        if (!hasSelectedDishes) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            return;
        }
        
        // Скрываем сообщение о пустом заказе
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
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
        // Обработчик для кнопок "Удалить"
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
    
    removeDishFromOrder(dishKeyword, category) {
        // Находим блюдо в массиве dishes
        const dish = dishes.find(d => d.keyword === dishKeyword);
        
        // Удаляем блюдо из текущего заказа
        this.selectedDishes[category] = null;
        
        // Удаляем из localStorage
        removeDishFromStorage(category);
        
        // Обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // Показываем небольшое уведомление
        if (dish) {
            console.log(`Блюдо "${dish.name}" удалено из заказа`);
            this.showToastNotification(`Блюдо "${dish.name}" удалено из заказа`);
        }
    }
    
    clearOrder() {
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
        const soupField = document.getElementById('order-soup');
        const mainField = document.getElementById('order-main');
        const starterField = document.getElementById('order-starter');
        const drinkField = document.getElementById('order-drink');
        const dessertField = document.getElementById('order-dessert');
        const totalField = document.getElementById('order-total-price');
        
        if (soupField) soupField.value = this.selectedDishes.soup ? this.selectedDishes.soup.name : '';
        if (mainField) mainField.value = this.selectedDishes.main ? this.selectedDishes.main.name : '';
        if (starterField) starterField.value = this.selectedDishes.starter ? this.selectedDishes.starter.name : '';
        if (drinkField) drinkField.value = this.selectedDishes.drink ? this.selectedDishes.drink.name : '';
        if (dessertField) dessertField.value = this.selectedDishes.dessert ? this.selectedDishes.dessert.name : '';
        
        // Рассчитываем и заполняем общую стоимость
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish && dish.price) {
                totalPrice += dish.price;
            }
        });
        
        if (totalField) totalField.value = totalPrice;
    }
    
    setupFormValidation() {
        const orderForm = document.getElementById('order-form');
        
        if (!orderForm) return;
        
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processOrderForm();
        });
    }
    
    async processOrderForm() {
        try {
            // Получаем данные формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const comment = document.getElementById('comment')?.value.trim() || '';
            
            // Проверяем заполнение обязательных полей
            if (!name || !email || !phone || !address) {
                showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            // Проверяем валидность email
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                showNotification('Введите корректный email адрес', false);
                return;
            }
            
            // Проверяем валидность телефона
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                showNotification('Введите корректный номер телефона', false);
                return;
            }
            
            // Проверяем, что выбрано хотя бы одно блюдо
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                showNotification('Выберите блюда для заказа', false);
                return;
            }
            
            // Проверяем валидность состава заказа
            const validation = validateOrder(this.selectedDishes);
            if (!validation.isValid) {
                showNotification(validation.message, false);
                return;
            }
            
            // Обрабатываем заказ
            await this.submitOrder(name, email, phone, address, comment);
            
        } catch (error) {
            console.error('Ошибка при обработке формы:', error);
            showNotification('Произошла ошибка. Пожалуйста, попробуйте еще раз.', false);
        }
    }
    
    async submitOrder(name, email, phone, address, comment) {
       console.log('🚀 === НАЧАЛО submitOrder ===');
       console.log('Данные формы:', { name, email, phone, address, comment });
       console.log('Выбранные блюда:', this.selectedDishes);
        try {
            // Собираем информацию о блюдах
            const dishesList = [];
            let totalPrice = 0;
            
            Object.values(this.selectedDishes).forEach(dish => {
                if (dish) {
                    dishesList.push({
                        name: dish.name,
                        price: dish.price
                    });
                    totalPrice += dish.price;
                }
            });
            
            // Определяем тип и время доставки
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            
            let deliveryType = 'asap';
            let deliveryTimeValue = null;
            
            if (deliveryTime === 'scheduled') {
                if (!scheduledTime) {
                    showNotification('Укажите время доставки', false);
                    return;
                }
                
                // Проверяем время
                const time = new Date(`2000-01-01T${scheduledTime}`);
                const hours = time.getHours();
                const minutes = time.getMinutes();
                
                if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
                    showNotification('Время доставки должно быть с 7:00 до 23:00', false);
                    return;
                }
                
                deliveryType = 'scheduled';
                deliveryTimeValue = scheduledTime;
            }
            
            // Создаем объект заказа
            const orderData = {
                name: name,
                email: email,
                phone: phone,
                address: address,
                comment: comment,
                delivery_type: deliveryType,
                delivery_time: deliveryTimeValue,
                dishes: dishesList,
                total_price: totalPrice
            };
            
            console.log('Сохранение заказа в историю:', orderData);
            
            // Сохраняем заказ в историю
            const saved = saveOrderToHistory(orderData);
            
            if (saved) {
                // Очищаем текущий заказ из localStorage
                clearOrderFromStorage();
                
                // Показываем сообщение об успехе
                showNotification('Заказ успешно оформлен! Вы можете просмотреть его в истории заказов.', true);
                
                // Очищаем форму
                document.getElementById('order-form').reset();
                
                // Очищаем текущий заказ
                this.selectedDishes = {
                    soup: null,
                    main: null,
                    starter: null,
                    drink: null,
                    dessert: null
                };
                
                // Обновляем отображение
                this.displayOrderItems();
                this.updateOrderFormDisplay();
                
            } else {
                showNotification('Ошибка при сохранении заказа в историю', false);
            }
            
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            showNotification('Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.', false);
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
    
    getOrderData() {
        return this.selectedDishes;
    }
    
    showToastNotification(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: fadeInOut 3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Добавляем стили анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('order-form');
    
    if (orderForm && window.ordersManager) {
        console.log('✅ Найдена форма и менеджер заказов');
        
        // Удаляем старые обработчики
        orderForm.replaceWith(orderForm.cloneNode(true));
        const newForm = document.getElementById('order-form');
        
        // Вешаем новый обработчик
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎯 Форма отправлена, вызываем submitOrder');
            
            // Получаем данные формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const comment = document.getElementById('comment')?.value.trim() || '';
            
            // Вызываем метод submitOrder
            await window.ordersManager.submitOrder(name, email, phone, address, comment);
            
            return false;
        }, true);
        
        console.log('✅ Новый обработчик формы установлен');
    }
});

// Инициализация менеджера заказов
let ordersManager;

document.addEventListener('DOMContentLoaded', () => {
    ordersManager = new OrdersManager();
});

// Экспорт для использования в других файлах
if (typeof window !== 'undefined') {
    window.ordersManager = ordersManager;
}
