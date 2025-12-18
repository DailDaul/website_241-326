class OrderManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        // Загружаем сохраненный заказ из localStorage
        this.loadSavedOrder();
    }
    
    async loadSavedOrder() {
        try {
            const savedOrderKeys = loadOrderFromStorage();
            
            // Ждем загрузки блюд (через глобальную переменную dishes из displayDishes.js)
            if (typeof dishes !== 'undefined' && dishes.length > 0) {
                // Восстанавливаем выбранные блюда по ключам
                Object.keys(savedOrderKeys).forEach(category => {
                    const dishKeyword = savedOrderKeys[category];
                    if (dishKeyword && dishes) {
                        const dish = dishes.find(d => d.keyword === dishKeyword);
                        if (dish) {
                            this.selectedDishes[category] = dish;
                        }
                    }
                });
                
                console.log('Восстановлен заказ из localStorage:', this.selectedDishes);
            }
        } catch (error) {
            console.error('Ошибка при загрузке сохраненного заказа:', error);
        }
    }
    
    init() {
        this.setupEventListeners();
        this.updateOrderDisplay();
    }
    
    setupEventListeners() {
        // обработчик клика на кнопку "Добавить"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-button')) {
                const dishItem = e.target.closest('.dish-item');
                if (dishItem) {
                    const dishKeyword = dishItem.getAttribute('data-dish');
                    this.selectDish(dishKeyword);
                }
            }
        });
    }
    
    selectDish(dishKeyword) {
        // Ищем блюдо в глобальном массиве dishes (загруженном из API)
        const dish = dishes.find(d => d.keyword === dishKeyword);
        if (!dish) {
            console.error('Блюдо не найдено:', dishKeyword);
            return;
        }
        
        // проверяем, было ли это блюдо уже выбрано
        const wasSelected = this.selectedDishes[dish.category]?.keyword === dishKeyword;
        
        // если блюдо уже выбрано, снимаем выбор
        if (wasSelected) {
            this.selectedDishes[dish.category] = null;
        } else {
            // иначе выбираем новое блюдо
            this.selectedDishes[dish.category] = dish;
        }
        
        // сохраняем заказ в localStorage
        this.saveOrderToStorage();
        
        // обновляем отображение заказа
        this.updateOrderDisplay();
        
        // ОБНОВЛЯЕМ ПОДСВЕТКУ КАРТОЧЕК
        this.updateDishCardsHighlight();
        
        // Обновляем панель заказа
        this.updateOrderPanel();
    }
    
    saveOrderToStorage() {
        saveOrderToStorage(this.selectedDishes);
    }
    
    getNotSelectedText(category) {
        const texts = {
            soup: 'Суп не выбран',
            main: 'Главное блюдо не выбрано',
            starter: 'Салат или стартер не выбран',
            drink: 'Напиток не выбран',
            dessert: 'Десерт не выбран'
        };
        return texts[category] || 'Блюдо не выбрано';
    }
    
    // метод для получения данных заказа для формы
    getOrderData() {
        return {
            soup: this.selectedDishes.soup,
            main: this.selectedDishes.main,
            starter: this.selectedDishes.starter,
            drink: this.selectedDishes.drink,
            dessert: this.selectedDishes.dessert
        };
    }
    
    // метод для обновления подсветки карточек
    updateDishCardsHighlight() {
        // Удаляем подсветку со всех карточек
        document.querySelectorAll('.dish-item').forEach(item => {
            item.classList.remove('selected');
            const addButton = item.querySelector('.add-button');
            if (addButton) {
                addButton.textContent = 'Добавить';
            }
        });
        
        // Добавляем подсветку выбранным карточкам
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish) {
                const dishItem = document.querySelector(`[data-dish="${dish.keyword}"]`);
                if (dishItem) {
                    dishItem.classList.add('selected');
                    const addButton = dishItem.querySelector('.add-button');
                    if (addButton) {
                        addButton.textContent = 'Добавлено';
                    }
                }
            }
        });
    }
    
    updateOrderPanel() {
        const orderPanel = document.getElementById('order-panel');
        const orderTotal = document.getElementById('order-total-price');
        const goToOrderBtn = document.getElementById('go-to-order-btn');
        
        if (!orderPanel || !orderTotal || !goToOrderBtn) return;
        
        // Рассчитываем общую стоимость
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish) {
                totalPrice += dish.price;
            }
        });
        
        // Обновляем стоимость
        orderTotal.textContent = totalPrice;
        
        // Показываем/скрываем панель в зависимости от наличия выбранных блюд
        if (totalPrice > 0) {
            orderPanel.style.display = 'block';
            
            // Проверяем валидность заказа (соответствие комбо)
            if (typeof validateOrder !== 'undefined') {
                const validation = validateOrder(this.selectedDishes);
                
                if (validation.isValid) {
                    // Заказ валиден - кнопка активна
                    goToOrderBtn.disabled = false;
                    goToOrderBtn.style.pointerEvents = 'auto';
                    goToOrderBtn.style.opacity = '1';
                    goToOrderBtn.title = 'Перейти к оформлению заказа';
                } else {
                    // Заказ невалиден - кнопка неактивна
                    goToOrderBtn.disabled = true;
                    goToOrderBtn.style.pointerEvents = 'none';
                    goToOrderBtn.style.opacity = '0.6';
                    goToOrderBtn.title = 'Выберите один из доступных комбо-ланчей';
                }
            }
        } else {
            orderPanel.style.display = 'none';
        }
    }
    
    // метод для очистки заказа (используется на lunch.html)
    clearOrder() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        // Удаляем из localStorage
        clearOrderFromStorage();
        
        // Обновляем отображение
        this.updateDishCardsHighlight();
        this.updateOrderPanel();
    }
}

// инициализация менеджера заказов
let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    // Создаем OrderManager только на странице lunch.html
    if (document.getElementById('soups') || document.querySelector('.dishes-grid')) {
        orderManager = new OrderManager();
        orderManager.init();
    }
});
