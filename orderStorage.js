
//утилиты для работы с localStorage
const STORAGE_KEY = 'foodConstruct_order';

//функция для сохранения заказа в localStorage
function saveOrderToStorage(orderData) {
    try {
        //сохраняем только ключи выбранных блюд
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

//функция для загрузки заказа из localStorage
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

//функция для получения полных данных заказа на основе ключей
async function getFullOrderData(savedOrderKeys) {
    try {
        // Загружаем все блюда с API
        const dishes = await loadDishes();
        if (!dishes || !Array.isArray(dishes)) {
            throw new Error('Не удалось загрузить блюда');
        }
        
        const fullOrder = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        //заполняем полные данные для каждого выбранного блюда
        Object.keys(savedOrderKeys).forEach(category => {
            const dishKeyword = savedOrderKeys[category];
            if (dishKeyword) {
                const dish = dishes.find(d => d.keyword === dishKeyword);
                if (dish) {
                    fullOrder[category] = dish;
                }
            }
        });
        
        return fullOrder;
    } catch (error) {
        console.error('Ошибка при получении полных данных заказа:', error);
        return null;
    }
}

//функция для удаления заказа из localStorage
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

//функция для удаления блюда из заказа в localStorage
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

// Функция для сохранения токена авторизации
function saveAuthToken(token) {
    try {
        localStorage.setItem('foodConstruct_auth_token', token);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении токена:', error);
        return false;
    }
}

// Функция для получения токена авторизации
function getAuthToken() {
    try {
        return localStorage.getItem('foodConstruct_auth_token');
    } catch (error) {
        console.error('Ошибка при получении токена:', error);
        return null;
    }
}

// Экспортируем новые функции
if (typeof window !== 'undefined') {
    window.saveAuthToken = saveAuthToken;
    window.getAuthToken = getAuthToken;
    window.saveOrderToStorage = saveOrderToStorage;
    window.loadOrderFromStorage = loadOrderFromStorage;
    window.getFullOrderData = getFullOrderData;
    window.clearOrderFromStorage = clearOrderFromStorage;
    window.removeDishFromStorage = removeDishFromStorage;
}
