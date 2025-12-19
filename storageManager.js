console.log('storageManager.js загружен');

// Ключи для localStorage
const STORAGE_KEYS = {
    CURRENT_ORDER: 'foodConstruct_current_order',
    ORDER_HISTORY: 'foodConstruct_order_history'
};

// ========== ТЕКУЩИЙ ЗАКАЗ ==========
function saveCurrentOrder(orderData) {
    try {
        console.log('SAVE CURRENT ORDER:', orderData);
        
        // Если orderData - это объект с selectedDishes
        let orderToSave = {};
        
        if (orderData.selectedDishes) {
            // Формат из orderManager
            Object.keys(orderData.selectedDishes).forEach(category => {
                const dish = orderData.selectedDishes[category];
                if (dish && dish.keyword) {
                    orderToSave[category] = dish.keyword;
                }
            });
        } else {
            // Формат напрямую {soup: dish, main: dish, ...}
            Object.keys(orderData).forEach(category => {
                const dish = orderData[category];
                if (dish && dish.keyword) {
                    orderToSave[category] = dish.keyword;
                }
            });
        }
        
        localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(orderToSave));
        console.log('Текущий заказ сохранен:', orderToSave);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении текущего заказа:', error);
        return false;
    }
}

function loadCurrentOrder() {
    try {
        const savedOrder = localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER);
        if (!savedOrder) {
            console.log('Текущий заказ не найден');
            return {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
        }
        
        const parsedOrder = JSON.parse(savedOrder);
        console.log('Текущий заказ загружен:', parsedOrder);
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

function clearCurrentOrder() {
    try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ORDER);
        console.log('Текущий заказ очищен');
        return true;
    } catch (error) {
        console.error('Ошибка при очистке текущего заказа:', error);
        return false;
    }
}

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
function saveOrderToHistory(orderData) {
    try {
        console.log('SAVE ORDER TO HISTORY - Полученные данные:', orderData);
        
        // Проверяем, что есть данные
        if (!orderData || !orderData.dishes || orderData.dishes.length === 0) {
            console.error('Нет данных о блюдах для сохранения в историю');
            return false;
        }
        
        // Создаем объект заказа
        const order = {
            id: Date.now().toString(), // Уникальный ID
            full_name: orderData.name || 'Не указано',
            email: orderData.email || 'Не указано',
            phone: orderData.phone || 'Не указано',
            delivery_address: orderData.address || 'Не указано',
            delivery_type: orderData.delivery_type || 'asap',
            delivery_time: orderData.delivery_time || null,
            comment: orderData.comment || '',
            dishes: orderData.dishes || [],
            dishNames: (orderData.dishes || []).map(d => d.name).join(', '),
            total_price: orderData.total_price || 0,
            created_at: new Date().toISOString()
        };
        
        console.log('Создан объект заказа для истории:', order);
        
        // Загружаем существующие заказы
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        let orders = [];
        
        if (savedHistory) {
            try {
                orders = JSON.parse(savedHistory);
                console.log(`Загружено ${orders.length} существующих заказов`);
            } catch (e) {
                console.error('Ошибка при парсинге истории заказов:', e);
                orders = [];
            }
        } else {
            console.log('История заказов пуста, создаем новую');
        }
        
        // Добавляем новый заказ
        orders.push(order);
        
        // Сохраняем обратно
        localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(orders));
        
        console.log(`Заказ сохранен в историю. Всего заказов: ${orders.length}`);
        console.log('Ключ в localStorage:', STORAGE_KEYS.ORDER_HISTORY);
        
        return true;
        
    } catch (error) {
        console.error('Ошибка при сохранении заказа в историю:', error);
        console.error('Стек ошибки:', error.stack);
        return false;
    }
}

function loadOrderHistory() {
    try {
        console.log('Загрузка истории заказов...');
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        
        if (!savedHistory) {
            console.log('История заказов не найдена');
            return [];
        }
        
        const orders = JSON.parse(savedHistory);
        console.log(`Загружено ${orders.length} заказов из истории`);
        return orders;
        
    } catch (error) {
        console.error('Ошибка при загрузке истории заказов:', error);
        return [];
    }
}

function updateOrderInHistory(orderId, updatedData) {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
        if (!savedHistory) return false;
        
        let orders = JSON.parse(savedHistory);
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) return false;
        
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
console.log('Экспорт функций storageManager...');

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
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.getStorageKeys = function() {
        return {
            currentOrder: localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER),
            orderHistory: localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY)
        };
    };
    
    console.log('storageManager.js инициализирован');
}
