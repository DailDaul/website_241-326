// orderManager.js - ОБНОВЛЕННАЯ ВЕРСИЯ
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
        
        // Ждем загрузки блюд из API
        this.waitForDishes();
    }
    
    async loadSavedOrder() {
        try {
            const savedOrderKeys = loadOrderFromStorage();
            
            // Загружаем блюда с API
            if (typeof loadDishes !== 'undefined') {
                const dishes = await loadDishes();
                
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
    
    waitForDishes() {
        const checkDishes = setInterval(() => {
            if (typeof dishes !== 'undefined' && dishes.length > 0) {
                clearInterval(checkDishes);
                this.init();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkDishes);
            console.log('Таймаут ожидания загрузки блюд с API');
        }, 10000);
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
        
        // ДОБАВЛЯЕМ обработчик для кнопки "Перейти к оформлению"
        if (e.target.id === 'go-to-order-btn' || e.target.closest('#go-to-order-btn')) {
            const goToOrderBtn = document.getElementById('go-to-order-btn');
            
            // Проверяем валидность заказа перед переходом
            if (typeof validateOrder !== 'undefined') {
                const validation = validateOrder(this.selectedDishes);
                
                if (!validation.isValid) {
                    e.preventDefault(); // Останавливаем переход
                    e.stopPropagation();
                    
                    // УБИРАЕМ УВЕДОМЛЕНИЕ, оставляем только блокировку
                    // Кнопка и так будет неактивна из-за updateOrderPanel()
                    
                    // Добавляем анимацию "тряски" кнопки
                    goToOrderBtn.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        goToOrderBtn.style.animation = '';
                    }, 500);
                    
                    return false;
                    }
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
    
    // УБИРАЕМ АВТОМАТИЧЕСКИЕ УВЕДОМЛЕНИЯ
    // Кнопка "Перейти к оформлению" сама по себе будет менять состояние
    }
    
    saveOrderToStorage() {
        saveOrderToStorage(this.selectedDishes);
    }
    
    updateOrderDisplay() {
        const orderBlocks = {
            soup: document.getElementById('selected-soup'),
            main: document.getElementById('selected-main'),
            starter: document.getElementById('selected-starter'),
            drink: document.getElementById('selected-drink'),
            dessert: document.getElementById('selected-dessert')
        };
        
        const categoryTitles = {
            soup: document.getElementById('soup-title'),
            main: document.getElementById('main-title'),
            starter: document.getElementById('starter-title'),
            drink: document.getElementById('drink-title'),
            dessert: document.getElementById('dessert-title')
        };
        
        const totalPriceElement = document.getElementById('total-price');
        const orderTotalElement = document.getElementById('order-total');
        const emptyMessage = document.getElementById('empty-message');
        
        let hasSelectedDishes = false;
        let totalPrice = 0;
        
        // обновляем отображение для каждой категории
        Object.keys(this.selectedDishes).forEach(category => {
            const dish = this.selectedDishes[category];
            const orderBlock = orderBlocks[category];
            const categoryTitle = categoryTitles[category];
            
            if (orderBlock && categoryTitle) {
                if (dish) {
                    orderBlock.innerHTML = `
                        <div class="selected-dish">
                            <span class="dish-name">${dish.name}</span>
                            <span class="dish-price">${dish.price}Р</span>
                        </div>
                    `;
                    categoryTitle.style.display = 'block';
                    orderBlock.style.display = 'block';
                    hasSelectedDishes = true;
                    totalPrice += dish.price;
                } else {
                    orderBlock.innerHTML = `
                        <div class="not-selected">
                            ${this.getNotSelectedText(category)}
                        </div>
                    `;
                    categoryTitle.style.display = 'block';
                    orderBlock.style.display = 'block';
                }
            }
        });
        
        // управляем отображением сообщения "Ничего не выбрано"
        if (emptyMessage) {
            if (!hasSelectedDishes) {
                emptyMessage.style.display = 'block';
                if (categoryTitles.soup) categoryTitles.soup.style.display = 'none';
                if (categoryTitles.main) categoryTitles.main.style.display = 'none';
                if (categoryTitles.starter) categoryTitles.starter.style.display = 'none';
                if (categoryTitles.drink) categoryTitles.drink.style.display = 'none';
                if (categoryTitles.dessert) categoryTitles.dessert.style.display = 'none';
                
                if (orderBlocks.soup) orderBlocks.soup.style.display = 'none';
                if (orderBlocks.main) orderBlocks.main.style.display = 'none';
                if (orderBlocks.starter) orderBlocks.starter.style.display = 'none';
                if (orderBlocks.drink) orderBlocks.drink.style.display = 'none';
                if (orderBlocks.dessert) orderBlocks.dessert.style.display = 'none';
                
                if (orderTotalElement) orderTotalElement.style.display = 'none';
            } else {
                emptyMessage.style.display = 'none';
                if (orderTotalElement) {
                    orderTotalElement.style.display = 'block';
                    if (totalPriceElement) {
                        totalPriceElement.textContent = totalPrice;
                    }
                }
            }
        }
        
        // Обновляем панель заказа на странице lunch.html
        this.updateOrderPanel();
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
    
    // метод для обновления панели заказа на странице lunch.html
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
            
            // ВАЖНО: Включаем/выключаем кнопку и меняем стили
            if (validation.isValid) {
                goToOrderBtn.disabled = false;
                goToOrderBtn.style.backgroundColor = '#ff6b00';
                goToOrderBtn.style.color = 'white';
                goToOrderBtn.style.cursor = 'pointer';
                goToOrderBtn.style.opacity = '1';
                goToOrderBtn.style.pointerEvents = 'auto';
            } else {
                goToOrderBtn.disabled = true;
                goToOrderBtn.style.backgroundColor = '#ccc';
                goToOrderBtn.style.color = '#666';
                goToOrderBtn.style.cursor = 'not-allowed';
                goToOrderBtn.style.opacity = '0.7';
                goToOrderBtn.style.pointerEvents = 'none';
                
                // Также можно показать сообщение о том, что не хватает
                // console.log('Заказ невалиден:', validation.message);
            }
        }
    } else {
        orderPanel.style.display = 'none';
    }
}
    
    // метод для очистки заказа
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
        this.updateOrderDisplay();
        this.updateDishCardsHighlight();
    }
}

// инициализация менеджера заказов
let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    orderManager = new OrderManager();
});

// Экспортируем менеджер заказов
if (typeof window !== 'undefined') {
    window.orderManager = orderManager;
}
