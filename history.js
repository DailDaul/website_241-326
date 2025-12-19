// history.js
class OrderHistory {
    constructor() {
        this.STORAGE_KEY = 'foodConstruct_orders';
        this.currentOrderId = null;
        this.orders = [];
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadOrders();
    }
    
    async loadOrders() {
        try {
            const container = document.getElementById('orders-container');
            container.innerHTML = '<div class="loading-message">Загрузка истории заказов...</div>';
            
            // Загружаем заказы из localStorage
            this.orders = this.getOrdersFromStorage();
            
            // Если нет заказов, пытаемся загрузить старые данные
            if (!this.orders || this.orders.length === 0) {
                this.migrateOldOrders();
                this.orders = this.getOrdersFromStorage();
            }
            
            // Сортируем по убыванию даты
            this.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            this.displayOrders();
            
        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            this.showErrorMessage('Не удалось загрузить историю заказов.');
        }
    }
    
    getOrdersFromStorage() {
        try {
            const savedOrders = localStorage.getItem(this.STORAGE_KEY);
            return savedOrders ? JSON.parse(savedOrders) : [];
        } catch (error) {
            console.error('Ошибка при чтении заказов из localStorage:', error);
            return [];
        }
    }
    
    saveOrdersToStorage(orders) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении заказов в localStorage:', error);
            return false;
        }
    }
    
    migrateOldOrders() {
        // Пробуем получить заказ из старого формата (из orderStorage.js)
        try {
            const oldOrderKey = 'foodConstruct_order';
            const savedOrder = localStorage.getItem(oldOrderKey);
            
            if (savedOrder) {
                const parsedOrder = JSON.parse(savedOrder);
                const dishes = this.getDishesFromOrderData(parsedOrder);
                
                if (dishes.length > 0) {
                    // Создаем новый заказ из старого формата
                    const newOrder = {
                        id: Date.now(),
                        created_at: new Date().toISOString(),
                        full_name: localStorage.getItem('foodConstruct_user_name') || 'Гость',
                        email: localStorage.getItem('foodConstruct_user_email') || '',
                        phone: localStorage.getItem('foodConstruct_user_phone') || '',
                        delivery_address: localStorage.getItem('foodConstruct_user_address') || '',
                        delivery_type: 'asap',
                        delivery_time: null,
                        comment: '',
                        total_price: dishes.reduce((sum, dish) => sum + (dish.price || 0), 0),
                        dishes: dishes
                    };
                    
                    this.saveOrdersToStorage([newOrder]);
                    console.log('Мигрирован старый заказ в историю');
                }
            }
        } catch (error) {
            console.error('Ошибка при миграции старых заказов:', error);
        }
    }
    
    getDishesFromOrderData(orderData) {
        const dishes = [];
        
        // Получаем все блюда из заказа
        if (orderData.soup) {
            dishes.push({
                name: orderData.soup.name || 'Суп',
                price: orderData.soup.price || 0
            });
        }
        
        if (orderData.main) {
            dishes.push({
                name: orderData.main.name || 'Главное блюдо',
                price: orderData.main.price || 0
            });
        }
        
        if (orderData.starter) {
            dishes.push({
                name: orderData.starter.name || 'Салат',
                price: orderData.starter.price || 0
            });
        }
        
        if (orderData.drink) {
            dishes.push({
                name: orderData.drink.name || 'Напиток',
                price: orderData.drink.price || 0
            });
        }
        
        if (orderData.dessert) {
            dishes.push({
                name: orderData.dessert.name || 'Десерт',
                price: orderData.dessert.price || 0
            });
        }
        
        return dishes;
    }
    
    // Метод для добавления нового заказа (будет вызываться из orders.html)
    static addNewOrder(orderData) {
        try {
            const history = new OrderHistory();
            const orders = history.getOrdersFromStorage();
            
            // Создаем ID для нового заказа
            const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
            
            // Создаем новый заказ
            const newOrder = {
                id: newId,
                created_at: new Date().toISOString(),
                full_name: orderData.name,
                email: orderData.email,
                phone: orderData.phone,
                delivery_address: orderData.address,
                delivery_type: orderData.delivery_time,
                delivery_time: orderData.scheduled_time || null,
                comment: orderData.comment || '',
                total_price: orderData.total_price,
                dishes: orderData.dishes || []
            };
            
            // Добавляем в начало массива
            orders.unshift(newOrder);
            
            // Сохраняем
            history.saveOrdersToStorage(orders);
            
            console.log('Новый заказ добавлен в историю:', newOrder);
            return true;
            
        } catch (error) {
            console.error('Ошибка при добавлении нового заказа:', error);
            return false;
        }
    }
    
    displayOrders() {
        const container = document.getElementById('orders-container');
        
        if (!this.orders || this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    У вас пока нет заказов. Оформите первый заказ на странице 
                    <a href="orders.html">Оформить заказ</a>.
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Дата оформления</th>
                        <th>Состав заказа</th>
                        <th>Стоимость</th>
                        <th>Время доставки</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.orders.map((order, index) => this.createOrderRow(order, index + 1)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    createOrderRow(order, number) {
        const dishesText = order.dishes.map(dish => dish.name).join(', ');
        const formattedDate = this.formatDate(order.created_at);
        const deliveryTime = order.delivery_type === 'scheduled' 
            ? this.formatTime(order.delivery_time)
            : 'Как можно скорее (с 7:00 до 23:00)';
        
        return `
            <tr>
                <td class="order-number">${number}</td>
                <td class="order-date">${formattedDate}</td>
                <td class="order-composition" title="${dishesText}">${dishesText}</td>
                <td class="order-price">${order.total_price}Р</td>
                <td class="order-time">${deliveryTime}</td>
                <td class="order-actions">
                    <button class="action-btn view-btn" data-id="${order.id}" title="Подробнее">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${order.id}" title="Редактировать">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${order.id}" title="Удалить">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }
    
    setupEventListeners() {
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.getAttribute('data-filter');
                this.filterOrders(filter);
            });
        });
        
        // Делегирование событий для кнопок действий
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.action-btn');
            if (!target) return;
            
            const orderId = target.getAttribute('data-id');
            if (!orderId) return;
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) return;
            
            if (target.classList.contains('view-btn')) {
                this.showViewModal(order);
            } else if (target.classList.contains('edit-btn')) {
                this.showEditModal(order);
            } else if (target.classList.contains('delete-btn')) {
                this.showDeleteModal(order);
            }
        });
        
        // Закрытие модальных окон
        document.querySelectorAll('.close-modal, .cancel-btn, .ok-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Подтверждение удаления
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteOrder();
        });
        
        // Отправка формы редактирования
        document.getElementById('edit-order-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateOrder();
        });
        
        // Закрытие по клику вне модального окна
        window.addEventListener('click', (e) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }
    
    filterOrders(filter) {
        const rows = document.querySelectorAll('.orders-table tbody tr');
        
        rows.forEach(row => {
            if (filter === 'all') {
                row.style.display = '';
            } else if (filter === 'delivered') {
                // Здесь можно добавить логику для фильтрации доставленных
                row.style.display = '';
            } else if (filter === 'pending') {
                // Здесь можно добавить логику для фильтрации активных
                row.style.display = '';
            }
        });
    }
    
    showViewModal(order) {
        this.currentOrderId = order.id;
        
        const dishesHTML = order.dishes.map(dish => `
            <li>
                <span class="dish-name">${dish.name}</span>
                <span class="dish-price">${dish.price}Р</span>
            </li>
        `).join('');
        
        const content = `
            <div class="order-info-section">
                <h3>Дата оформления</h3>
                <div class="info-item">
                    <span class="info-value">${this.formatDate(order.created_at)}</span>
                </div>
            </div>
            
            <div class="order-info-section">
                <h3>Доставка</h3>
                <div class="info-item">
                    <span class="info-label">Имя получателя</span>
                    <span class="info-value">${order.full_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Адрес доставки</span>
                    <span class="info-value">${order.delivery_address}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Время доставки</span>
                    <span class="info-value">${order.delivery_type === 'scheduled' ? this.formatTime(order.delivery_time) : 'Как можно скорее (с 7:00 до 23:00)'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Телефон</span>
                    <span class="info-value">${order.phone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${order.email}</span>
                </div>
            </div>
            
            ${order.comment ? `
            <div class="order-info-section">
                <h3>Комментарий</h3>
                <div class="info-item">
                    <span class="info-value">${order.comment}</span>
                </div>
            </div>
            ` : ''}
            
            <div class="order-info-section">
                <h3>Состав заказа</h3>
                <ul class="dishes-list">
                    ${dishesHTML}
                </ul>
            </div>
            
            <div class="order-total-price">
                Стоимость: ${order.total_price}Р
            </div>
        `;
        
        document.getElementById('view-modal-content').innerHTML = content;
        document.getElementById('view-modal').style.display = 'block';
    }
    
    showEditModal(order) {
        this.currentOrderId = order.id;
        
        const content = `
            <div class="order-info-section">
                <h3>Дата оформления</h3>
                <div class="info-item">
                    <span class="info-value">${this.formatDate(order.created_at)}</span>
                </div>
            </div>
            
            <div class="order-info-section">
                <h3>Доставка</h3>
                <div class="form-group">
                    <label for="edit-full_name">Имя получателя *</label>
                    <input type="text" id="edit-full_name" name="full_name" value="${order.full_name}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-delivery_address">Адрес доставки *</label>
                    <input type="text" id="edit-delivery_address" name="delivery_address" value="${order.delivery_address}" required>
                </div>
                
                <div class="form-group">
                    <label>Время доставки *</label>
                    <div class="radio-group">
                        <div class="radio-option">
                            <input type="radio" id="edit-delivery_asap" name="delivery_type" value="asap" ${order.delivery_type === 'asap' ? 'checked' : ''}>
                            <label for="edit-delivery_asap">Как можно скорее</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" id="edit-delivery_scheduled" name="delivery_type" value="scheduled" ${order.delivery_type === 'scheduled' ? 'checked' : ''}>
                            <label for="edit-delivery_scheduled">К указанному времени</label>
                        </div>
                    </div>
                    
                    <div id="edit-time-selection" class="time-selection" style="display: ${order.delivery_type === 'scheduled' ? 'block' : 'none'}">
                        <label for="edit-delivery_time">Укажите время доставки</label>
                        <input type="time" id="edit-delivery_time" name="delivery_time" value="${order.delivery_time || ''}" min="07:00" max="23:00">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-phone">Телефон *</label>
                    <input type="tel" id="edit-phone" name="phone" value="${order.phone}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-email">Email *</label>
                    <input type="email" id="edit-email" name="email" value="${order.email}" required>
                </div>
            </div>
            
            <div class="order-info-section">
                <h3>Комментарий</h3>
                <div class="form-group">
                    <textarea id="edit-comment" name="comment" placeholder="Ваш комментарий к заказу">${order.comment || ''}</textarea>
                </div>
            </div>
            
            <div class="order-info-section">
                <h3>Состав заказа</h3>
                <div class="info-item">
                    <span class="info-value">${order.dishes.map(d => d.name).join(', ')}</span>
                </div>
            </div>
            
            <div class="order-total-price">
                Стоимость: ${order.total_price}Р
            </div>
        `;
        
        document.getElementById('edit-modal-content').innerHTML = content;
        document.getElementById('edit-modal').style.display = 'block';
        
        // Настройка переключения времени доставки
        document.querySelectorAll('input[name="delivery_type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const timeSelection = document.getElementById('edit-time-selection');
                timeSelection.style.display = e.target.value === 'scheduled' ? 'block' : 'none';
            });
        });
    }
    
    showDeleteModal(order) {
        this.currentOrderId = order.id;
        document.getElementById('delete-modal').style.display = 'block';
    }
    
    async updateOrder() {
        try {
            const form = document.getElementById('edit-order-form');
            const formData = new FormData(form);
            
            const orderData = {
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                delivery_address: formData.get('delivery_address'),
                delivery_type: formData.get('delivery_type'),
                delivery_time: formData.get('delivery_time') || null,
                comment: formData.get('comment') || ''
            };
            
            // Находим заказ и обновляем его
            const orderIndex = this.orders.findIndex(o => o.id == this.currentOrderId);
            if (orderIndex !== -1) {
                // Сохраняем старые данные, которые не меняются
                const oldOrder = this.orders[orderIndex];
                this.orders[orderIndex] = {
                    ...oldOrder,
                    ...orderData
                };
                
                // Сохраняем в localStorage
                this.saveOrdersToStorage(this.orders);
                
                // Показываем уведомление об успехе
                this.showNotification('Заказ успешно изменён', true);
                this.closeAllModals();
                
                // Обновляем отображение
                this.displayOrders();
            } else {
                throw new Error('Заказ не найден');
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении заказа:', error);
            this.showNotification(`Ошибка: ${error.message}`, false);
        }
    }
    
    async deleteOrder() {
        try {
            // Находим заказ
            const orderIndex = this.orders.findIndex(o => o.id == this.currentOrderId);
            if (orderIndex !== -1) {
                // Удаляем заказ из массива
                this.orders.splice(orderIndex, 1);
                
                // Сохраняем в localStorage
                this.saveOrdersToStorage(this.orders);
                
                // Показываем уведомление об успехе
                this.showNotification('Заказ успешно удалён', true);
                this.closeAllModals();
                
                // Обновляем отображение
                this.displayOrders();
            } else {
                throw new Error('Заказ не найден');
            }
            
        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            this.showNotification(`Ошибка: ${error.message}`, false);
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentOrderId = null;
    }
    
    showNotification(message, isSuccess = false) {
        // Используем существующую функцию showNotification из orderValidator.js
        if (typeof showNotification !== 'undefined') {
            showNotification(message, isSuccess);
        } else {
            // Создаем простое уведомление
            const notification = document.createElement('div');
            notification.className = 'notification-overlay';
            notification.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            `;
            
            notification.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease;
                    text-align: center;
                ">
                    <h3 style="
                        font-size: 20px;
                        color: #333;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid ${isSuccess ? '#4CAF50' : '#ff6b00'};
                    ">${isSuccess ? 'Успешно!' : 'Ошибка'}</h3>
                    <p style="
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                        line-height: 1.5;
                    ">${message}</p>
                    <button style="
                        background-color: #ff6b00;
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        border-radius: 8px;
                        font-family: 'Oswald', sans-serif;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onclick="this.parentElement.parentElement.remove()">Окей</button>
                </div>
                <style>
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideIn {
                        from {
                            transform: translateY(-50px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                </style>
            `;
            
            document.body.appendChild(notification);
            
            // Автоматически закрываем через 3 секунды
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
    
    showErrorMessage(message) {
        const container = document.getElementById('orders-container');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Инициализация
let orderHistory;

document.addEventListener('DOMContentLoaded', () => {
    orderHistory = new OrderHistory();
});
