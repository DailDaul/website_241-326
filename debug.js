// Скрипт для отладки истории заказов
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Запуск отладки истории заказов');
    
    // Проверяем localStorage
    console.log('=== ПРОВЕРКА LOCALSTORAGE ===');
    
    const orderKeys = ['foodConstruct_order', 'foodConstruct_orders'];
    
    orderKeys.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`Ключ: "${key}"`);
        console.log(`Данные:`, data);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`Парсинг успешен:`, parsed);
            } catch (e) {
                console.log(`Ошибка парсинга:`, e.message);
            }
        }
    });
    
    // Добавляем кнопку для очистки истории (только для отладки)
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(255,107,0,0.9);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 12px;
    `;
    
    debugDiv.innerHTML = `
        <strong>Отладка:</strong><br>
        <button onclick="clearHistory()" style="margin: 5px 0; padding: 5px; background: white; color: #ff6b00; border: none; border-radius: 3px; cursor: pointer;">
            Очистить историю
        </button>
        <button onclick="reloadPage()" style="margin: 5px 0; padding: 5px; background: white; color: #ff6b00; border: none; border-radius: 3px; cursor: pointer;">
            Обновить
        </button>
        <div id="debug-info"></div>
    `;
    
    document.body.appendChild(debugDiv);
    
    window.clearHistory = function() {
        localStorage.removeItem('foodConstruct_orders');
        console.log('История очищена');
        alert('История заказов очищена');
        location.reload();
    };
    
    window.reloadPage = function() {
        location.reload();
    };
    
    // Обновляем информацию
    setTimeout(() => {
        const data = localStorage.getItem('foodConstruct_orders');
        const infoDiv = document.getElementById('debug-info');
        if (infoDiv) {
            infoDiv.innerHTML = `Заказов: ${data ? JSON.parse(data).length : 0}`;
        }
    }, 1000);
});
