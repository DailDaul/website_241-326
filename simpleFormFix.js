// Простой фикс для кнопки отправки заказа
console.log('simpleFormFix.js loaded');

// 1. Проверяем, что все элементы существуют
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== SIMPLE FORM FIX ===');
    
    // Ждем немного чтобы все загрузилось
    setTimeout(function() {
        const form = document.querySelector('.order-form');
        const button = document.querySelector('.submit-btn');
        
        console.log('Form found:', !!form);
        console.log('Button found:', !!button);
        console.log('Button type:', button ? button.type : 'no button');
        
        if (!form || !button) {
            console.error('Форма или кнопка не найдены!');
            return;
        }
        
        // 2. Вешаем самый простой обработчик на кнопку
        button.addEventListener('click', function(event) {
            console.log('🎯 КНОПКА НАЖАТА!');
            event.preventDefault(); // Останавливаем отправку
            
            // Проверяем заполнены ли обязательные поля
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            
            if (!name || !email || !phone || !address) {
                alert('Пожалуйста, заполните все поля формы!');
                return;
            }
            
            // Проверяем выбран ли хоть один товар
            if (!orderManager) {
                alert('Ошибка: менеджер заказов не загружен');
                return;
            }
            
            const orderData = orderManager.getOrderData();
            const hasItems = orderData.soup || orderData.main || orderData.starter || 
                           orderData.drink || orderData.dessert;
            
            if (!hasItems) {
                alert('Выберите хотя бы одно блюдо!');
                return;
            }
            
            // Если все ок - отправляем
            alert('Заказ отправляется...');
            console.log('Отправка формы на:', form.action);
            
            // Ждем 1 секунду и отправляем
            setTimeout(function() {
                form.submit();
            }, 1000);
        });
        
        // 3. Также вешаем на саму форму (на всякий случай)
        form.addEventListener('submit', function(event) {
            console.log('📝 ФОРМА ОТПРАВЛЯЕТСЯ');
            event.preventDefault(); // Останавливаем по умолчанию
        });
        
        console.log('✅ Обработчики установлены успешно');
        
    }, 1000); // Даем 1 секунду на загрузку всего
});
[file content end]
