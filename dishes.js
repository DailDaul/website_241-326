const dishes = [
    {
        keyword: "gazpacho",
        name: "Гаспачо",
        price: 365,
        category: "soup",
        count: "350 мл",
        image: "images/gazpacho.jpg"
    },
    {
        keyword: "norwegian-soup",
        name: "Норвежский суп",
        price: 270,
        category: "soup",
        count: "400 мл",
        image: "images/norwegian.jpg"
    },
    {
        keyword: "mushroom-soup",
        name: "Грибной суп",
        price: 220,
        category: "soup",
        count: "380 мл",
        image: "images/mushroom.jpg"
    },
    {
        keyword: "salmon-soup",
        name: "Суп с лососем",
        price: 350,
        category: "soup",
        kind: "fish",
        count: "400 мл",
        image: "images/salmon-soup.jpg"
    },
    {
        keyword: "chicken-soup",
        name: "Куриный суп",
        price: 280,
        category: "soup",
        kind: "meat",
        count: "380 мл",
        image: "images/chicken-soup.jpg"
    },
    {
        keyword: "beef-soup",
        name: "Говяжий суп",
        price: 300,
        category: "soup",
        kind: "meat",
        count: "400 мл",
        image: "images/beef-soup.jpg"
    },

    {
        keyword: "lasagna",
        name: "Лазанья",
        price: 385,
        category: "main",
        count: "450 г",
        image: "images/lasagna.jpg"
    },
    {
        keyword: "fried-potatoes",
        name: "Жареная картошка с грибами",
        price: 150,
        category: "main",
        count: "350 г",
        image: "images/potato.jpg"
    },
    {
        keyword: "chicken-cutlets",
        name: "Котлеты из курицы с картофельным пюре",
        price: 225,
        category: "main",
        count: "420 г",
        image: "images/chicken.jpg"
    },
    {
        keyword: "grilled-salmon",
        name: "Лосось на гриле со спаржей",
        price: 420,
        category: "main",
        kind: "fish",
        count: "300 г",
        image: "images/salmon.jpg"
    },
    {
        keyword: "vegetable-stew",
        name: "Овощное рагу",
        price: 180,
        category: "main",
        kind: "veg",
        count: "400 г",
        image: "images/vegetable-stew.jpg"
    },
    {
        keyword: "fried-trout",
        name: "Жареная форель с рисом",
        price: 380,
        category: "main",
        kind: "fish",
        count: "350 г",
        image: "images/trout.jpg"
    },
    
    {
        keyword: "orange-juice",
        name: "Апельсиновый сок",
        price: 120,
        category: "drink",
        count: "300 мл",
        image: "images/orange.jpg"
    },
    {
        keyword: "apple-juice",
        name: "Яблочный сок",
        price: 90,
        category: "drink",
        count: "300 мл",
        image: "images/apple.jpg"
    },
    {
        keyword: "carrot-juice",
        name: "Морковный сок",
        price: 110,
        category: "drink",
        count: "300 мл",
        image: "images/carrot.jpg"
    },
    {
        keyword: "green-tea",
        name: "Зеленый чай",
        price: 80,
        category: "drink",
        kind: "hot",
        count: "400 мл",
        image: "images/green-tea.jpg"
    },
    {
        keyword: "black-tea",
        name: "Черный чай",
        price: 80,
        category: "drink",
        kind: "hot",
        count: "400 мл",
        image: "images/black-tea.jpg"
    },
    {
        keyword: "coffee",
        name: "Кофе",
        price: 150,
        category: "drink",
        kind: "hot",
        count: "300 мл",
        image: "images/coffee.jpg"
    },

    {
        keyword: "caesar-salad",
        name: "Салат Цезарь",
        price: 280,
        category: "starter",
        kind: "meat",
        count: "250 г",
        image: "images/caesar-salad.jpg"
    },
    {
        keyword: "greek-salad",
        name: "Греческий салат",
        price: 220,
        category: "starter",
        kind: "veg",
        count: "300 г",
        image: "images/greek-salad.jpg"
    },
    {
        keyword: "coleslaw-salad",
        name: "Коул слоу",
        price: 350,
        category: "starter",
        kind: "fish",
        count: "200 г",
        image: "images/coleslaw-salad.jpg"
    },
    {
        keyword: "caprese-salad",
        name: "Салат Капрезе",
        price: 240,
        category: "starter",
        kind: "veg",
        count: "250 г",
        image: "images/caprese-salad.jpg"
    },
    {
        keyword: "vegetable-salad",
        name: "Овощной салат",
        price: 180,
        category: "starter",
        kind: "veg",
        count: "300 г",
        image: "images/vegetable-salad.jpg"
    },
    {
        keyword: "fruit-salad",
        name: "Фруктовый салат",
        price: 200,
        category: "starter",
        kind: "veg",
        count: "350 г",
        image: "images/fruit-salad.jpg"
    },

    {
        keyword: "tiramisu",
        name: "Тирамису",
        price: 220,
        category: "dessert",
        kind: "small",
        count: "150 г",
        image: "images/tiramisu.jpg"
    },
    {
        keyword: "cheesecake",
        name: "Чизкейк",
        price: 250,
        category: "dessert",
        kind: "small",
        count: "180 г",
        image: "images/cheesecake.jpg"
    },
    {
        keyword: "chocolate-cake",
        name: "Шоколадный торт",
        price: 190,
        category: "dessert",
        kind: "small",
        count: "200 г",
        image: "images/chocolate-cake.jpg"
    },
    {
        keyword: "apple-pie",
        name: "Яблочный пирог",
        price: 280,
        category: "dessert",
        kind: "medium",
        count: "300 г",
        image: "images/apple-pie.jpg"
    },
    {
        keyword: "pancakes",
        name: "Блины с вареньем",
        price: 210,
        category: "dessert",
        kind: "medium",
        count: "350 г",
        image: "images/pancakes.jpg"
    },
    {
        keyword: "carrot-cake",
        name: "Морковный торт",
        price: 320,
        category: "dessert",
        kind: "large",
        count: "500 г",
        image: "images/carrot-cake.jpg"
    }
];
