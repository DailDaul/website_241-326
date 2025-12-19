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
            // Загружаем блюда с API
            if (typeof loadDishes === 'undefined') {
                throw new Error('Функция loadDishes не найдена');
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
        
        // Обработчик для кнопки "Очистить заказ"
        const clearOrderBtn = document.getElementById('clear-order-btn');
        if (clearOrderBtn) {
            clearOrderBtn.addEventListener('click', () => {
                this.clearOrder();
            });
        }
    }
    
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
                    totalPrice += Number(dish.price);
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
        document.getElementById('order-soup').value = this.selectedDishes.soup ? this.selectedDishes.soup.name : '';
        document.getElementById('order-main').value = this.selectedDishes.main ? this.selectedDishes.main.name : '';
        document.getElementById('order-starter').value = this.selectedDishes.starter ? this.selectedDishes.starter.name : '';
        document.getElementById('order-drink').value = this.selectedDishes.drink ? this.selectedDishes.drink.name : '';
        document.getElementById('order-dessert').value = this.selectedDishes.dessert ? this.selectedDishes.dessert.name : '';
        
        // Рассчитываем и заполняем общую стоимость
        let totalPrice = this.calculateTotalPrice();
        document.getElementById('order-total-price').value = totalPrice;
    }
    
    // Метод для расчета общей стоимости
    calculateTotalPrice() {
        let totalPrice = 0;
        
        if (this.selectedDishes.soup && this.selectedDishes.soup.price) {
            totalPrice += Number(this.selectedDishes.soup.price);
        }
        
        if (this.selectedDishes.main && this.selectedDishes.main.price) {
            totalPrice += Number(this.selectedDishes.main.price);
        }
        
        if (this.selectedDishes.starter && this.selectedDishes.starter.price) {
            totalPrice += Number(this.selectedDishes.starter.price);
        }
        
        if (this.selectedDishes.drink && this.selectedDishes.drink.price) {
            totalPrice += Number(this.selectedDishes.drink.price);
        }
        
        if (this.selectedDishes.dessert && this.selectedDishes.dessert.price) {
            totalPrice += Number(this.selectedDishes.dessert.price);
        }
        
        console.log('Рассчитанная стоимость:', totalPrice, 'Выбранные блюда:', this.selectedDishes);
        return totalPrice;
    }
    
    // Метод для получения массива блюд - ЗАМЕНИТЕ НА ЭТОТ
getDishesArray() {
    const dishes = [];
    
    // Простой перебор всех категорий
    const categories = ['soup', 'main', 'starter', 'drink', 'dessert'];
    
    categories.forEach(category => {
        const dish = this.selectedDishes[category];
        if (dish && dish.name && dish.price !== undefined) {
            dishes.push({
                name: dish.name,
                price: Number(dish.price) || 0
            });
        }
    });
    
    console.log('Собранные блюда:', dishes);
    return dishes;
    }
    
    // Метод для очистки текущего заказа
    clearCurrentOrder() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
    }
    
    getOrderData() {
        return this.selectedDishes;
    }
    
    setupFormValidation() {
        const orderForm = document.getElementById('order-form');
        
        if (!orderForm) return;
        
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Проверяем заполнение полей формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            
            if (!name || !email || !phone || !address) {
                showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            // Если выбрано "К указанному времени", проверяем заполнение времени
            if (deliveryTime === 'scheduled' && !scheduledTime) {
                showNotification('Укажите время доставки', false);
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
            
            // Отправляем заказ
            await this.submitOrder();
        });
    }
    
    async submitOrder() {
    try {
        console.log('=== НАЧАЛО ОФОРМЛЕНИЯ ЗАКАЗА ===');
        
        // 1. ПРОВЕРКА ДАННЫХ ФОРМЫ
        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const address = document.getElementById('address')?.value.trim();
        const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
        const scheduledTime = document.getElementById('scheduled-time')?.value;
        
        console.log('📝 Данные формы:', { name, email, phone, address, deliveryTime, scheduledTime });
        
        if (!name || !email || !phone || !address) {
            showNotification('Заполните все поля формы: имя, email, телефон и адрес');
            return;
        }
        
        // 2. ПРОВЕРКА ВЫБРАННЫХ БЛЮД
        console.log('🍽️ Выбранные блюда:', this.selectedDishes);
        
        const dishes = [];
        let totalPrice = 0;
        
        // Собираем все выбранные блюда
        if (this.selectedDishes.soup) {
            dishes.push({
                name: this.selectedDishes.soup.name,
                price: Number(this.selectedDishes.soup.price)
            });
            totalPrice += Number(this.selectedDishes.soup.price);
        }
        
        if (this.selectedDishes.main) {
            dishes.push({
                name: this.selectedDishes.main.name,
                price: Number(this.selectedDishes.main.price)
            });
            totalPrice += Number(this.selectedDishes.main.price);
        }
        
        if (this.selectedDishes.starter) {
            dishes.push({
                name: this.selectedDishes.starter.name,
                price: Number(this.selectedDishes.starter.price)
            });
            totalPrice += Number(this.selectedDishes.starter.price);
        }
        
        if (this.selectedDishes.drink) {
            dishes.push({
                name: this.selectedDishes.drink.name,
                price: Number(this.selectedDishes.drink.price)
            });
            totalPrice += Number(this.selectedDishes.drink.price);
        }
        
        if (this.selectedDishes.dessert) {
            dishes.push({
                name: this.selectedDishes.dessert.name,
                price: Number(this.selectedDishes.dessert.price)
            });
            totalPrice += Number(this.selectedDishes.dessert.price);
        }
        
        console.log('📊 Собрано блюд:', dishes.length);
        console.log('💰 Общая стоимость:', totalPrice);
        
        if (dishes.length === 0) {
            showNotification('Ошибка: не выбраны блюда для заказа');
            return;
        }
        
        // 3. ПРОВЕРКА ВАЛИДНОСТИ ЗАКАЗА
        const validation = validateOrder(this.selectedDishes);
        if (!validation.isValid) {
            showNotification(validation.message, false);
            return;
        }
        
        // 4. СОХРАНЕНИЕ В LOCALSTORAGE
        console.log('💾 Начинаем сохранение заказа в историю...');
        
        // Создаем объект заказа
        const newOrder = {
            id: Date.now(), // Используем timestamp как ID
            created_at: new Date().toISOString(),
            full_name: name,
            email: email,
            phone: phone,
            delivery_address: address,
            delivery_type: deliveryTime === 'scheduled' ? 'scheduled' : 'asap',
            delivery_time: scheduledTime || null,
            comment: '',
            total_price: totalPrice,
            dishes: dishes
        };
        
        console.log('📄 Новый заказ для сохранения:', newOrder);
        
        // Получаем существующие заказы
        const STORAGE_KEY = 'foodConstruct_orders';
        let existingOrders = [];
        
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                existingOrders = JSON.parse(saved);
                console.log('📚 Найдено существующих заказов:', existingOrders.length);
            }
        } catch (e) {
            console.error('Ошибка чтения заказов:', e);
            existingOrders = [];
        }
        
        // Добавляем новый заказ в начало
        existingOrders.unshift(newOrder);
        
        // Сохраняем
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existingOrders));
            console.log('✅ Заказ сохранен! Всего заказов:', existingOrders.length);
            
            // Дополнительная проверка
            const verify = localStorage.getItem(STORAGE_KEY);
            if (verify) {
                const parsed = JSON.parse(verify);
                console.log('🔍 Проверка: сохранено заказов:', parsed.length);
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
            showNotification('Ошибка сохранения заказа. Попробуйте еще раз.');
            return;
        }
        
        // 5. ОЧИСТКА ТЕКУЩЕГО ЗАКАЗА
        try {
            // Очищаем основной заказ
            localStorage.removeItem('foodConstruct_order');
            
            // Очищаем в памяти
            this.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            console.log('🧹 Текущий заказ очищен');
        } catch (error) {
            console.error('Ошибка очистки заказа:', error);
        }
        
        // 6. СОХРАНЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
        try {
            localStorage.setItem('foodConstruct_user_name', name);
            localStorage.setItem('foodConstruct_user_email', email);
            localStorage.setItem('foodConstruct_user_phone', phone);
            localStorage.setItem('foodConstruct_user_address', address);
            console.log('👤 Данные пользователя сохранены');
        } catch (error) {
            console.error('Ошибка сохранения данных пользователя:', error);
        }
        
        // 7. УВЕДОМЛЕНИЕ ОБ УСПЕХЕ
        const dishesList = dishes.map(dish => `• ${dish.name} (${dish.price}Р)`).join('<br>');
        const deliveryText = deliveryTime === 'scheduled' 
            ? `К ${scheduledTime}` 
            : 'Как можно скорее (с 7:00 до 23:00)';
        
        const successMessage = `
            <strong>Заказ успешно оформлен!</strong><br><br>
            <strong>Номер заказа:</strong> #${newOrder.id.toString().slice(-6)}<br><br>
            <strong>Доставка:</strong><br>
            ${name}<br>
            ${address}<br>
            ${deliveryText}<br><br>
            <strong>Состав заказа:</strong><br>
            ${dishesList}<br><br>
            <strong>Итого:</strong> ${totalPrice}Р<br><br>
            <small>Заказ сохранен в истории заказов.</small>
        `;
        
        showNotification(successMessage, true);
        
        // 8. ОЧИСТКА ФОРМЫ
        document.getElementById('order-form').reset();
        
        // 9. ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        // 10. ПЕРЕХОД НА СТРАНИЦУ ИСТОРИИ
        console.log('🔄 Через 3 секунды переход на страницу истории...');
        setTimeout(() => {
            window.location.href = 'history.html';
        }, 3000);
        
    } catch (error) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
        showNotification('Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.', false);
        }
    }

// Метод для сохранения заказа в историю
saveOrderToHistory(name, email, phone, address, deliveryTime, scheduledTime, totalPrice, dishes) {
    try {
        const STORAGE_KEY = 'foodConstruct_orders';
        
        // Получаем существующие заказы
        let existingOrders = [];
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                existingOrders = JSON.parse(savedData);
            } catch (e) {
                console.error('Ошибка парсинга существующих заказов:', e);
                existingOrders = [];
            }
        }
        
        // Создаем новый ID
        const newId = existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.id || 0)) + 1 : 1;
        
        // Создаем новый заказ
        const newOrder = {
            id: newId,
            created_at: new Date().toISOString(),
            full_name: name,
            email: email,
            phone: phone,
            delivery_address: address,
            delivery_type: deliveryTime === 'scheduled' ? 'scheduled' : 'asap',
            delivery_time: scheduledTime || null,
            comment: '',
            total_price: totalPrice,
            dishes: dishes
        };
        
        console.log('Создаем новый заказ для истории:', newOrder);
        
        // Добавляем в начало массива
        existingOrders.unshift(newOrder);
        
        // Сохраняем
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingOrders));
        
        console.log('Заказ сохранен в историю. Всего заказов:', existingOrders.length);
        
        return true;
        
    } catch (error) {
        console.error('Критическая ошибка при сохранении заказа в историю:', error);
        return false;
        }
    }
    
    // Метод для сохранения заказа в историю - ЗАМЕНИТЕ НА ЭТОТ
    saveOrderToHistory(orderData) {
    try {
        const STORAGE_KEY = 'foodConstruct_orders';
        
        // Получаем существующие заказы
        let existingOrders = [];
        try {
            const savedOrders = localStorage.getItem(STORAGE_KEY);
            if (savedOrders) {
                existingOrders = JSON.parse(savedOrders);
                console.log(`Найдено ${existingOrders.length} существующих заказов`);
            }
        } catch (e) {
            console.error('Ошибка при чтении истории заказов:', e);
            existingOrders = [];
        }
        
        // Создаем новый заказ с гарантированными данными
        const newOrder = {
            id: existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.id || 0)) + 1 : 1,
            created_at: new Date().toISOString(),
            full_name: orderData.name || 'Гость',
            email: orderData.email || '',
            phone: orderData.phone || '',
            delivery_address: orderData.address || '',
            delivery_type: orderData.delivery_time === 'scheduled' ? 'scheduled' : 'asap',
            delivery_time: orderData.scheduled_time || null,
            comment: orderData.comment || '',
            total_price: orderData.total_price || 0,
            dishes: orderData.dishes || []
        };
        
        // Проверяем данные перед сохранением
        console.log('Новый заказ для сохранения:', newOrder);
        
        // Добавляем новый заказ в начало массива
        existingOrders.unshift(newOrder);
        
        // Сохраняем обратно в localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingOrders));
        
        // Дополнительная проверка
        const verify = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(verify);
        console.log(`Проверка: сохранено ${parsed.length} заказов, последний:`, parsed[0]);
        
        return true;
        
    } catch (error) {
        console.error('❌ Критическая ошибка при сохранении заказа в историю:', error);
        return false;
        }
    }
    
    showToastNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                font-family: 'Oswald', sans-serif;
                font-size: 14px;
                animation: slideIn 0.3s ease;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
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

// Инициализируем менеджер заказов
let ordersManager;

document.addEventListener('DOMContentLoaded', () => {
    ordersManager = new OrdersManager();
});
