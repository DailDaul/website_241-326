class HistoryManager {
    constructor() {
        this.orders = [];
        this.currentOrderId = null;
        this.apiBaseUrl = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
        this.init();
    }

    async init() {
        await this.loadOrders();
        this.setupEventListeners();
        this.setupModalListeners();
        
        // Инициализация панели времени в форме редактирования
        const scheduledRadio = document.getElementById('edit-delivery-scheduled');
        const timePanel = document.getElementById('edit-time-panel');
        
        if (scheduledRadio && timePanel) {
            scheduledRadio.addEventListener('change', () => {
                timePanel.style.display = 'block';
            });
            
            document.getElementById('edit-delivery-asap').addEventListener('change', () => {
                timePanel.style.display = 'none';
            });
            
            // Изначально скрываем, если выбрано ASAP
            timePanel.style.display = 'none';
        }
    }

    async loadOrders() {
        const container = document.getElementById('orders-container');
        
        try {
            // В демо-режиме показываем примеры заказов
            // В реальном приложении здесь был бы запрос к API
            this.orders = this.getDemoOrders();
            
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
                    <br><br>
                    <button onclick="location.reload()" style="
                        background: #ff6b00;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">Попробовать снова</button>
                </div>
            `;
        }
    }

    getDemoOrders() {
        // Демо-данные для примера
        return [
            {
                id: 1,
                order_date: '2024-03-15T14:30:00',
                full_name: 'Иван Иванов',
                email: 'ivan@example.com',
                phone: '+7 (999) 123-45-67',
                delivery_address: 'ул. Примерная, д. 1, кв. 1',
                delivery_type: 'scheduled',
                delivery_time: '14:00',
                total_price: 895,
                comment: 'Позвонить перед доставкой',
                soup: { name: 'Том Ям с креветками', price: 365 },
                main: { name: 'Лазанья', price: 385 },
                drink: { name: 'Сок апельсиновый', price: 145 }
            },
            {
                id: 2,
                order_date: '2024-03-14T12:15:00',
                full_name: 'Мария Петрова',
                email: 'maria@example.com',
                phone: '+7 (999) 987-65-43',
                delivery_address: 'ул. Тестовая, д. 2',
                delivery_type: 'asap',
                total_price: 680,
                comment: '',
                main: { name: 'Котлеты из курицы с картофельным пюре', price: 225 },
                starter: { name: 'Греческий салат', price: 195 },
                drink: { name: 'Чай зеленый', price: 120 },
                dessert: { name: 'Чизкейк', price: 140 }
            },
            {
                id: 3,
                order_date: '2024-03-13T18:45:00',
                full_name: 'Алексей Смирнов',
                email: 'alex@example.com',
                phone: '+7 (999) 555-44-33',
                delivery_address: 'ул. Демострации, д. 3',
                delivery_type: 'scheduled',
                delivery_time: '19:30',
                total_price: 815,
                comment: 'Оставить у двери',
                soup: { name: 'Норвежский суп', price: 270 },
                main: { name: 'Жареная картошка с грибами', price: 150 },
                drink: { name: 'Морс клюквенный', price: 135 },
                dessert: { name: 'Тирамису', price: 260 }
            }
        ];
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
            const tooltipText = this.getAllDishes(order).map(d => d.name).join('\n');
            
            tableHTML += `
                <tr data-order-id="${order.id}">
                    <td>${index + 1}</td>
                    <td>${orderDate}</td>
                    <td class="order-dishes-tooltip" data-tooltip="${tooltipText}">${dishesList}</td>
                    <td>${order.total_price}Р</td>
                    <td>${deliveryTime}</td>
                    <td>
                        <div class="order-actions">
                            <button class="action-btn view" title="Подробнее" onclick="historyManager.viewOrder(${order.id})"></button>
                            <button class="action-btn edit" title="Редактировать" onclick="historyManager.editOrder(${order.id})"></button>
                            <button class="action-btn delete" title="Удалить" onclick="historyManager.deleteOrder(${order.id})"></button>
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
        const dishes = this.getAllDishes(order);
        return dishes.length > 0 
            ? dishes.slice(0, 3).map(d => d.name).join(', ') + (dishes.length > 3 ? '...' : '') 
            : 'Блюда не указаны';
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

        dishFields.forEach(({ field }) => {
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

    getDeliveryTimeDisplay(order) {
        if (order.delivery_type === 'scheduled' && order.delivery_time) {
            return order.delivery_time;
        }
        return 'Как можно скорее';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    viewOrder(orderId) {
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
        document.getElementById('view-order-comment').textContent = order.comment || 'Нет комментария';

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
        const timePanel = document.getElementById('edit-time-panel');
        if (order.delivery_type === 'scheduled') {
            document.getElementById('edit-delivery-scheduled').checked = true;
            timePanel.style.display = 'block';
            if (order.delivery_time) {
                document.getElementById('edit-delivery-time').value = order.delivery_time;
            }
        } else {
            document.getElementById('edit-delivery-asap').checked = true;
            timePanel.style.display = 'none';
        }

        this.showModal('edit-order-modal');
    }

    deleteOrder(orderId) {
        this.currentOrderId = orderId;
        this.showModal('delete-order-modal');
    }

    async confirmDelete() {
        try {
            // В демо-режиме просто удаляем из массива
            // В реальном приложении здесь был бы запрос к API
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
            // В демо-режиме обновляем в массиве
            // В реальном приложении здесь был бы запрос к API
            const index = this.orders.findIndex(o => o.id === this.currentOrderId);
            if (index !== -1) {
                this.orders[index] = { ...this.orders[index], ...orderData };
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

        // Обработчик для переключения времени доставки
        const scheduledRadio = document.getElementById('edit-delivery-scheduled');
        const asapRadio = document.getElementById('edit-delivery-asap');
        const timePanel = document.getElementById('edit-time-panel');
        
        if (scheduledRadio && asapRadio && timePanel) {
            scheduledRadio.addEventListener('change', () => {
                timePanel.style.display = 'block';
            });
            
            asapRadio.addEventListener('change', () => {
                timePanel.style.display = 'none';
            });
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showNotification(message, isSuccess) {
        // Используем существующую функцию showNotification из orderValidator.js
        if (typeof showNotification !== 'undefined') {
            showNotification(message, isSuccess);
        } else {
            // Альтернативная реализация, если showNotification не доступна
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: ${isSuccess ? '#4caf50' : '#f44336'};
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 10001;
                font-family: 'Oswald', sans-serif;
                animation: slideInRight 0.3s ease;
            `;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
            
            // Добавляем стили для анимации
            if (!document.querySelector('#notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOutRight {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
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
