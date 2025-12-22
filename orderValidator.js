//глобальные функции для работы с менеджерами заказов
function getOrderManager() {
    //в lunch.html используем orderManager
    //вorders.html используем ordersManager
    if (typeof orderManager !== 'undefined' && orderManager) {
        return orderManager;
    }
    if (typeof ordersManager !== 'undefined' && ordersManager) {
        return ordersManager;
    }
    return null;
}

//функция для получения данных заказа
function getCurrentOrderData() {
    const manager = getOrderManager();
    if (!manager) return null;
    
    //проверяем, есть ли метод getOrderData
    if (typeof manager.getOrderData === 'function') {
        return manager.getOrderData();
    }
    //если метода нет, используем selectedDishes напрямую
    return manager.selectedDishes || {
        soup: null,
        main: null,
        starter: null,
        drink: null,
        dessert: null
    };
}

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
    
    //определяем тип уведомления
    let message = '';
    
    //1. ничего не выбрано
    if (!currentCombo.soup && !currentCombo.main && !currentCombo.starter && !currentCombo.drink) {
        message = 'Ничего не выбрано. Выберите блюда для заказа';
    }
    //2. выбраны все необходимые блюда, кроме напитка
    else if ((currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink) ||
             (currentCombo.soup && !currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (!currentCombo.soup && currentCombo.main && currentCombo.starter && !currentCombo.drink) ||
             (!currentCombo.soup && currentCombo.main && !currentCombo.starter && !currentCombo.drink)) {
        message = 'Выберите напиток';
    }
    //3. выбран суп, но не выбраны главное блюдо и салат/стартер
    else if (currentCombo.soup && !currentCombo.main && !currentCombo.starter) {
        message = 'Выберите главное блюдо/салат/стартер';
    }
    //4. выбран салат/стартер, но не выбраны суп и главное блюдо
    else if (!currentCombo.soup && !currentCombo.main && currentCombo.starter) {
        message = 'Выберите суп или главное блюдо';
    }
    //5. выбран только напиток или десерт
    else if ((!currentCombo.soup && !currentCombo.main && !currentCombo.starter) && 
             (currentCombo.drink || selectedDishes.dessert)) {
        message = 'Выберите главное блюдо';
    }
    //другие комбинации
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
    
    //добавляем стили для гарантии работы (ваще хз, как оно работает, но без кнопки не фурычат :(
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
    //проверяем, на какой странице мы находимся
    const isLunchPage = window.location.pathname.includes('lunch.html');
    const isOrdersPage = window.location.pathname.includes('orders.html');
    
    //в lunch.html нет формы заказа, поэтому выходим
    if (isLunchPage) {
        console.log('На странице "Собрать ланч" - валидация формы не требуется');
        return;
    }
    
    //в orders.html ищем форму
    const orderForm = document.querySelector('.order-form');
    
    if (!orderForm) {
        console.error('Order form not found!');
        return;
    }
    
    console.log('Настраиваем валидацию формы...');
    
    //настраиваем переключение времени доставки
    setupTimeDeliveryToggle();
    
    //вешаем обработчик на кнопку отправки (не клонируем всю форму!)
    const submitBtn = orderForm.querySelector('.submit-btn');
    if (submitBtn) {
        //удаляем старые обработчики
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            processOrderForm();
            return false;
        }, true);
        
        //меняем type на button чтобы браузер не пытался отправить
        newSubmitBtn.type = 'button';
    }
    
    //вешаем обработчик на кнопку очистки заказа
    const clearOrderBtn = orderForm.querySelector('#clear-order-btn');
    if (clearOrderBtn) {
        //удаляем старые обработчики
        const newClearBtn = clearOrderBtn.cloneNode(true);
        clearOrderBtn.parentNode.replaceChild(newClearBtn, clearOrderBtn);
        
        newClearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCurrentOrder();
            return false;
        });
    }
    
    //вешаем обработчик на саму форму
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        processOrderForm();
        return false;
    }, true);
    
    //функция для очистки заказа
    function clearCurrentOrder() {
        console.log('Очистка заказа...');
        const manager = getOrderManager();
        
        if (manager && typeof manager.clearOrder === 'function') {
            manager.clearOrder();
            showNotification('Заказ успешно очищен', true);
        } else if (manager && manager.selectedDishes) {
            // Очищаем текущий заказ
            manager.selectedDishes = {
                soup: null,
                main: null,
                starter: null,
                drink: null,
                dessert: null
            };
            
            //очищаем localStorage
            if (typeof clearOrderFromStorage === 'function') {
                clearOrderFromStorage();
            }
            
            //обновляем отображение
            if (typeof manager.updateOrderFormDisplay === 'function') {
                manager.updateOrderFormDisplay();
            }
            if (typeof manager.displayOrderItems === 'function') {
                manager.displayOrderItems();
            }
            
            showNotification('Текущий заказ успешно очищен', true);
        } else {
            showNotification('Не удалось очистить заказ', false);
        }
    }
    
    //функция обработки заказа
    function processOrderForm() {
        console.log('=== ОБРАБОТКА ЗАКАЗА ===');
        
        //проверяем заполнение полей формы
        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const address = document.getElementById('address')?.value.trim();
        const deliveryTime = document.querySelector('input[name="delivery_time"]:checked')?.value;
        const scheduledTime = document.getElementById('scheduled-time')?.value;
        
        if (!name || !email || !phone || !address) {
            showNotification('Заполните все поля формы: имя, email, телефон и адрес');
            return;
        }
        
        //если выбрано "К указанному времени", проверяем заполнение времени
        if (deliveryTime === 'scheduled' && !scheduledTime) {
            showNotification('Укажите время доставки');
            return;
        }

        if (scheduledTime) {
            const time = new Date(`2000-01-01T${scheduledTime}`);
            const hours = time.getHours();
            const minutes = time.getMinutes();
    
        // Проверяем, что время в пределах 7:00 - 23:00
        if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
            showNotification('Время доставки должно быть с 7:00 до 23:00');
            return;
            }
        }
        
        //получаем текущий заказ
        const orderData = getCurrentOrderData();
        console.log('Current order data:', orderData);
        
        if (!orderData) {
            showNotification('Ошибка загрузки данных заказа');
            return;
        }
        
        //проверяем валидность
        const validation = validateOrder(orderData);
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
            //показываем уведомление об ошибке
            showNotification(validation.message, false);
        } else {
            //если заказ валиден, показываем успешное сообщение
            console.log('Order is valid!');
            
            //собираем данные для отображения
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
            
            //показываем уведомление об успехе
            showNotification(successMessage, true);
            
            // +++ ДОБАВЛЯЕМ СОХРАНЕНИЕ ЗАКАЗА В ИСТОРИЮ +++
            saveOrderToHistory({
                name: name,
                email: email,
                phone: phone,
                address: address,
                deliveryTime: deliveryTime === 'scheduled' ? scheduledTime : 'asap',
                dishes: orderData,
                totalPrice: totalPrice,
                comment: document.getElementById('comment')?.value || '',
                date: new Date().toISOString()
            });
            
            //очищаем текущий заказ после оформления
            const manager = getOrderManager();
            if (manager && typeof manager.clearOrder === 'function') {
                manager.clearOrder();
            }
        }
    }
}

// Функция для настройки переключения времени доставки
function setupTimeDeliveryToggle() {
    const asapRadio = document.getElementById('delivery-asap');
    const scheduledRadio = document.getElementById('delivery-scheduled');
    const timePanel = document.getElementById('time-panel');
    
    if (!asapRadio || !scheduledRadio || !timePanel) {
        console.log('Элементы выбора времени не найдены');
        return;
    }
    
    // Изначально скрываем панель выбора времени
    timePanel.style.display = 'none';
    
    // Функция для обновления видимости панели времени
    function updateTimePanelVisibility() {
        if (scheduledRadio.checked) {
            timePanel.style.display = 'block';
            timePanel.style.animation = 'fadeIn 0.3s ease';
        } else {
            timePanel.style.display = 'none';
        }
    }
    
    // Вешаем обработчики на радио-кнопки
    asapRadio.addEventListener('change', updateTimePanelVisibility);
    scheduledRadio.addEventListener('change', updateTimePanelVisibility);
    
    // Инициализируем видимость
    updateTimePanelVisibility();
    
    console.log('Настроено переключение времени доставки');
}

//инициализация с повторными попытками
function initializeValidation() {
    const maxAttempts = 15; //увеличим количество попыток
    let attempts = 0;
    
    const tryInitialize = () => {
        //проверяем, на какой странице мы находимся
        const isLunchPage = window.location.pathname.includes('lunch.html');
        const isOrdersPage = window.location.pathname.includes('orders.html');
        
        //для разных страниц используем разных менеджеров
        let managerFound = false;
        
        if (isLunchPage) {
            //в lunch.html используем orderManager
            managerFound = typeof orderManager !== 'undefined' && orderManager;
        } else if (isOrdersPage) {
            //в orders.html используем ordersManager
            managerFound = typeof ordersManager !== 'undefined' && ordersManager;
        }
        
        if (managerFound) {
            console.log('Менеджер заказов найден, настраиваем валидацию...');
            setupOrderValidation();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`Ожидаем загрузки менеджера... попытка ${attempts}`);
            setTimeout(tryInitialize, 200);
        } else {
            console.log('Менеджер не загрузился, но настраиваем валидацию в любом случае');
            setupOrderValidation();
        }
    };
    
    tryInitialize();
}

//запускаем инициализацию
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting validation initialization...');
    setTimeout(initializeValidation, 500);
});

// +++ Функция для сохранения заказа в историю +++
function saveOrderToHistory(orderData) {
    try {
        // Получаем текущую историю заказов
        const history = JSON.parse(localStorage.getItem('foodConstruct_order_history') || '[]');
        
        // Создаем новый заказ с ID
        const newOrder = {
            id: Date.now(), // Используем timestamp как ID
            order_date: orderData.date,
            full_name: orderData.name,
            email: orderData.email,
            phone: orderData.phone,
            delivery_address: orderData.address,
            delivery_type: orderData.deliveryTime === 'asap' ? 'asap' : 'scheduled',
            delivery_time: orderData.deliveryTime === 'asap' ? null : orderData.deliveryTime,
            total_price: orderData.totalPrice,
            comment: orderData.comment,
            // Сохраняем блюда
            soup: orderData.dishes.soup,
            main: orderData.dishes.main,
            starter: orderData.dishes.starter,
            drink: orderData.dishes.drink,
            dessert: orderData.dishes.dessert
        };
        
        // Добавляем в начало массива (чтобы новые были первыми)
        history.unshift(newOrder);
        
        // Сохраняем в localStorage (ограничим 50 последних заказов)
        const limitedHistory = history.slice(0, 50);
        localStorage.setItem('foodConstruct_order_history', JSON.stringify(limitedHistory));
        
        console.log('Заказ сохранен в историю:', newOrder);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении заказа в историю:', error);
        return false;
    }
}

// +++ Функция для загрузки истории заказов +++
function loadOrderHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('foodConstruct_order_history') || '[]');
        console.log('Загружена история заказов:', history.length, 'шт.');
        return history;
    } catch (error) {
        console.error('Ошибка при загрузке истории заказов:', error);
        return [];
    }
}

// +++ Функция для создания уведомления (если showNotification не определена) +++
if (typeof window.showNotification === 'undefined') {
    window.showNotification = function(message, isSuccess = false) {
        console.log('Showing notification:', message);
        
        //удаляем предыдущие уведомления
        const oldNotification = document.querySelector('.notification-overlay');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        //создаем уведомление
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        
        //добавляем стили для гарантии работы
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
        
        const title = isSuccess ? 'Успешно!' : 'Внимание';
        
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
    };
}

//экспортируем функции для тестирования
if (typeof window !== 'undefined') {
    window.validateOrder = validateOrder;
    window.showNotification = showNotification;
    window.getOrderManager = getOrderManager;
    window.getCurrentOrderData = getCurrentOrderData;
    window.saveOrderToHistory = saveOrderToHistory;
    window.loadOrderHistory = loadOrderHistory;
}
