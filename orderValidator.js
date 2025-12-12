//определяем допустимые комбинации ланчей
const validCombos = [
    { soup: true, main: true, starter: true, drink: true },      // Комбо 1
    { soup: true, main: true, starter: false, drink: true },     // Комбо 2
    { soup: true, main: false, starter: true, drink: true },     // Комбо 3
    { soup: false, main: true, starter: true, drink: true },     // Комбо 4
    { soup: false, main: true, starter: false, drink: true }     // Комбо 5
];

//десерт всегда опциональный, его наличие не проверяем

//функция для проверки валидности заказа
function validateOrder(selectedDishes) {
    const currentCombo = {
        soup: !!selectedDishes.soup,
        main: !!selectedDishes.main,
        starter: !!selectedDishes.starter,
        drink: !!selectedDishes.drink
    };
    
    //проверяем, соответствует ли заказ какому-либо комбо
    for (const combo of validCombos) {
        let match = true;
        for (const key in combo) {
            if (combo[key] !== currentCombo[key]) {
                match = false;
                break;
            }
        }
        if (match) {
            return { isValid: true, missing: [] };
        }
    }
    
    //если не соответствует ни одному комбо, определяем что не хватает
    const missing = [];
    
    //проверяем каждый возможный комбо и находим самый близкий
    let bestMatch = null;
    let minMissing = Infinity;
    
    for (const combo of validCombos) {
        let missingCount = 0;
        for (const key in combo) {
            if (combo[key] && !currentCombo[key]) {
                missingCount++;
            }
        }
        
        if (missingCount < minMissing) {
            minMissing = missingCount;
            bestMatch = combo;
        }
    }
    
    //формируем список недостающих блюд
    if (bestMatch) {
        const dishNames = {
            soup: 'суп',
            main: 'главное блюдо',
            starter: 'салат или стартер',
            drink: 'напиток'
        };
        
        for (const key in bestMatch) {
            if (bestMatch[key] && !currentCombo[key]) {
                missing.push(dishNames[key]);
            }
        }
    }
    
    return { isValid: false, missing };
}

//функция для показа уведомления
function showNotification(missingDishes) {
    //удаляем предыдущие уведомления
    const oldNotification = document.querySelector('.notification-overlay');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    //создаем уведомление
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    let message = '';
    if (missingDishes.length === 1) {
        message = `Вы не добавили ${missingDishes[0]}.`;
    } else if (missingDishes.length === 2) {
        message = `Вы не добавили ${missingDishes[0]} и ${missingDishes[1]}.`;
    } else if (missingDishes.length === 3) {
        message = `Вы не добавили ${missingDishes[0]}, ${missingDishes[1]} и ${missingDishes[2]}.`;
    } else {
        message = 'Вы не добавили несколько блюд.';
    }
    
    message += ' Выберите один из доступных вариантов комбо-ланча.';
    
    overlay.innerHTML = `
        <div class="notification">
            <h3>Неполный заказ</h3>
            <p>${message}</p>
            <button class="notification-btn">Окей</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    //обработчик для кнопки
    overlay.querySelector('.notification-btn').addEventListener('click', () => {
        overlay.remove();
    });
    
    //закрытие по клику вне уведомления
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

//функция для проверки заказа при отправке формы
function setupOrderValidation() {
    const orderForm = document.querySelector('.order-form');
    
    if (!orderForm) return;
    
    orderForm.addEventListener('submit', (e) => {
        if (!orderManager) {
            console.error('Order manager not initialized');
            return;
        }
        
        //получаем текущий заказ
        const orderData = orderManager.getOrderData();
        
        //проверяем валидность
        const validation = validateOrder(orderData);
        
        if (!validation.isValid) {
            //предотвращаем отправку формы
            e.preventDefault();
            
            //показываем уведомление
            showNotification(validation.missing);
        }
        //если заказ валиден, форма отправится нормально
    });
}

//инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    //ждем инициализации orderManager
    const checkOrderManager = () => {
        if (typeof orderManager !== 'undefined' && orderManager) {
            setupOrderValidation();
        } else {
            setTimeout(checkOrderManager, 100);
        }
    };
    
    checkOrderManager();
});
