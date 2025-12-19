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
            //загружаем блюда с API
            if (typeof loadDishes === 'undefined') {
                throw new Error('Функция loadDishes не найдена');
            }
            
            //загружаем сохраненный заказ
            await this.loadSavedOrder();
            
            //отображаем выбранные блюда
            this.displayOrderItems();
            
            //настраиваем обработчики событий
            this.setupEventListeners();
            
            //настраиваем валидацию формы
            this.setupFormValidation();
            
        } catch (error) {
            console.error('Ошибка при инициализации OrdersManager:', error);
            this.showErrorMessage('Ошибка загрузки данных заказа');
        }
    }
    
    async loadSavedOrder() {
        try {
            //загружаем ключи из localStorage
            const savedOrderKeys = loadOrderFromStorage();
            
            //загружаем все блюда с API
            const dishes = await loadDishes();
            if (!dishes || !Array.isArray(dishes)) {
                throw new Error('Не удалось загрузить блюда с API');
            }
            
            //восстанавливаем полные данные блюд
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
            
            //обновляем отображение заказа в форме
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
        
        //очищаем контейнер
        container.innerHTML = '';
        
        //проверяем, есть ли выбранные блюда
        const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
        
        if (!hasSelectedDishes) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            return;
        }
        
        //скрываем сообщение о пустом заказе
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        //отображаем выбранные блюда
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
        //обработчик для кнопок "Удалить"
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
        
        //обработчик для кнопки "Очистить заказ"
        const clearOrderBtn = document.getElementById('clear-order-btn');
        if (clearOrderBtn) {
            clearOrderBtn.addEventListener('click', () => {
                this.clearOrder();
            });
        }
    }
    
    removeDishFromOrder(dishKeyword, category) {
        //находим блюдо в массиве dishes
        const dish = dishes.find(d => d.keyword === dishKeyword);
        
        //удаляем блюдо из текущего заказа
        this.selectedDishes[category] = null;
        
        //удаляем из localStorage
        removeDishFromStorage(category);
        
        //обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        //показываем небольшое уведомление (опционально)
        if (dish) {
            //можно использовать консоль для отладки
            console.log(`Блюдо "${dish.name}" удалено из заказа`);
            
            //или показать маленькое тостовое уведомление
            this.showToastNotification(`Блюдо "${dish.name}" удалено из заказа`);
        }
    }
    
    clearOrder() {
        //очищаем текущий заказ
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        //очищаем localStorage
        clearOrderFromStorage();
        
        //обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        //показываем уведомление
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
        
        //обновляем отображение для каждой категории
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
        
        //управляем отображением сообщения "Ничего не выбрано"
        if (emptyMessage) {
            emptyMessage.style.display = hasSelectedDishes ? 'none' : 'block';
        }
        
        //обновляем общую стоимость
        if (totalPriceElement) {
            totalPriceElement.textContent = totalPrice;
        }
        
        //заполняем скрытые поля формы
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
        //заполняем скрытые поля формы
        document.getElementById('order-soup').value = this.selectedDishes.soup ? this.selectedDishes.soup.name : '';
        document.getElementById('order-main').value = this.selectedDishes.main ? this.selectedDishes.main.name : '';
        document.getElementById('order-starter').value = this.selectedDishes.starter ? this.selectedDishes.starter.name : '';
        document.getElementById('order-drink').value = this.selectedDishes.drink ? this.selectedDishes.drink.name : '';
        document.getElementById('order-dessert').value = this.selectedDishes.dessert ? this.selectedDishes.dessert.name : '';
        
        //рассчитываем и заполняем общую стоимость
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish && dish.price) {
                totalPrice += dish.price;
            }
        });
        document.getElementById('order-total-price').value = totalPrice;
    }
    
    setupFormValidation() {
        const orderForm = document.getElementById('order-form');
        
        if (!orderForm) return;
        
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            //проверяем заполнение полей формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const comment = document.getElementById('comment')?.value.trim() || '';
            
            if (!name || !email || !phone || !address) {
                showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            //проверяем валидность email
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                showNotification('Введите корректный email адрес', false);
                return;
            }
            
            //проверяем валидность телефона
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                showNotification('Введите корректный номер телефона', false);
                return;
            }
            
            //проверяем, что выбрано хотя бы одно блюдо
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                showNotification('Выберите блюда для заказа', false);
                return;
            }
            
            //проверяем валидность состава заказа
            const validation = validateOrder(this.selectedDishes);
            if (!validation.isValid) {
                showNotification(validation.message, false);
                return;
            }
            
            //отправляем заказ
            await this.submitOrder(name, email, phone, address, comment);
        });
    }
    
    async submitOrder(name, email, phone, address, comment) {
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
            
            // Проверяем время доставки
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
            
            console.log('Сохранение заказа:', orderData);
            
            // Сохраняем заказ в историю
            const saved = saveOrderToHistory(orderData);
            
            if (saved) {
                // Очищаем localStorage текущего заказа
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

// Глобальная функция для сохранения заказа в историю
function saveOrderToHistory(orderData) {
    try {
        // Создаем объект заказа для истории
        const order = {
            id: Date.now().toString(),
            full_name: orderData.name,
            email: orderData.email,
            phone: orderData.phone,
            delivery_address: orderData.address,
            delivery_type: orderData.delivery_type,
            delivery_time: orderData.delivery_time,
            comment: orderData.comment || '',
            dishes: orderData.dishes || [],
            dishNames: orderData.dishes.map(d => d.name).join(', '),
            total_price: orderData.total_price || 0,
            created_at: new Date().toISOString()
        };
        
        // Сохраняем в localStorage
        const storageKey = 'foodConstruct_order_history';
        const savedOrders = localStorage.getItem(storageKey);
        let orders = [];
        
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
        
        orders.push(order);
        localStorage.setItem(storageKey, JSON.stringify(orders));
        
        console.log('Заказ сохранен в историю:', order);
        return true;
        
    } catch (error) {
        console.error('Ошибка при сохранении заказа в историю:', error);
        return false;
    }
}

//инициализируем менеджер заказов
let ordersManager;

document.addEventListener('DOMContentLoaded', () => {
    ordersManager = new OrdersManager();
});

// Экспорт для использования в других файлах
if (typeof window !== 'undefined') {
    window.ordersManager = ordersManager;
    window.saveOrderToHistory = saveOrderToHistory;
}
