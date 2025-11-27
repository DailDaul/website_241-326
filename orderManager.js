class OrderManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            drink: null
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateOrderDisplay();
    }
    
    setupEventListeners() {
        //обработчик клика на карточки блюд
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dish-item')) {
                const dishItem = e.target.closest('.dish-item');
                const dishKeyword = dishItem.getAttribute('data-dish');
                this.selectDish(dishKeyword);
            }
        });
    }
    
    selectDish(dishKeyword) {
        const dish = dishes.find(d => d.keyword === dishKeyword);
        if (!dish) return;
        
        //сохраняем выбранное блюдо в соответствующей категории
        this.selectedDishes[dish.category] = dish;
        
        //обновляем отображение заказа
        this.updateOrderDisplay();
    }
    
    updateOrderDisplay() {
        const orderBlocks = {
            soup: document.getElementById('selected-soup'),
            main: document.getElementById('selected-main'),
            drink: document.getElementById('selected-drink')
        };
        
        const categoryTitles = {
            soup: document.getElementById('soup-title'),
            main: document.getElementById('main-title'),
            drink: document.getElementById('drink-title')
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
        });
        
        //управляем отображением сообщения "Ничего не выбрано"
        if (!hasSelectedDishes) {
            emptyMessage.style.display = 'block';
            Object.values(categoryTitles).forEach(title => title.style.display = 'none');
            Object.values(orderBlocks).forEach(block => block.style.display = 'none');
            orderTotalElement.style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            orderTotalElement.style.display = 'block';
            totalPriceElement.textContent = totalPrice;
        }
    }
    
    getNotSelectedText(category) {
        const texts = {
            soup: 'Суп не выбран',
            main: 'Главное блюдо не выбрано',
            drink: 'Напиток не выбран'
        };
        return texts[category] || 'Блюдо не выбрано';
    }
    
    //метод для получения данных заказа для формы
    getOrderData() {
        return {
            soup: this.selectedDishes.soup,
            main: this.selectedDishes.main,
            drink: this.selectedDishes.drink,
            total: Object.values(this.selectedDishes).reduce((sum, dish) => sum + (dish ? dish.price : 0), 0)
        };
    }
}

//инициализация менеджера заказов
let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    orderManager = new OrderManager();
});
