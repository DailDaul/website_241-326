// debug.js - отладка работы localStorage
console.log('=== DEBUG: localStorage STATUS ===');

// Проверяем все ключи Food Construct
const foodConstructKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('foodConstruct') || key.includes('order')) {
        foodConstructKeys.push(key);
        console.log(`Found key: "${key}"`);
        try {
            const value = JSON.parse(localStorage.getItem(key));
            console.log(`Value for "${key}":`, value);
        } catch (e) {
            console.log(`Value for "${key}":`, localStorage.getItem(key));
        }
    }
}

if (foodConstructKeys.length === 0) {
    console.log('No Food Construct keys found in localStorage');
}

// Экспортируем функцию для проверки
function checkStorage() {
    console.log('=== CHECKING STORAGE ===');
    const currentOrder = localStorage.getItem('foodConstruct_current_order');
    const orderHistory = localStorage.getItem('foodConstruct_order_history');
    
    console.log('Current order exists:', !!currentOrder);
    console.log('Order history exists:', !!orderHistory);
    
    if (currentOrder) {
        console.log('Current order:', JSON.parse(currentOrder));
    }
    
    if (orderHistory) {
        const history = JSON.parse(orderHistory);
        console.log(`Order history has ${history.length} orders:`, history);
    }
    
    return { currentOrder: !!currentOrder, orderHistory: orderHistory ? JSON.parse(orderHistory).length : 0 };
}

// Добавляем функцию в глобальную область видимости
if (typeof window !== 'undefined') {
    window.checkStorage = checkStorage;
    window.debugStorage = checkStorage;
}

console.log('=== DEBUG END ===');
