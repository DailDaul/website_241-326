class OrdersManager {
    constructor() {
        this.form = document.getElementById('order-form');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.itemsContainer = document.getElementById('order-items');
        this.totalElement = document.getElementById('order-total');
        
        this.items = [];
        this.isSubmitting = false;
        
        this.loadCartItems();
        this.initEventListeners();
    }
    
    loadCartItems() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.items = cart;
        this.renderItems();
        this.updateTotal();
    }
    
    renderItems() {
        if (!this.itemsContainer) return;
        
        this.itemsContainer.innerHTML = '';
        
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <span>${item.name}</span>
                <span>${item.price} руб.</span>
            `;
            this.itemsContainer.appendChild(itemElement);
        });
    }
    
    updateTotal() {
        if (!this.totalElement) return;
        
        const total = this.items.reduce((sum, item) => sum + item.price, 0);
        this.totalElement.textContent = total;
    }
    
    initEventListeners() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
    }
    
    async submitOrder() {
        if (this.isSubmitting) return;
        
        this.isSubmitting = true;
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Оформляем заказ...';
        
        try {
            const formData = new FormData(this.form);
            const orderData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                items: this.items,
                total: this.items.reduce((sum, item) => sum + item.price, 0),
                date: new Date().toISOString()
            };
            
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сервера');
            }
            
            localStorage.removeItem('cart');
            window.location.href = '/order-success.html';
            
        } catch (error) {
            alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
            console.error('Ошибка оформления заказа:', error);
        } finally {
            this.isSubmitting = false;
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Оформить заказ';
        }
    }
}
