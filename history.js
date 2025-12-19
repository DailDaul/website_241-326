console.log('=== ИНИЦИАЛИЗАЦИЯ ИСТОРИИ ЗАКАЗОВ ===');
console.log('Текущий URL:', window.location.href);

class OrderHistory {
    constructor() {
        console.log('🔄 Создание OrderHistory');
        this.STORAGE_KEY = 'foodConstruct_orders';
        this.currentOrderId = null;
        this.orders = [];
    }
    
    init() {
        console.log('🚀 Инициализация OrderHistory');
        try {
            this.setupEventListeners();
            this.loadOrders();
            console.log('✅ OrderHistory успешно инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации OrderHistory:', error);
        }
    }
    
    loadOrders() {
    console.log('📥 Загрузка заказов...');
    const container = document.getElementById('orders-container');
    
    if (!container) {
        console.error('❌ Не найден контейнер для заказов');
        return;
    }
    
    try {
        // Получаем данные из localStorage
        const STORAGE_KEY = 'foodConstruct_orders';
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        console.log('📦 Проверка localStorage:', {
            key: STORAGE_KEY,
            exists: !!savedData,
            data: savedData
        });
        
        // Для отладки: покажем все ключи в localStorage
        console.log('Все ключи в localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`${i}: ${key}`);
        }
        
        if (!savedData) {
            container.innerHTML = `
                <div class="empty-message">
                    У вас пока нет заказов. Оформите первый заказ на странице 
                    <a href="orders.html">Оформить заказ</a>.
                </div>
            `;
            return;
        }
        
        // Парсим данные
        this.orders = JSON.parse(savedData);
        console.log(`📊 Успешно загружено ${this.orders.length} заказов`);
        
        if (this.orders.length === 0) {
            container.innerHTML = '<div class="empty-message">У вас пока нет заказов.</div>';
            return;
        }
        
        // Выводим подробную информацию о каждом заказе
        console.log('📋 Детали загруженных заказов:');
        this.orders.forEach((order, index) => {
            console.log(`Заказ #${index + 1}:`, {
                id: order.id,
                date: order.created_at,
                name: order.full_name,
                dishes: order.dishes?.length || 0,
                total: order.total_price
            });
        });
        
        // Сортируем по дате (новые сначала)
        this.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Отображаем
        this.displayOrders();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        container.innerHTML = '<div class="error-message">Ошибка загрузки истории заказов: ' + error.message + '</div>';
        }
    }
    
    displayOrders() {
        const container = document.getElementById('orders-container');
        
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
                    ${this.orders.map((order, index) => {
                        const date = new Date(order.created_at);
                        const formattedDate = date.toLocaleDateString('ru-RU') + ' ' + 
                                           date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
                        
                        const dishesText = order.dishes ? order.dishes.map(d => d.name).join(', ') : '';
                        const deliveryTime = order.delivery_type === 'scheduled' 
                            ? order.delivery_time 
                            : 'Как можно скорее (с 7:00 до 23:00)';
                        const totalPrice = order.total_price || 0;
                        
                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${formattedDate}</td>
                                <td>${dishesText}</td>
                                <td>${totalPrice}Р</td>
                                <td>${deliveryTime}</td>
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
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // Вешаем обработчики после отрисовки
        this.attachEventHandlers();
    }
    
    attachEventHandlers() {
        // Обработчики для кнопок действий
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            
            const orderId = btn.getAttribute('data-id');
            if (!orderId) return;
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) return;
            
            if (btn.classList.contains('view-btn')) {
                this.showViewModal(order);
            } else if (btn.classList.contains('edit-btn')) {
                this.showEditModal(order);
            } else if (btn.classList.contains('delete-btn')) {
                this.showDeleteModal(order);
            }
        });
        
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // В этой версии просто перезагружаем
                this.loadOrders();
            });
        });
    }
    
    setupEventListeners() {
        console.log('🔗 Настройка обработчиков событий');
        
        // Закрытие модальных окон
        document.querySelectorAll('.close-modal, .ok-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Подтверждение удаления
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }
        
        // Отправка формы редактирования
        const editForm = document.getElementById('edit-order-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit();
            });
        }
        
        // Закрытие по клику вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }
    
    showViewModal(order) {
        console.log('👁️ Просмотр заказа', order.id);
        this.currentOrderId = order.id;
        
        const dishesHTML = order.dishes.map(dish => `
            <li>
                <span class="dish-name">${dish.name}</span>
                <span class="dish-price">${dish.price}Р</span>
            </li>
        `).join('');
        
        const date = new Date(order.created_at);
        const formattedDate = date.toLocaleDateString('ru-RU') + ' ' + 
                            date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
        
        const content = `
            <div class="order-info-section">
                <h3>Дата оформления</h3>
                <div class="info-item">
                    <span class="info-value">${formattedDate}</span>
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
                    <span class="info-value">${order.delivery_type === 'scheduled' ? order.delivery_time : 'Как можно скорее (с 7:00 до 23:00)'}</span>
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
        
        const modalContent = document.getElementById('view-modal-content');
        if (modalContent) {
            modalContent.innerHTML = content;
            document.getElementById('view-modal').style.display = 'block';
        }
    }
    
    showEditModal(order) {
        this.currentOrderId = order.id;
        // Реализация редактирования
        alert('Редактирование заказа #' + order.id);
    }
    
    showDeleteModal(order) {
        this.currentOrderId = order.id;
        document.getElementById('delete-modal').style.display = 'block';
    }
    
    confirmDelete() {
        if (!this.currentOrderId) return;
        
        const orderIndex = this.orders.findIndex(o => o.id == this.currentOrderId);
        if (orderIndex !== -1) {
            this.orders.splice(orderIndex, 1);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
            this.showNotification('Заказ успешно удалён', true);
            this.closeAllModals();
            this.loadOrders();
        }
    }
    
    saveEdit() {
        // Реализация сохранения редактирования
        this.showNotification('Функция редактирования в разработке', false);
        this.closeAllModals();
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentOrderId = null;
    }
    
    showNotification(message, isSuccess) {
        alert(message);
    }
}

function initializeHistory() {
    console.log('🔄 Инициализация истории заказов...');
    
    // Проверяем, на правильной ли мы странице
    if (!window.location.pathname.includes('history.html')) {
        console.log('Не страница истории, пропускаем инициализацию');
        return;
    }
    
    // Создаем экземпляр
    window.orderHistory = new OrderHistory();
    
    // Ждем немного перед инициализацией
    setTimeout(() => {
        console.log('🚀 Запуск инициализации истории...');
        window.orderHistory.init();
    }, 100);
}

// Запускаем когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHistory);
} else {
    initializeHistory();
}

console.log('✅ history.js выполнен');
