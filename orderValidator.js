//определяем допустимые комбинации ланчей
const validCombos = [
    { soup: true, main: true, starter: true, drink: true },
    { soup: true, main: true, starter: false, drink: true },
    { soup: true, main: false, starter: true, drink: true },
    { soup: false, main: true, starter: true, drink: true },
    { soup: false, main: true, starter: false, drink: true }
];

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
            return { isValid: true, message: null };
        }
    }
    
    // Определяем тип уведомления
    let message = '';
    
    // 1. Ничего не выбрано
    if (!currentCombo.soup && !currentCombo.main && !currentCombo.starter && !currentCombo.drink) {
        message = 'Ничего не выбрано. Выберите блюда для заказа';
    }
    // 2. Выбраны все необходимые блюда, кроме напитка
    else if ((currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink) ||
             (currentCombo.soup && !currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (!currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (!currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink)) {
        message = 'Выберите напиток';
    }
    // 3. Выбран суп, но не выбраны главное блюдо и салат/стартер
    else if (currentCombo.soup && !currentCombo.main && !currentCombo.starter) {
        message = 'Выберите главное блюдо/салат/стартер';
    }
    // 4. Выбран салат/стартер, но не выбраны суп и главное блюдо
    else if (!currentCombo.soup && !currentCombo.main && currentCombo.starter) {
        message = 'Выберите суп или главное блюдо';
    }
    // 5. Выбран только напиток или десерт
    else if ((!currentCombo.soup && !currentCombo.main && !currentCombo.starter) && 
             (currentCombo.drink || selectedDishes.dessert)) {
        message = 'Выберите главное блюдо';
    }
    // Другие комбинации
    else {
        message = 'Выберите один из доступных вариантов комбо-ланча.';
    }
    
    return { isValid: false, message };
}

//функция для показа уведомления
function showNotification(message, isSuccess = false) {
    console.log('Showing notification:', message);
    
    //удаляем предыдущие уведомления
    const oldNotification = document.querySelector('.notification-overlay');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    //создаем уведомление
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    // ДОБАВЛЯЕМ ИНЛАЙН-СТИЛИ для гарантии работы
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    const title = isSuccess ? 'Заказ отправлен!' : 'Внимание';
    
    overlay.innerHTML = `
        <div class="notification" style="
            background: white;
            border-radius: 15px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
            text-align: center;
        ">
            <div class="notification-content">
                <h3 style="
                    font-size: 24px;
                    color: #333;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #ff6b00;
                    padding-bottom: 10px;
                    display: inline-block;
                ">${title}</h3>
                <p style="
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 30px;
                    line-height: 1.5;
                ">${message}</p>
                <button class="notification-btn" style="
                    background-color: #ff6b00;
                    color: white;
                    border: none;
                    padding: 12px 40px;
                    border-radius: 10px;
                    font-family: 'Oswald', sans-serif;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                    min-width: 120px;
                    border: 2px solid #ff6b00;
                ">Окей</button>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            .notification-btn:hover {
                background-color: white !important;
                color: #ff6b00 !important;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 0, 0.3);
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
    
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
    
    return overlay;
}

//функция для проверки заказа при отправке формы
function setupOrderValidation() {
    const orderForm = document.querySelector('.order-form');
    
    if (!orderForm) {
        console.error('Order form not found!');
        return;
    }
    
    console.log('🚫 Блокируем стандартную отправку формы');
    
    // 1. Удаляем все старые обработчики
    const formClone = orderForm.cloneNode(true);
    orderForm.parentNode.replaceChild(formClone, orderForm);
    
    // 2. Вешаем наш главный обработчик
    formClone.addEventListener('submit', function(e) {
        console.log('🛑 СТОП: Форма пытается отправиться');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Вызываем нашу логику валидации
        processOrderForm();
        
        return false;
    }, true);
    
    // 3. Также вешаем на кнопку
    const submitBtn = formClone.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            processOrderForm();
            return false;
        }, true);
        
        // Меняем type на button чтобы браузер не пытался отправить
        submitBtn.type = 'button';
    }
    
    // Функция обработки заказа
    function processOrderForm() {
        console.log('=== ОБРАБОТКА ЗАКАЗА ===');
        
        if (!orderManager) {
            console.error('Order manager not initialized');
            showNotification('Ошибка инициализации заказа');
            return;
        }
        
        // Проверяем заполнение полей формы
        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const address = document.getElementById('address')?.value.trim();
        
        if (!name || !email || !phone || !address) {
            showNotification('Заполните все поля формы: имя, email, телефон и адрес');
            return;
        }
        
        //получаем текущий заказ
        const orderData = orderManager.getOrderData();
        console.log('Current order data:', orderData);
        
        //проверяем валидность
        const validation = validateOrder(orderData);
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
            //показываем уведомление об ошибке
            showNotification(validation.message, false);
        } else {
            //если заказ валиден, показываем успешное сообщение
            console.log('Order is valid!');
            
            // Собираем данные для отображения
            const selectedItems = [];
            if (orderData.soup) selectedItems.push(orderData.soup.name);
            if (orderData.main) selectedItems.push(orderData.main.name);
            if (orderData.starter) selectedItems.push(orderData.starter.name);
            if (orderData.drink) selectedItems.push(orderData.drink.name);
            if (orderData.dessert) selectedItems.push(orderData.dessert.name);
            
            const totalPrice = selectedItems.reduce((sum, item) => {
                const dish = Object.values(orderData).find(d => d && d.name === item);
                return sum + (dish ? dish.price : 0);
            }, 0);
            
            const successMessage = `
                Ваш заказ успешно оформлен!<br><br>
                <strong>Вы заказали:</strong><br>
                ${selectedItems.map(item => `• ${item}`).join('<br>')}<br><br>
                <strong>Общая стоимость:</strong> ${totalPrice}Р<br><br>
                <small>В демо-версии форма не отправляется на сервер.</small>
            `;
            
            // Показываем уведомление об успехе
            showNotification(successMessage, true);
        }
    }
}

//инициализация с повторными попытками
function initializeValidation() {
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryInitialize = () => {
        if (typeof orderManager !== 'undefined' && orderManager) {
            console.log('OrderManager found, setting up validation...');
            setupOrderValidation();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`Waiting for OrderManager... attempt ${attempts}`);
            setTimeout(tryInitialize, 300);
        } else {
            console.error('Failed to initialize: OrderManager not loaded');
            // Все равно настраиваем валидацию, но с fallback
            setTimeout(setupOrderValidation, 500);
        }
    };
    
    tryInitialize();
}

// Запускаем инициализацию
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting validation initialization...');
    setTimeout(initializeValidation, 500);
});

// Экспортируем функции для тестирования
if (typeof window !== 'undefined') {
    window.validateOrder = validateOrder;
    window.showNotification = showNotification;
}
