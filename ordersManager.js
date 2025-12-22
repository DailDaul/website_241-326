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
        // Получаем доступ к глобальному массиву dishes из displayDishes.js
        const globalDishes = window.dishes || [];
        
        //находим блюдо в массиве dishes
        const dish = globalDishes.find(d => d.keyword === dishKeyword);
        
        //удаляем блюдо из текущего заказа
        this.selectedDishes[category] = null;
        
        //удаляем из localStorage
        removeDishFromStorage(category);
        
        //обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        //показываем небольшое уведомление
        if (dish) {
            console.log(`Блюдо "${dish.name}" удалено из заказа`);
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
        if (typeof clearOrderFromStorage !== 'undefined') {
            clearOrderFromStorage();
        }
        
        //обновляем отображение
        this.displayOrderItems();
        this.updateOrderFormDisplay();
        
        //показываем уведомление
        this.showNotification('Текущий заказ успешно очищен', true);
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
            
            if (!name || !email || !phone || !address) {
                this.showNotification('Заполните все поля формы: имя, email, телефон и адрес', false);
                return;
            }
            
            //проверяем валидность email
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                this.showNotification('Введите корректный email адрес', false);
                return;
            }
            
            //проверяем валидность телефона
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            if (!phonePattern.test(phone)) {
                this.showNotification('Введите корректный номер телефона', false);
                return;
            }
            
            //проверяем, что выбрано хотя бы одно блюдо
            const hasSelectedDishes = Object.values(this.selectedDishes).some(dish => dish !== null);
            if (!hasSelectedDishes) {
                this.showNotification('Выберите блюда для заказа', false);
                return;
            }
            
            //проверяем валидность состава заказа
            if (typeof validateOrder !== 'undefined') {
                const validation = validateOrder(this.selectedDishes);
                if (!validation.isValid) {
                    this.showNotification(validation.message, false);
                    return;
                }
            }
            
            //отправляем заказ
            await this.submitOrder();
        });
    }
    
    async submitOrder() {
        try {
            //собираем данные формы
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
            const scheduledTime = document.getElementById('scheduled-time')?.value;
            const comment = document.getElementById('comment')?.value || '';
            
            //рассчитываем общую стоимость
            let totalPrice = 0;
            Object.values(this.selectedDishes).forEach(dish => {
                if (dish && dish.price) {
                    totalPrice += dish.price;
                }
            });
            
            //собираем данные заказа
            const orderData = {
                name: name,
                email: email,
                phone: phone,
                address: address,
                deliveryTime: deliveryTime === 'scheduled' ? scheduledTime : 'asap',
                dishes: this.selectedDishes,
                totalPrice: totalPrice,
                comment: comment,
                date: new Date().toISOString()
            };
            
            console.log('Оформление заказа:', orderData);
            
            //сохраняем заказ в историю
            if (typeof saveOrderToHistory !== 'undefined') {
                saveOrderToHistory(orderData);
            } else {
                console.error('Функция saveOrderToHistory не найдена');
            }
            
            //очищаем localStorage после успешной отправки
            if (typeof clearOrderFromStorage !== 'undefined') {
                clearOrderFromStorage();
            }
            
            //очищаем текущий заказ
            this.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            //обновляем отображение
            this.displayOrderItems();
            this.updateOrderFormDisplay();
            
            //показываем УСПЕШНОЕ уведомление
            const selectedDishes = Object.values(this.selectedDishes).filter(dish => dish !== null);
            const dishesList = selectedDishes.map(dish => `• ${dish.name} - ${dish.price}Р`).join('<br>');

            const successMessage = `
                <strong>Заказ успешно оформлен!</strong><br><br>
                <strong>Состав заказа:</strong><br>
                ${dishesList || 'Блюда не указаны'}<br><br>
                <strong>Общая стоимость:</strong> ${totalPrice}Р<br><br>
                <small>Заказ сохранен в истории заказов.</small>
            `;

            this.showNotification(successMessage, true);
            
            //очищаем форму
            document.getElementById('order-form').reset();
            
        } catch (error) {
            console.error('Ошибка при оформлении заказа:', error);
            this.showNotification('Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.', false);
        }
    }
    
    getDishesList() {
        let dishesList = '';
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish) {
                dishesList += `• ${dish.name} - ${dish.price}Р<br>`;
            }
        });
        return dishesList || 'Блюда не указаны';
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
    
    //метод для показа уведомлений
    showNotification(message, isSuccess) {
        if (typeof window.showNotification !== 'undefined') {
            window.showNotification(message, isSuccess);
        } else if (typeof showNotification !== 'undefined') {
            showNotification(message, isSuccess);
        } else {
            console.log(`${isSuccess ? 'Успех:' : 'Ошибка:'} ${message}`);
            alert(message);
        }
    }
    
    //вспомогательный метод для тостовых уведомлений
    showToastNotification(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            animation: slideInUp 0.3s ease;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
        
        // Добавляем стили для анимации
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOutDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

//инициализируем менеджер заказов
let ordersManager;

document.addEventListener('DOMContentLoaded', () => {
    ordersManager = new OrdersManager();
});
