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
            return { isValid: true, message: null, type: null };
        }
    }
    
    // Определяем тип уведомления
    let message = '';
    let type = '';
    
    // 1. Ничего не выбрано
    if (!currentCombo.soup && !currentCombo.main && !currentCombo.starter && !currentCombo.drink) {
        message = 'Ничего не выбрано. Выберите блюда для заказа';
        type = 'empty';
    }
    // 2. Выбраны все необходимые блюда, кроме напитка
    else if ((currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) || // Комбо 1 без напитка
             (currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink) || // Комбо 2 без напитка
             (currentCombo.soup && !currentCombo.main && currentCombo.starter && !currentCombo.drink) || // Комбо 3 без напитка
             (!currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) || // Комбо 4 без напитка
             (!currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink)) { // Комбо 5 без напитка
        message = 'Выберите напиток';
        type = 'missing_drink';
    }
    // 3. Выбран суп, но не выбраны главное блюдо и салат/стартер
    else if (currentCombo.soup && !currentCombo.main && !currentCombo.starter) {
        message = 'Выберите главное блюдо/салат/стартер';
        type = 'missing_main_or_starter';
    }
    // 4. Выбран салат/стартер, но не выбраны суп и главное блюдо
    else if (!currentCombo.soup && !currentCombo.main && currentCombo.starter) {
        message = 'Выберите суп или главное блюдо';
        type = 'missing_soup_or_main';
    }
    // 5. Выбран только напиток или десерт
    else if ((!currentCombo.soup && !currentCombo.main && !currentCombo.starter) && 
             (currentCombo.drink || selectedDishes.dessert)) {
        message = 'Выберите главное блюдо';
        type = 'missing_main';
    }
    // Другие комбинации - находим недостающие блюда
    else {
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
        const missing = [];
        const dishNames = {
            soup: 'суп',
            main: 'главное блюдо',
            starter: 'салат или стартер',
            drink: 'напиток'
        };
        
        if (bestMatch) {
            for (const key in bestMatch) {
                if (bestMatch[key] && !currentCombo[key]) {
                    missing.push(dishNames[key]);
                }
            }
        }
        
        if (missing.length === 1) {
            message = `Вы не добавили ${missing[0]}. Выберите один из доступных вариантов комбо-ланча.`;
        } else if (missing.length === 2) {
            message = `Вы не добавили ${missing[0]} и ${missing[1]}. Выберите один из доступных вариантов комбо-ланча.`;
        } else {
            message = 'Вы не добавили несколько блюд. Выберите один из доступных вариантов комбо-ланча.';
        }
        type = 'custom';
    }
    
    return { isValid: false, message, type };
}

//функция для показа уведомления
function showNotification(message) {
    console.log('Showing notification:', message);
    
    //удаляем предыдущие уведомления
    const oldNotification = document.querySelector('.notification-overlay');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    //создаем уведомление
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    overlay.innerHTML = `
        <div class="notification">
            <div class="notification-content">
                <h3>Неполный заказ</h3>
                <p>${message}</p>
                <button class="notification-btn">Окей</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    console.log('Notification added to DOM');
    
    //обработчик для кнопки
    const okButton = overlay.querySelector('.notification-btn');
    okButton.addEventListener('click', () => {
        console.log('Notification closed');
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
    
    if (!orderForm) {
        console.error('Order form not found!');
        return;
    }
    
    console.log('Setting up order validation...');
    
    orderForm.addEventListener('submit', (e) => {
        console.log('Form submit triggered');
        
        // Предотвращаем отправку для проверки
        e.preventDefault();
        
        if (!orderManager) {
            console.error('Order manager not initialized');
            showNotification('Ошибка: менеджер заказов не инициализирован');
            return;
        }
        
        //получаем текущий заказ
        const orderData = orderManager.getOrderData();
        console.log('Order data:', orderData);
        
        //проверяем валидность
        const validation = validateOrder(orderData);
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
            //показываем уведомление
            showNotification(validation.message);
        } else {
            //если заказ валиден, показываем успешное сообщение и отправляем
            console.log('Order is valid, submitting...');
            showNotification('Заказ успешно отправлен! Отправляем форму...');
            
            // Отправляем форму через 2 секунды
            setTimeout(() => {
                console.log('Submitting form to:', orderForm.getAttribute('action'));
                orderForm.submit();
            }, 2000);
        }
    });
}

//инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded in orderValidator.js');
    
    // Инициализируем валидацию с задержкой
    setTimeout(() => {
        setupOrderValidation();
        console.log('Order validation initialized');
    }, 1000);
});
