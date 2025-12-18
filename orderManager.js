class OrderManager {
    constructor() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        this.loadSavedOrder();
    }
    
    async loadSavedOrder() {
        try {
            const savedOrderKeys = loadOrderFromStorage();
            
            if (typeof dishes !== 'undefined' && dishes.length > 0) {
                Object.keys(savedOrderKeys).forEach(category => {
                    const dishKeyword = savedOrderKeys[category];
                    if (dishKeyword && dishes) {
                        const dish = dishes.find(d => d.keyword === dishKeyword);
                        if (dish) {
                            this.selectedDishes[category] = dish;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка при загрузке сохраненного заказа:', error);
        }
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
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
        if (!dish) {
            return;
        }
        
        const wasSelected = this.selectedDishes[dish.category]?.keyword === dishKeyword;
        
        if (wasSelected) {
            this.selectedDishes[dish.category] = null;
        } else {
            this.selectedDishes[dish.category] = dish;
        }
        
        this.saveOrderToStorage();
        this.updateDishCardsHighlight();
        this.updateOrderPanel();
    }
    
    saveOrderToStorage() {
        saveOrderToStorage(this.selectedDishes);
    }
    
    updateDishCardsHighlight() {
        document.querySelectorAll('.dish-item').forEach(item => {
            item.classList.remove('selected');
            const addButton = item.querySelector('.add-button');
            if (addButton) {
                addButton.textContent = 'Добавить';
            }
        });
        
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
        
        let totalPrice = 0;
        Object.values(this.selectedDishes).forEach(dish => {
            if (dish) {
                totalPrice += dish.price;
            }
        });
        
        orderTotal.textContent = totalPrice;
        
        if (totalPrice > 0) {
            orderPanel.style.display = 'block';
            
            if (typeof validateOrder !== 'undefined') {
                const validation = validateOrder(this.selectedDishes);
                
                if (validation.isValid) {
                    goToOrderBtn.disabled = false;
                    goToOrderBtn.style.pointerEvents = 'auto';
                    goToOrderBtn.style.opacity = '1';
                } else {
                    goToOrderBtn.disabled = true;
                    goToOrderBtn.style.pointerEvents = 'none';
                    goToOrderBtn.style.opacity = '0.6';
                }
            }
        } else {
            orderPanel.style.display = 'none';
        }
    }
    
    clearOrder() {
        this.selectedDishes = {
            soup: null,
            main: null,
            starter: null,
            drink: null,
            dessert: null
        };
        
        clearOrderFromStorage();
        this.updateDishCardsHighlight();
        this.updateOrderPanel();
    }
}

let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('soups') || document.querySelector('.dishes-grid')) {
        orderManager = new OrderManager();
        orderManager.init();
    }
});
