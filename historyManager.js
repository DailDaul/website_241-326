class HistoryManager {
    constructor() {
        this.orders = [];
        this.currentOrderId = null;
        this.init();
    }

    async init() {
        await this.loadOrders();
        this.setupEventListeners();
        this.setupModalListeners();
        this.setupEditFormValidation();
        
        // Инициализация панели времени в форме редактирования
        this.setupTimeDeliveryToggle();
    }

    async loadOrders() {
        const container = document.getElementById('orders-container');
        
        try {
            // Загружаем историю заказов из localStorage
            if (typeof loadOrderHistory !== 'undefined') {
                this.orders = loadOrderHistory();
            } else {
                // Если функция не определена, загружаем из localStorage напрямую
                this.orders = JSON.parse(localStorage.getItem('foodConstruct_order_history') || '[]');
            }
            
            if (this.orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-message">
                        У вас пока нет заказов.<br><br>
                        <a href="lunch.html" style="
                            display: inline-block;
                            background-color: #ff6b00;
                            color: white;
                            padding: 12px 30px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: 500;
                            margin-top: 10px;
                        ">Создать первый заказ</a>
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
                        font-family: 'Oswald', sans-serif;
                    ">Попробовать снова</button>
                </div>
            `;
        }
    }

    renderOrdersTable() {
        const container = document.getElementById('orders-container');
        
        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    У вас пока нет заказов.<br><br>
                    <a href="lunch.html" style="
                        display: inline-block;
                        background-color: #ff6b00;
                        color: white;
                        padding: 12px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 500;
                        margin-top: 10px;
                    ">Создать первый заказ</a>
                </div>
            `;
            return;
        }
        
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
                    <td class="order-dishes-tooltip" data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">${dishesList}</td>
                    <td>${order.total_price || 0}Р</td>
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
            { field: 'soup' },
            { field: 'main' },
            { field: 'starter' },
            { field: 'drink' },
            { field: 'dessert' }
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
        if (dishes.length === 0) {
            dishesContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Блюда не указаны</div>';
        } else {
            dishes.forEach(dish => {
                const dishElement = document.createElement('div');
                dishElement.className = 'order-dish-item';
                dishElement.innerHTML = `
                    <span>${dish.name}</span>
                    <span>${dish.price || ''}${dish.price ? 'Р' : ''}</span>
                `;
                dishesContainer.appendChild(dishElement);
            });
        }

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
            } else {
                document.getElementById('edit-delivery-time').value = '12:00';
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
            // Удаляем заказ из массива
            this.orders = this.orders.filter(order => order.id !== this.currentOrderId);
            
            // Обновляем localStorage
            this.saveOrdersToStorage();
            
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
        
        // Валидация формы
        if (!this.validateEditForm()) {
            return;
        }
        
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
            if (!orderData.delivery_time) {
                this.showNotification('Укажите время доставки', false);
                return;
            }
        } else {
            orderData.delivery_time = null;
        }

        try {
            // Обновляем заказ в массиве
            const index = this.orders.findIndex(o => o.id === this.currentOrderId);
            if (index !== -1) {
                this.orders[index] = { ...this.orders[index], ...orderData };
            }
            
            // Обновляем localStorage
            this.saveOrdersToStorage();
            
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

    saveOrdersToStorage() {
        try {
            localStorage.setItem('foodConstruct_order_history', JSON.stringify(this.orders));
            console.log('История заказов сохранена:', this.orders.length, 'шт.');
        } catch (error) {
            console.error('Ошибка сохранения истории заказов:', error);
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
    }

    setupTimeDeliveryToggle() {
        const scheduledRadio = document.getElementById('edit-delivery-scheduled');
        const asapRadio = document.getElementById('edit-delivery-asap');
        const timePanel = document.getElementById('edit-time-panel');
        const timeInput = document.getElementById('edit-delivery-time');
        
        if (!scheduledRadio || !asapRadio || !timePanel || !timeInput) {
            console.log('Элементы выбора времени не найдены');
            return;
        }
        
        // Изначально скрываем панель времени
        timePanel.style.display = 'none';
        
        // Добавляем атрибуты для доступности
        timeInput.title = 'Выберите время доставки с 7:00 до 23:00';
        timeInput.placeholder = 'ЧЧ:ММ';
        
        function updateTimePanelVisibility() {
            if (scheduledRadio.checked) {
                timePanel.style.display = 'block';
                timeInput.required = true;
                timeInput.setAttribute('aria-required', 'true');
            } else {
                timePanel.style.display = 'none';
                timeInput.required = false;
                timeInput.removeAttribute('aria-required');
            }
        }
        
        // Вешаем обработчики
        asapRadio.addEventListener('change', updateTimePanelVisibility);
        scheduledRadio.addEventListener('change', updateTimePanelVisibility);
        
        // Инициализация
        updateTimePanelVisibility();
    }

    setupEditFormValidation() {
        const form = document.getElementById('edit-order-form');
        
        // Добавляем атрибуты для доступности
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        inputs.forEach(input => {
            if (!input.hasAttribute('title') && !input.hasAttribute('placeholder')) {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    input.title = `Введите ${label.textContent.toLowerCase().replace('*', '').trim()}`;
                }
            }
        });
        
        // Добавляем placeholder для поля комментария
        const commentField = document.getElementById('edit-order-comment');
        if (commentField && !commentField.placeholder) {
            commentField.placeholder = 'Введите комментарий к заказу...';
        }
        
        // Добавляем placeholder для времени доставки
        const timeField = document.getElementById('edit-delivery-time');
        if (timeField && !timeField.placeholder) {
            timeField.placeholder = 'чч:мм';
        }
    }

    validateEditForm() {
        const name = document.getElementById('edit-order-name').value.trim();
        const email = document.getElementById('edit-order-email').value.trim();
        const phone = document.getElementById('edit-order-phone').value.trim();
        const address = document.getElementById('edit-order-address').value.trim();
        const isScheduled = document.getElementById('edit-delivery-scheduled').checked;
        const deliveryTime = document.getElementById('edit-delivery-time').value;
        
        // Проверка обязательных полей
        if (!name || !email || !phone || !address) {
            this.showNotification('Заполните все обязательные поля', false);
            return false;
        }
        
        // Проверка email
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            this.showNotification('Введите корректный email', false);
            return false;
        }
        
        // Проверка телефона
        const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
        if (!phonePattern.test(phone)) {
            this.showNotification('Введите корректный номер телефона', false);
            return false;
        }
        
        // Проверка времени доставки для запланированной доставки
        if (isScheduled && !deliveryTime) {
            this.showNotification('Укажите время доставки', false);
            return false;
        }
        
        if (deliveryTime) {
            const time = new Date(`2000-01-01T${deliveryTime}`);
            const hours = time.getHours();
            const minutes = time.getMinutes();
            
            // Проверяем, что время в пределах 7:00 - 23:00
            if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
                this.showNotification('Время доставки должно быть с 7:00 до 23:00', false);
                return false;
            }
        }
        
        return true;
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем скролл на фоне
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = ''; // Восстанавливаем скролл
    }

    showNotification(message, isSuccess) {
        // Используем существующую функцию showNotification из orderValidator.js
        if (typeof showNotification !== 'undefined') {
            showNotification(message, isSuccess);
        } else {
            // Альтернативная реализация
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
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 500px;
            `;
            
            notification.innerHTML = `
                <span>${message}</span>
                <button style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                    padding: 0 5px;
                " onclick="this.parentElement.remove()">×</button>
            `;
            
            document.body.appendChild(notification);
            
            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 5000);
            
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

// Экспортируем функции для сохранения/загрузки истории
if (typeof window !== 'undefined') {
    window.saveOrderToHistory = function(orderData) {
        try {
            // Получаем текущую историю заказов
            const history = JSON.parse(localStorage.getItem('foodConstruct_order_history') || '[]');
            
            // Создаем новый заказ с ID
            const newOrder = {
                id: Date.now(), // Используем timestamp как ID
                order_date: orderData.date || new Date().toISOString(),
                full_name: orderData.name,
                email: orderData.email,
                phone: orderData.phone,
                delivery_address: orderData.address,
                delivery_type: orderData.deliveryTime === 'asap' ? 'asap' : 'scheduled',
                delivery_time: orderData.deliveryTime === 'asap' ? null : orderData.deliveryTime,
                total_price: orderData.totalPrice,
                comment: orderData.comment || '',
                // Сохраняем блюда
                soup: orderData.dishes?.soup || null,
                main: orderData.dishes?.main || null,
                starter: orderData.dishes?.starter || null,
                drink: orderData.dishes?.drink || null,
                dessert: orderData.dishes?.dessert || null
            };
            
            // Добавляем в начало массива (чтобы новые были первыми)
            history.unshift(newOrder);
            
            // Сохраняем в localStorage (ограничим 50 последних заказов)
            const limitedHistory = history.slice(0, 50);
            localStorage.setItem('foodConstruct_order_history', JSON.stringify(limitedHistory));
            
            console.log('Заказ сохранен в историю:', newOrder);
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении заказа в историю:', error);
            return false;
        }
    };

    window.loadOrderHistory = function() {
        try {
            const history = JSON.parse(localStorage.getItem('foodConstruct_order_history') || '[]');
            console.log('Загружена история заказов:', history.length, 'шт.');
            return history;
        } catch (error) {
            console.error('Ошибка при загрузке истории заказов:', error);
            return [];
        }
    };
}
