// historyStorage.js - Утилиты для работы с историей заказов

const HISTORY_STORAGE_KEY = 'foodConstruct_order_history';

// Функция для сохранения заказа в историю
function saveOrderToHistory(orderData) {
    try {
        // Получаем текущую историю заказов
        const history = loadOrderHistory();
        
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
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
        
        console.log('Заказ сохранен в историю:', newOrder);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении заказа в историю:', error);
        return false;
    }
}

// Функция для загрузки истории заказов
function loadOrderHistory() {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
        console.log('Загружена история заказов:', history.length, 'шт.');
        return history;
    } catch (error) {
        console.error('Ошибка при загрузке истории заказов:', error);
        return [];
    }
}

// Функция для удаления заказа из истории
function deleteOrderFromHistory(orderId) {
    try {
        const history = loadOrderHistory();
        const filteredHistory = history.filter(order => order.id !== orderId);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
        console.log('Заказ удален из истории:', orderId);
        return true;
    } catch (error) {
        console.error('Ошибка при удалении заказа из истории:', error);
        return false;
    }
}

// Функция для обновления заказа в истории
function updateOrderInHistory(orderId, updatedData) {
    try {
        const history = loadOrderHistory();
        const orderIndex = history.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.error('Заказ не найден:', orderId);
            return false;
        }
        
        history[orderIndex] = { ...history[orderIndex], ...updatedData };
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        
        console.log('Заказ обновлен в истории:', orderId);
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении заказа в истории:', error);
        return false;
    }
}

// Функция для получения заказа по ID
function getOrderFromHistory(orderId) {
    try {
        const history = loadOrderHistory();
        return history.find(order => order.id === orderId) || null;
    } catch (error) {
        console.error('Ошибка при получении заказа из истории:', error);
        return null;
    }
}

// Экспортируем функции
if (typeof window !== 'undefined') {
    window.saveOrderToHistory = saveOrderToHistory;
    window.loadOrderHistory = loadOrderHistory;
    window.deleteOrderFromHistory = deleteOrderFromHistory;
    window.updateOrderInHistory = updateOrderInHistory;
    window.getOrderFromHistory = getOrderFromHistory;
}
