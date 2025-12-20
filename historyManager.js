class HistoryManager {
    constructor() {
        this.orders = [];
        this.currentOrderId = null;
        this.apiBaseUrl = 'https://edu.std-900.ist.mospolytech.ru';
        this.init();
    }

    async init() {
        await this.loadOrders();
        this.setupEventListeners();
        this.setupModalListeners();
    }

    async loadOrders() {
        const container = document.getElementById('orders-container');
        
        try {
            // Загружаем заказы с API
            const response = await fetch(`${this.apiBaseUrl}/labs/api/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();
            this.orders = Array.isArray(data) ? data : [];
            
            if (this.orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-message">
                        У вас пока нет заказов. <a href="lunch.html">Создайте первый заказ</a>
                    </div>
                `;
                return;
            }

            // Сортируем по убыванию даты
            this.orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
            
            this.renderOrdersTable();
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            container.innerHTML = `
                <div class="error-message">
                    Ошибка загрузки заказов. Пожалуйста, попробуйте позже.
                </div>
            `;
        }
    }

    renderOrdersTable() {
        const container = document.getElementById('orders-container');
        
        let tableHTML = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Дата</th>
                        <th>Состав заказа</th>
                        <th>Стоимость</th>
                        <th>Время доставки</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.orders.forEach((order, index) => {
            const dishesList = this.getDishesList(order);
            const deliveryTime = this.getDeliveryTimeDisplay(order);
            const orderDate = this.formatDate(order.order_date);
            
            tableHTML += `
                <tr data-order-id="${order.id}">
                    <td>${index + 1}</td>
                    <td>${orderDate}</td>
                    <td>${dishesList}</td>
                    <td>${order.total_price || 0}Р</td>
                    <td>${deliveryTime}</td>
                    <td>
                        <div class="order-actions">
                            <button class="action-btn view" title="Подробнее" onclick="historyManager.viewOrder(${order.id})">
                                <i class="bi bi-eye-fill"></i>
                            </button>
                            <button class="action-btn edit" title="Редактировать" onclick="historyManager.editOrder(${order.id})">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="action-btn delete" title="Удалить" onclick="historyManager.deleteOrder(${order.id})">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    getDishesList(order) {
        const dishes = [];
        
        // Проверяем различные возможные структуры данных
        if (order.dishes) {
            if (typeof order.dishes === 'string') {
                try {
                    const parsed = JSON.parse(order.dishes);
                    if (Array.isArray(parsed)) {
                        dishes.push(...parsed);
                    }
                } catch (e) {
                    dishes.push(order.dishes);
                }
            } else if (Array.isArray(order.dishes)) {
                dishes.push(...order.dishes);
            }
        }
        
        // Проверяем отдельные поля блюд
        const dishFields = ['soup', 'main', 'starter', 'drink', 'dessert'];
        dishFields.forEach(field => {
            if (order[field] && order[field].name) {
                dishes.push(order[field].name);
            } else if (typeof order[field] === 'string' && order[field].trim()) {
                dishes.push(order[field]);
            }
        });

        return dishes.length > 0 ? dishes.slice(0, 3).join(', ') + (dishes.length > 3 ? '...' : '') : 'Блюда не указаны';
    }

    getDeliveryTimeDisplay(order) {
        if (order.delivery_type === 'scheduled' && order.delivery_time) {
            return order.delivery_time;
        }
        return 'Как можно скорее (с 7:00 до 23:00)';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Заполняем модальное окно
        document.getElementById('view-order-id').textContent = order.id || '-';
        document.getElementById('view-order-date').textContent = this.formatDate(order.order_date);
        document.getElementById('view-order-name').textContent = order.full_name || order.name || '-';
        document.getElementById('view-order-email').textContent = order.email || '-';
        document.getElementById('view-order-phone').textContent = order.phone || '-';
        document.getElementById('view-order-address').textContent = order.delivery_address || '-';
        document.getElementById('view-order-time').textContent = this.getDeliveryTimeDisplay(order);
        document.getElementById('view-order-price').textContent = `${order.total_price || 0}Р`;
        document.getElementById('view-order-comment').textContent = order.comment || '-';

        // Заполняем список блюд
        const dishesContainer = document.getElementById('view-order-dishes');
        dishesContainer.innerHTML = '';
        
        const dishes = this.getAllDishes(order);
        dishes.forEach(dish => {
            const dishElement = document.createElement('div');
            dishElement.className = 'order-dish-item';
            dishElement.innerHTML = `
                <span>${dish.name}</span>
                <span>${dish.price || ''}${dish.price ? 'Р' : ''}</span>
            `;
            dishesContainer.appendChild(dishElement);
        });

        this.showModal('view-order-modal');
    }

    getAllDishes(order) {
        const dishes = [];
        
        const dishFields = [
            { field: 'soup', name: 'Суп' },
            { field: 'main', name: 'Главное блюдо' },
            { field: 'starter', name: 'Салат/Стартер' },
            { field: 'drink', name: 'Напиток' },
            { field: 'dessert', name: 'Десерт' }
        ];

        dishFields.forEach(({ field, name }) => {
            if (order[field]) {
                if (typeof order[field] === 'object' && order[field].name) {
                    dishes.push({
                        name: order[field].name,
                        price: order[field].price
                    });
                } else if (typeof order[field] === 'string') {
                    dishes.push({ name: order[field] });
                }
            }
        });

        return dishes;
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentOrderId = orderId;

        // Заполняем форму редактирования
        document.getElementById('edit-order-id').value = orderId;
        document.getElementById('edit-order-name').value = order.full_name || order.name || '';
        document.getElementById('edit-order-email').value = order.email || '';
        document.getElementById('edit-order-phone').value = order.phone || '';
        document.getElementById('edit-order-address').value = order.delivery_address || '';
        document.getElementById('edit-order-comment').value = order.comment || '';

        // Устанавливаем тип доставки
        if (order.delivery_type === 'scheduled') {
            document.getElementById('edit-delivery-scheduled').checked = true;
            document.getElementById('edit-time-panel').style.display = 'block';
            if (order.delivery_time) {
                document.getElementById('edit-delivery-time').value = order.delivery_time;
            }
        } else {
            document.getElementById('edit-delivery-asap').checked = true;
            document.getElementById('edit-time-panel').style.display = 'none';
        }

        this.showModal('edit-order-modal');
    }

    async deleteOrder(orderId) {
        this.currentOrderId = orderId;
        this.showModal('delete-order-modal');
    }

    async confirmDelete() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/labs/api/orders/${this.currentOrderId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            // Удаляем заказ из списка
            this.orders = this.orders.filter(order => order.id !== this.currentOrderId);
            
            // Обновляем таблицу
            this.renderOrdersTable();
            
            // Закрываем модальное окно
            this.hideModal('delete-order-modal');
            
            // Показываем уведомление об успехе
            this.showNotification('Заказ успешно удалён', true);
            
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            this.showNotification('Ошибка при удалении заказа', false);
        }
    }

    async saveEdit(event) {
        event.preventDefault();
        
        const formData = new FormData(document.getElementById('edit-order-form'));
        const orderData = {
            full_name: formData.get('full_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            delivery_address: formData.get('delivery_address'),
            delivery_type: formData.get('delivery_type'),
            comment: formData.get('comment')
        };

        if (orderData.delivery_type === 'scheduled') {
            orderData.delivery_time = formData.get('delivery_time');
        } else {
            orderData.delivery_time = null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/labs/api/orders/${this.currentOrderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.getAuthToken()
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const updatedOrder = await response.json();
            
            // Обновляем заказ в списке
            const index = this.orders.findIndex(o => o.id === this.currentOrderId);
            if (index !== -1) {
                this.orders[index] = { ...this.orders[index], ...updatedOrder };
            }
            
            // Обновляем таблицу
            this.renderOrdersTable();
            
            // Закрываем модальное окно
            this.hideModal('edit-order-modal');
            
            // Показываем уведомление об успехе
            this.showNotification('Заказ успешно изменён', true);
            
        } catch (error) {
            console.error('Ошибка обновления заказа:', error);
            this.showNotification('Ошибка при изменении заказа', false);
        }
    }

    setupEventListeners() {
        // Обработчики для переключения времени доставки в форме редактирования
        document.getElementById('edit-delivery-asap').addEventListener('change', (e) => {
            document.getElementById('edit-time-panel').style.display = 'none';
        });

        document.getElementById('edit-delivery-scheduled').addEventListener('change', (e) => {
            document.getElementById('edit-time-panel').style.display = 'block';
        });

        // Обработчик формы редактирования
        document.getElementById('edit-order-form').addEventListener('submit', (e) => this.saveEdit(e));

        // Кнопка подтверждения удаления
        document.getElementById('confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
    }

    setupModalListeners() {
        // Закрытие модальных окон по крестику
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Закрытие модального окна просмотра
        document.getElementById('close-view-btn').addEventListener('click', () => {
            this.hideModal('view-order-modal');
        });

        // Отмена редактирования
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.hideModal('edit-order-modal');
        });

        // Отмена удаления
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            this.hideModal('delete-order-modal');
        });

        // Закрытие по клику вне модального окна
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    getAuthToken() {
        // В демо-версии используем заглушку
        // В реальном приложении здесь должна быть логика получения токена
        return 'demo-token';
    }

    showNotification(message, isSuccess) {
        // Используем существующую функцию showNotification из orderValidator.js
        if (typeof showNotification !== 'undefined') {
            showNotification(message, isSuccess);
        } else {
            // Альтернативная реализация, если showNotification не доступна
            alert(message);
        }
    }
}

// Инициализация менеджера истории заказов
let historyManager;

document.addEventListener('DOMContentLoaded', () => {
    historyManager = new HistoryManager();
});

// Экспортируем для использования в других файлах
if (typeof window !== 'undefined') {
    window.historyManager = historyManager;
}
