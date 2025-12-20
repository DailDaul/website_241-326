// Утилиты для работы с авторизацией
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru';

// Функция для авторизации пользователя
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/labs/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            throw new Error(`Ошибка авторизации: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.token) {
            // Сохраняем токен
            saveAuthToken(data.token);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return false;
    }
}

// Функция для регистрации пользователя
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/labs/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`Ошибка регистрации: ${response.status}`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return null;
    }
}

// Функция для проверки авторизации
function isAuthenticated() {
    return !!getAuthToken();
}

// Функция для выхода
function logoutUser() {
    localStorage.removeItem('foodConstruct_auth_token');
}

// Экспортируем функции
if (typeof window !== 'undefined') {
    window.loginUser = loginUser;
    window.registerUser = registerUser;
    window.isAuthenticated = isAuthenticated;
    window.logoutUser = logoutUser;
}
