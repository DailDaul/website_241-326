// Ключи для localStorage
const STORAGE_KEYS = {
    CURRENT_ORDER: 'foodConstruct_current_order',
    ORDER_HISTORY: 'foodConstruct_order_history'
};

// ========== ТЕКУЩИЙ ЗАКАЗ ==========

// Функция для сохранения текущего заказа
function saveCurrentOrder(orderData) {
    try {
        // Сохраняем только ключи выбранных блюд
        const orderToSave = {};
        
        Object.keys(orderData).forEach(category => {
            if (orderData[category] && orderData[category].keyword) {
                orderToSave[category] = orderData[category].keyword;
            }
        });
        
        localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(orderToSave));
        console.log('Текущий заказ сохранен в localStorage:', orderToSave);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении текущего заказа:', error);
        return false;
    }
}

// Функция для загрузки текущего заказа
function loadCurrentOrder() {
    try {
        const savedOrder = localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER);
        if (!savedOrder) {
            return {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
        }
        
        const parsedOrder = JSON.parse(savedOrder);
        console.log('Текущий заказ загружен из localStorage:', parsedOrder);
        return parsedOrder;
    } catch (error) {
        console.error('Ошибка при загрузке текущего заказа:', error);
        return {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
    }
}

// Функция для удаления текущего заказа
function clearCurrentOrder() {
    try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ORDER);
        console.log('Текущий заказ удален из localStorage');
        return true;
    } catch (error) {
        console.error('Ошибка при удалении текущего заказа:', error);
        return false;
    }
}

// Функция для удаления блюда из текущего заказа
function removeDishFromCurrentOrder(category) {
    try {
        const savedOrder = loadCurrentOrder();
        if (savedOrder[category]) {
            delete savedOrder[category];
            localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(savedOrder));
            console.log(`Блюдо удалено из текущего заказа: ${category}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка при удалении блюда из текущего заказа:', error);
        return false;
    }
}

// ========== ИСТОРИЯ ЗАКАЗОВ ==========

// Функция для сохранения заказа в историю
function saveOrderToHistory(orderData) {
    try {
        // Создаем объект заказа для истории
        const order = {
            id: Date.now().toString(),
            full_name: orderData.name,
            email: orderData.email,
            phone: orderData.phone,
            delivery_address: orderData.address,
            delivery_type: orderData.delivery_type,
            delivery_time: orderData.delivery_time,
            comment: orderData.comment || '',
            dishes: orderData.dishes || [],
            dishNames: orderData.dishes.map(d => d.name).join(', '),
            total_price: orderData.total_price || 0,
            created_at: new Date().toISOString()
        };
        
        // Загружаем существующие заказы
        const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        let orders = [];
        
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
        
        // Добавляем новый заказ
        orders.push(order);
        
        // Сохраняем обратно
        localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(orders));
        
        console.log('Заказ сохранен в историю:', order);
        return true;
        
    } catch (error) {
        console.error('Ошибка при сохранении заказа в историю:', error);
        return false;
    }
}

// Функция для загрузки истории заказов
function loadOrderHistory() {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        if (!savedHistory) {
            return [];
        }
        
        const parsedHistory = JSON.parse(savedHistory);
        console.log('История заказов загружена из localStorage:', parsedHistory.length, 'заказов');
        return parsedHistory;
    } catch (error) {
        console.error('Ошибка при загрузке истории заказов:', error);
        return [];
    }
}

// Функция для обновления заказа в истории
function updateOrderInHistory(orderId, updatedData) {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        if (!savedHistory) return false;
        
        let orders = JSON.parse(savedHistory);
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) return false;
        
        // Сохраняем неизменяемые данные
        orders[orderIndex] = {
            ...orders[orderIndex],
            ...updatedData,
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(orders));
        console.log(`Заказ ${orderId} обновлен в истории`);
        return true;
        
    } catch (error) {
        console.error('Ошибка при обновлении заказа в истории:', error);
        return false;
    }
}

// Функция для удаления заказа из истории
function deleteOrderFromHistory(orderId) {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        if (!savedHistory) return false;
        
        let orders = JSON.parse(savedHistory);
        const initialLength = orders.length;
        
        orders = orders.filter(order => order.id !== orderId);
        
        if (orders.length === initialLength) return false;
        
        localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(orders));
        console.log(`Заказ ${orderId} удален из истории`);
        return true;
        
    } catch (error) {
        console.error('Ошибка при удалении заказа из истории:', error);
        return false;
    }
}

// Функция для очистки всей истории
function clearOrderHistory() {
    try {
        localStorage.removeItem(STORAGE_KEYS.ORDER_HISTORY);
        console.log('История заказов очищена');
        return true;
    } catch (error) {
        console.error('Ошибка при очистке истории заказов:', error);
        return false;
    }
}

// ========== ЭКСПОРТ ==========

if (typeof window !== 'undefined') {
    // Текущий заказ (обратная совместимость)
    window.saveOrderToStorage = saveCurrentOrder;
    window.loadOrderFromStorage = loadCurrentOrder;
    window.clearOrderFromStorage = clearCurrentOrder;
    window.removeDishFromStorage = removeDishFromCurrentOrder;
    
    // История заказов
    window.saveOrderToHistory = saveOrderToHistory;
    window.loadOrderHistory = loadOrderHistory;
    window.updateOrderInHistory = updateOrderInHistory;
    window.deleteOrderFromHistory = deleteOrderFromHistory;
    window.clearOrderHistory = clearOrderHistory;
    
    // Для отладки
    window.storageKeys = STORAGE_KEYS;
}
