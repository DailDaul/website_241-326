// history.js
class OrderHistory {
    constructor() {
        this.STORAGE_KEY = 'foodConstruct_orders';
        this.currentOrderId = null;
        this.orders = [];
        
        this.init();
    }
    
    async init() {
        console.log('OrderHistory инициализация...');
        this.setupEventListeners();
        this.loadOrders();
    }
    
    loadOrders() {
        try {
            console.log('Загрузка заказов из localStorage...');
            const container = document.getElementById('orders-container');
            
            // Получаем данные
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            console.log('Полученные данные из localStorage:', savedData);
            
            if (!savedData) {
                container.innerHTML = '<div class="empty-message">У вас пока нет заказов.</div>';
                return;
            }
            
            this.orders = JSON.parse(savedData);
            console.log('Заказы загружены:', this.orders);
            
            if (!this.orders || this.orders.length === 0) {
                container.innerHTML = '<div class="empty-message">У вас пока нет заказов.</div>';
                return;
            }
            
            // Сортируем по убыванию даты
            this.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Отображаем
            this.displayOrders();
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            const container = document.getElementById('orders-container');
            container.innerHTML = '<div class="error-message">Ошибка загрузки истории заказов</div>';
        }
    }
    
    displayOrders() {
        const container = document.getElementById('orders-container');
        const html = `
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
                    ${this.orders.map((order, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${new Date(order.created_at).toLocaleString('ru-RU')}</td>
                            <td>${order.dishes ? order.dishes.map(d => d.name).join(', ') : 'Нет данных'}</td>
                            <td>${order.total_price || 0}Р</td>
                            <td>${order.delivery_type === 'scheduled' ? order.delivery_time : 'Как можно скорее'}</td>
                            <td>
                                <button onclick="orderHistory.viewOrder(${order.id})">👁️</button>
                                <button onclick="orderHistory.editOrder(${order.id})">✏️</button>
                                <button onclick="orderHistory.deleteOrder(${order.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    // Простые методы для действий
    viewOrder(id) {
        const order = this.orders.find(o => o.id == id);
        if (order) {
            alert(`Просмотр заказа #${id}\nИмя: ${order.full_name}\nБлюда: ${order.dishes.map(d => d.name).join(', ')}\nСтоимость: ${order.total_price}Р`);
        }
    }
    
    editOrder(id) {
        alert('Редактирование заказа #' + id);
    }
    
    deleteOrder(id) {
        if (confirm('Удалить заказ #' + id + '?')) {
            this.orders = this.orders.filter(o => o.id != id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
            this.loadOrders();
        }
    }
    
    setupEventListeners() {
        // Простые обработчики
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadOrders();
            });
        });
    }
}

// Глобальная переменная
let orderHistory;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, создаем OrderHistory');
    orderHistory = new OrderHistory();
    window.orderHistory = orderHistory; // Делаем доступным глобально
});
