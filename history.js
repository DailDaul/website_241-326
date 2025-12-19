class OrderHistory {
    constructor() {
        this.API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
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
            
            const response = await fetch(`${this.API_URL}/orders`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            this.orders = await response.json();
            
            // Сортируем по убыванию даты
            this.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            this.displayOrders();
            
        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            this.showErrorMessage('Не удалось загрузить историю заказов. Пожалуйста, попробуйте позже.');
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
                // Здесь можно добавить фильтрацию заказов
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
            
            const response = await fetch(`${this.API_URL}/order/${this.currentOrderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Заказ успешно изменён', true);
                this.closeAllModals();
                await this.loadOrders();
            } else {
                throw new Error(result.message || 'Ошибка при изменении заказа');
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении заказа:', error);
            this.showNotification(`Ошибка: ${error.message}`, false);
        }
    }
    
    async deleteOrder() {
        try {
            const response = await fetch(`${this.API_URL}/order/${this.currentOrderId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Заказ успешно удалён', true);
                this.closeAllModals();
                await this.loadOrders();
            } else {
                throw new Error(result.message || 'Ошибка при удалении заказа');
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
            notification.innerHTML = `
                <div class="notification" style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <p style="color: ${isSuccess ? 'green' : 'red'}; margin-bottom: 15px;">${message}</p>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #ff6b00; color: white; border: none; padding: 8px 20px; 
                        border-radius: 5px; cursor: pointer;">OK</button>
                </div>
            `;
            document.body.appendChild(notification);
            
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
