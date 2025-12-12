class OrderManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateOrderDisplay();
        // Обновляем отображение блюд при инициализации
        if (typeof displayDishes === 'function') {
            setTimeout(() => displayDishes(), 100);
        }
    }
    
    setupEventListeners() {
        //обработчик клика на кнопку "Добавить"
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
        const dish = dishes.find(d => d.keyword === dishKeyword);
        if (!dish) return;
        
        //проверяем, было ли это блюдо уже выбрано
        const wasSelected = this.selectedDishes[dish.category]?.keyword === dishKeyword;
        
        //если блюдо уже выбрано, снимаем выбор
        if (wasSelected) {
            this.selectedDishes[dish.category] = null;
        } else {
            //иначе выбираем новое блюдо
            this.selectedDishes[dish.category] = dish;
        }
        
        //обновляем отображение заказа
        this.updateOrderDisplay();
        
        // ОБНОВЛЯЕМ ПОДСВЕТКУ КАРТОЧЕК
        this.updateDishCardsHighlight();
        
        //обновляем отображение всех блюд для подсветки
        if (typeof displayDishes === 'function') {
            displayDishes();
        }
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
        
        //обновляем отображение для каждой категории
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
        
        //управляем отображением сообщения "Ничего не выбрано"
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
}

//инициализация менеджера заказов
let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    orderManager = new OrderManager();
    
    // Вызываем подсветку при загрузке (на случай, если есть сохраненные выборы)
    setTimeout(() => {
        if (orderManager.updateDishCardsHighlight) {
            orderManager.updateDishCardsHighlight();
        }
    }, 500);
});
