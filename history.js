//управление страницей истории заказов
class HistoryManager {
    constructor() {
        this.orders = [];
        this.currentOrderId = null;
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadOrders();
    }
    
    setupEventListeners() {
        // Кнопка повторной попытки
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            this.loadOrders();
        });
        
        // Закрытие модальных окон
        document.getElementById('details-close-btn')?.addEventListener('click', () => {
            this.closeModal('order-details-modal');
        });
        
        document.getElementById('details-ok-btn')?.addEventListener('click', () => {
            this.closeModal('order-details-modal');
        });
        
        document.getElementById('edit-close-btn')?.addEventListener('click', () => {
            this.closeModal('order-edit-modal');
        });
        
        document.getElementById('edit-cancel-btn')?.addEventListener('click', () => {
            this.closeModal('order-edit-modal');
        });
        
        document.getElementById('delete-close-btn')?.addEventListener('click', () => {
            this.closeModal('order-delete-modal');
        });
        
        document.getElementById('delete-cancel-btn')?.addEventListener('click', () => {
            this.closeModal('order-delete-modal');
        });
        
        // Подтверждение удаления
        document.getElementById('delete-confirm-btn')?.addEventListener('click', () => {
            this.deleteOrder(this.currentOrderId);
        });
        
        // Форма редактирования
        document.getElementById('edit-order-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateOrder(this.currentOrderId);
        });
        
        // Закрытие модальных окон по клику вне их
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    async loadOrders() {
        try {
            this.showLoading();
            
            // Загружаем из localStorage через storageManager
            this.orders = loadOrderHistory();
            
            // Сортируем по убыванию даты
            this.orders.sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            
            this.displayOrders();
            
        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            this.showError('Не удалось загрузить заказы. Пожалуйста, попробуйте позже.');
        }
    }
    
    displayOrders() {
        const tbody = document.getElementById('orders-tbody');
        const table = document.getElementById('orders-table');
        const noOrdersMessage = document.getElementById('no-orders-message');
        const loadingMessage = document.getElementById('loading-message');
        const errorMessage = document.getElementById('error-message');
        
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        
        if (!this.orders || this.orders.length === 0) {
            if (table) table.style.display = 'none';
            if (noOrdersMessage) noOrdersMessage.style.display = 'flex';
            return;
        }
        
        if (noOrdersMessage) noOrdersMessage.style.display = 'none';
        if (table) table.style.display = 'table';
        
        tbody.innerHTML = '';
        
        this.orders.forEach((order, index) => {
            const row = document.createElement('tr');
            
            // Форматируем состав заказа
            const dishNames = order.dishes.map(dish => dish.name).join(', ');
            
            // Форматируем время доставки
            let deliveryTime = 'Как можно скорее (с 7:00 до 23:00)';
            if (order.delivery_type === 'scheduled' && order.delivery_time) {
                deliveryTime = order.delivery_time;
            }
            
            // Форматируем дату
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) + ' ' + orderDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td>${dishNames}</td>
                <td>${order.total_price}Р</td>
                <td>${deliveryTime}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-btn view" data-order-id="${order.id}" data-action="view">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="action-btn edit" data-order-id="${order.id}" data-action="edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" data-order-id="${order.id}" data-action="delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Добавляем обработчики для кнопок действий
        tbody.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = button.getAttribute('data-order-id');
                const action = button.getAttribute('data-action');
                
                if (action === 'view') {
                    this.showOrderDetails(orderId);
                } else if (action === 'edit') {
                    this.showEditForm(orderId);
                } else if (action === 'delete') {
                    this.showDeleteConfirmation(orderId);
                }
            });
        });
    }
    
    async showOrderDetails(orderId) {
        try {
            const order = this.orders.find(o => o.id == orderId);
            if (!order) return;
            
            this.currentOrderId = orderId;
            
            // Форматируем дату
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) + ' ' + orderDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Форматируем время доставки
            let deliveryTimeDisplay = 'Как можно скорее (с 7:00 до 23:00)';
            if (order.delivery_type === 'scheduled' && order.delivery_time) {
                deliveryTimeDisplay = order.delivery_time;
            }
            
            // Форматируем тип доставки
            const deliveryTypeText = order.delivery_type === 'scheduled' ? 'К указанному времени' : 'Как можно скорее';
            
            // Формируем список блюд
            const dishesHTML = order.dishes.map(dish => `
                <li>
                    <span>${dish.name}</span>
                    <span>${dish.price}Р</span>
                </li>
            `).join('');
            
            // Создаем HTML для деталей заказа
            const detailsHTML = `
                <div class="order-details-grid">
                    <h4 class="section-title">Информация о заказе</h4>
                    <div class="detail-row">
                        <span class="detail-label">Дата оформления:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    
                    <h4 class="section-title">Доставка</h4>
                    <div class="detail-row">
                        <span class="detail-label">Имя получателя:</span>
                        <span class="detail-value">${order.full_name || 'Не указано'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Адрес доставки:</span>
                        <span class="detail-value">${order.delivery_address || 'Не указано'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Время доставки:</span>
                        <span class="detail-value">${deliveryTimeDisplay}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Тип доставки:</span>
                        <span class="detail-value">${deliveryTypeText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Телефон:</span>
                        <span class="detail-value">${order.phone || 'Не указан'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${order.email || 'Не указан'}</span>
                    </div>
                    
                    ${order.comment ? `
                        <h4 class="section-title">Комментарий</h4>
                        <div class="detail-row">
                            <span class="detail-value">${order.comment}</span>
                        </div>
                    ` : ''}
                    
                    <h4 class="section-title">Состав заказа</h4>
                    <ul class="dishes-list">
                        ${dishesHTML}
                    </ul>
                    
                    <div class="detail-row">
                        <span class="detail-label">Общая стоимость:</span>
                        <span class="detail-value total">${order.total_price || 0}Р</span>
                    </div>
                </div>
            `;
            
            // Заполняем модальное окно
            document.getElementById('order-details-body').innerHTML = detailsHTML;
            
            // Показываем модальное окно
            this.showModal('order-details-modal');
            
        } catch (error) {
            console.error('Ошибка при загрузке деталей заказа:', error);
            this.showNotification('Не удалось загрузить детали заказа', false);
        }
    }
    
    async showEditForm(orderId) {
        try {
            const order = this.orders.find(o => o.id == orderId);
            if (!order) return;
            
            this.currentOrderId = orderId;
            
            // Форматируем время доставки для input[type="time"]
            let deliveryTimeValue = order.delivery_time || '';
            
            // Создаем HTML для формы редактирования
            const formHTML = `
                <div class="edit-form">
                    <div class="form-group">
                        <label for="edit-full-name">Имя получателя *</label>
                        <input type="text" id="edit-full-name" name="full_name" 
                               value="${order.full_name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-email">Email *</label>
                        <input type="email" id="edit-email" name="email" 
                               value="${order.email || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-phone">Телефон *</label>
                        <input type="tel" id="edit-phone" name="phone" 
                               value="${order.phone || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-address">Адрес доставки *</label>
                        <input type="text" id="edit-address" name="delivery_address" 
                               value="${order.delivery_address || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Тип доставки *</label>
                        <div class="radio-group">
                            <div class="radio-option">
                                <input type="radio" id="edit-delivery-asap" name="delivery_type" 
                                       value="asap" ${order.delivery_type === 'asap' ? 'checked' : ''}>
                                <label for="edit-delivery-asap">Как можно скорее (с 7:00 до 23:00)</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" id="edit-delivery-scheduled" name="delivery_type" 
                                       value="scheduled" ${order.delivery_type === 'scheduled' ? 'checked' : ''}>
                                <label for="edit-delivery-scheduled">К указанному времени</label>
                            </div>
                        </div>
                        
                        <input type="time" id="edit-delivery-time" name="delivery_time" 
                               value="${deliveryTimeValue}"
                               min="07:00" max="23:00"
                               style="display: ${order.delivery_type === 'scheduled' ? 'block' : 'none'}; 
                                      margin-top: 10px;"
                               ${order.delivery_type === 'scheduled' ? 'required' : ''}>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-comment">Комментарий к заказу</label>
                        <textarea id="edit-comment" name="comment" 
                                  rows="4">${order.comment || ''}</textarea>
                    </div>
                </div>
            `;
            
            // Заполняем форму
            document.getElementById('edit-order-form').innerHTML = formHTML;
            
            // Показываем модальное окно
            this.showModal('order-edit-modal');
            
        } catch (error) {
            console.error('Ошибка при загрузке формы редактирования:', error);
            this.showNotification('Не удалось загрузить форму редактирования', false);
        }
    }
    
    showDeleteConfirmation(orderId) {
        const order = this.orders.find(o => o.id == orderId);
        if (!order) return;
        
        this.currentOrderId = orderId;
        
        // Устанавливаем номер заказа в текст подтверждения
        document.getElementById('delete-order-id').textContent = orderId;
        
        // Показываем модальное окно
        this.showModal('order-delete-modal');
    }
    
    async updateOrder(orderId) {
        try {
            const form = document.getElementById('edit-order-form');
            const formData = new FormData(form);
            
            // Собираем данные
            const updatedData = {
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                delivery_address: formData.get('delivery_address'),
                delivery_type: formData.get('delivery_type'),
                comment: formData.get('comment'),
                delivery_time: formData.get('delivery_time') || null
            };
            
            // Обновляем заказ в localStorage
            const updated = updateOrderInHistory(orderId, updatedData);
            
            if (updated) {
                // Обновляем локальный список
                await this.loadOrders();
                
                // Закрываем модальное окно
                this.closeModal('order-edit-modal');
                
                // Показываем уведомление об успехе
                this.showNotification('Заказ успешно изменён', true);
                
            } else {
                this.showNotification('Не удалось обновить заказ', false);
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении заказа:', error);
            this.showNotification(`Ошибка при обновлении заказа: ${error.message}`, false);
        }
    }
    
    async deleteOrder(orderId) {
        try {
            // Удаляем заказ из localStorage
            const deleted = deleteOrderFromHistory(orderId);
            
            if (deleted) {
                // Обновляем локальный список
                await this.loadOrders();
                
                // Закрываем модальное окно
                this.closeModal('order-delete-modal');
                
                // Показываем уведомление об успехе
                this.showNotification('Заказ успешно удалён', true);
                
            } else {
                this.showNotification('Не удалось удалить заказ', false);
            }
            
        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            this.showNotification(`Ошибка при удалении заказа: ${error.message}`, false);
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    showLoading() {
        const loadingMessage = document.getElementById('loading-message');
        const errorMessage = document.getElementById('error-message');
        const noOrdersMessage = document.getElementById('no-orders-message');
        const table = document.getElementById('orders-table');
        
        if (loadingMessage) loadingMessage.style.display = 'flex';
        if (errorMessage) errorMessage.style.display = 'none';
        if (noOrdersMessage) noOrdersMessage.style.display = 'none';
        if (table) table.style.display = 'none';
    }
    
    showError(message) {
        const loadingMessage = document.getElementById('loading-message');
        const errorMessage = document.getElementById('error-message');
        const noOrdersMessage = document.getElementById('no-orders-message');
        const table = document.getElementById('orders-table');
        
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.style.display = 'flex';
            errorMessage.querySelector('p').textContent = message;
        }
        if (noOrdersMessage) noOrdersMessage.style.display = 'none';
        if (table) table.style.display = 'none';
    }
    
    showNotification(message, isSuccess) {
        const notification = document.createElement('div');
        notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${isSuccess ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="bi ${isSuccess ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация при загрузке страницы
let historyManager;

document.addEventListener('DOMContentLoaded', () => {
    historyManager = new HistoryManager();
});

if (typeof window !== 'undefined') {
    window.historyManager = historyManager;
}
