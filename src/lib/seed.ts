// Database seeding script - populates initial data
import db from './db';

export function seedDatabase() {
    // Check if already seeded
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count > 0) {
        console.log('Database already seeded');
        return;
    }

    console.log('Seeding database...');

    // Insert default users
    const insertUser = db.prepare('INSERT INTO users (username, pin, role) VALUES (?, ?, ?)');
    insertUser.run('admin', '1234', 'admin');
    insertUser.run('cashier', '5678', 'cashier');

    // Insert categories
    const categories = [
        { name: 'Steamed', order: 1 },
        { name: 'Tandoori', order: 2 },
        { name: 'Sandwich', order: 3 },
        { name: 'Boiled/Omelette', order: 4 },
        { name: 'Salad', order: 5 },
        { name: 'Brown Rice', order: 6 },
        { name: 'Shakes/Coffee', order: 7 },
        { name: 'Sprouts', order: 8 },
        { name: 'Wrap', order: 9 }
    ];

    const insertCategory = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)');
    const categoryIds: { [key: string]: number } = {};

    categories.forEach(cat => {
        const result = insertCategory.run(cat.name, cat.order);
        categoryIds[cat.name] = Number(result.lastInsertRowid);
    });

    // Insert products based on the menu
    const products = [
        // Steamed
        { name: 'Steamed Chicken Chest', category: 'Steamed', price: 100 },
        { name: 'Steamed Chicken Leg Thigh', category: 'Steamed', price: 120 },
        { name: 'Steamed Fish (250 gms)', category: 'Steamed', price: 290 },

        // Tandoori
        { name: 'Tandoori Chest (6 pc)', category: 'Tandoori', price: 130 },
        { name: 'Tandoori Leg Thigh (3 pc)', category: 'Tandoori', price: 140 },
        { name: 'Tandoori Chicken (Half)', category: 'Tandoori', price: 290 },
        { name: 'Tandoori Chicken (Full)', category: 'Tandoori', price: 450 },

        // Sandwich
        { name: 'Chicken Sandwich (Grilled)', category: 'Sandwich', price: 100 },
        { name: 'Boiled Egg Sandwich', category: 'Sandwich', price: 70 },
        { name: 'Egg Omlette Sandwich', category: 'Sandwich', price: 80 },
        { name: 'Veg. Paneer Sandwich', category: 'Sandwich', price: 80 },
        { name: 'Peanut Butter Sandwich (Grilled)', category: 'Sandwich', price: 50 },

        // Boiled/Omelette
        { name: 'Boiled Egg (per pc)', category: 'Boiled/Omelette', price: 10 },
        { name: 'Egg Omelette (3 pc)', category: 'Boiled/Omelette', price: 60 },
        { name: 'Chicken Egg Omelette', category: 'Boiled/Omelette', price: 150 },
        { name: 'Oats Egg Omelette', category: 'Boiled/Omelette', price: 80 },
        { name: 'Egg Bhurji', category: 'Boiled/Omelette', price: 70 },
        { name: 'Paneer Bhurji', category: 'Boiled/Omelette', price: 100 },

        // Salad
        { name: 'Chicken Salad', category: 'Salad', price: 190 },
        { name: 'Boiled Egg Salad', category: 'Salad', price: 160 },
        { name: 'Paneer Veg. Salad', category: 'Salad', price: 160 },

        // Brown Rice
        { name: 'Plain Brown Rice', category: 'Brown Rice', price: 80 },
        { name: 'Veg. Paneer Rice', category: 'Brown Rice', price: 140 },
        { name: 'Chicken Chest Rice', category: 'Brown Rice', price: 160 },
        { name: 'Chicken Leg Rice', category: 'Brown Rice', price: 170 },
        { name: 'Egg Brown Rice', category: 'Brown Rice', price: 140 },
        { name: 'Fish Rice (Full 650g)', category: 'Brown Rice', price: 240 },

        // Shakes/Coffee
        { name: 'Whey Protein Shake', category: 'Shakes/Coffee', price: 110 },
        { name: 'Gaining Protein Shake', category: 'Shakes/Coffee', price: 150 },
        { name: 'Banana Shake', category: 'Shakes/Coffee', price: 50 },
        { name: 'Cold Coffee', category: 'Shakes/Coffee', price: 90 },
        { name: 'Hot Coffee', category: 'Shakes/Coffee', price: 70 },

        // Sprouts
        { name: 'Chana+Mung Daal', category: 'Sprouts', price: 50 },
        { name: 'Sweet Corn Sprouts', category: 'Sprouts', price: 50 },
        { name: 'Mix Sprouts', category: 'Sprouts', price: 60 },
        { name: 'Egg Sprouts', category: 'Sprouts', price: 70 },

        // Wrap
        { name: 'Chicken Wrap', category: 'Wrap', price: 150 },
        { name: 'Veg. Paneer Wrap', category: 'Wrap', price: 130 }
    ];

    const insertProduct = db.prepare(
        'INSERT INTO products (name, category_id, price, enabled) VALUES (?, ?, ?, 1)'
    );

    products.forEach(product => {
        insertProduct.run(product.name, categoryIds[product.category], product.price);
    });

    console.log('Database seeded successfully!');
    console.log(`- Created 2 users (admin: 1234, cashier: 5678)`);
    console.log(`- Created ${categories.length} categories`);
    console.log(`- Created ${products.length} products`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
    process.exit(0);
}

export default seedDatabase;
