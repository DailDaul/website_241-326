// orderService.js
class OrderService {
    constructor() {
        this.API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
    }
    
    async submitOrder(orderData) {
        try {
            console.log('Отправка заказа на сервер:', orderData);
            
            const response = await fetch(`${this.API_URL}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || `Ошибка ${response.status}`);
            }
            
            return {
                success: true,
                data: responseData,
                message: 'Заказ успешно оформлен!'
            };
            
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            return {
                success: false,
                message: error.message || 'Ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.'
            };
        }
    }
    
    async checkOrderCombo(orderData) {
        try {
            const response = await fetch(`${this.API_URL}/check-combo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при проверке комбо:', error);
            return { isValid: false, message: 'Ошибка проверки комбо' };
        }
    }
}

// Создаем глобальный экземпляр сервиса
if (typeof window !== 'undefined') {
    window.orderService = new OrderService();
}
