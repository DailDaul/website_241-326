const STORAGE_KEY = 'foodConstruct_order';

// Функция для сохранения заказа в localStorage
function saveOrderToStorage(orderData) {
    try {
        // Сохраняем только ключи выбранных блюд
        const orderToSave = {};
        
        Object.keys(orderData).forEach(category => {
            if (orderData[category] && orderData[category].keyword) {
                orderToSave[category] = orderData[category].keyword;
            }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orderToSave));
        console.log('Заказ сохранен в localStorage:', orderToSave);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении заказа в localStorage:', error);
        return false;
    }
}

// Функция для загрузки заказа из localStorage
function loadOrderFromStorage() {
    try {
        const savedOrder = localStorage.getItem(STORAGE_KEY);
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
        console.log('Заказ загружен из localStorage:', parsedOrder);
        return parsedOrder;
    } catch (error) {
        console.error('Ошибка при загрузке заказа из localStorage:', error);
        return {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
    }
}

// Функция для удаления заказа из localStorage
function clearOrderFromStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Заказ удален из localStorage');
        return true;
    } catch (error) {
        console.error('Ошибка при удалении заказа из localStorage:', error);
        return false;
    }
}

// Функция для удаления блюда из заказа в localStorage
function removeDishFromStorage(category) {
    try {
        const savedOrder = loadOrderFromStorage();
        if (savedOrder[category]) {
            delete savedOrder[category];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOrder));
            console.log(`Блюдо удалено из заказа: ${category}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка при удалении блюда из localStorage:', error);
        return false;
    }
}

// Экспортируем функции
if (typeof window !== 'undefined') {
    window.saveOrderToStorage = saveOrderToStorage;
    window.loadOrderFromStorage = loadOrderFromStorage;
    window.clearOrderFromStorage = clearOrderFromStorage;
    window.removeDishFromStorage = removeDishFromStorage;
}
