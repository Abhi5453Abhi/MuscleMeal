// Database seeding script - populates initial data
import { supabase } from './db';

export async function seedDatabase() {
    try {
        // Check if already seeded
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (count && count > 0) {
            console.log('Database already seeded');
            return;
        }

        console.log('Seeding database...');

        // Insert default users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .insert([
                { username: 'admin', pin: '1234', role: 'admin' },
                { username: 'cashier', pin: '5678', role: 'cashier' }
            ])
            .select();

        if (usersError) {
            console.error('Error seeding users:', usersError);
            throw usersError;
        }

        // Insert categories
        const categories = [
            { name: 'Steamed', display_order: 1 },
            { name: 'Tandoori', display_order: 2 },
            { name: 'Sandwich', display_order: 3 },
            { name: 'Boiled/Omelette', display_order: 4 },
            { name: 'Salad', display_order: 5 },
            { name: 'Brown Rice', display_order: 6 },
            { name: 'Shakes/Coffee', display_order: 7 },
            { name: 'Sprouts', display_order: 8 },
            { name: 'Wrap', display_order: 9 }
        ];

        const { data: insertedCategories, error: categoriesError } = await supabase
            .from('categories')
            .insert(categories)
            .select();

        if (categoriesError) {
            console.error('Error seeding categories:', categoriesError);
            throw categoriesError;
        }

        const categoryIds: { [key: string]: number } = {};
        insertedCategories?.forEach(cat => {
            categoryIds[cat.name] = cat.id;
        });

        // Insert products based on the menu
        const products = [
            // Steamed
            { name: 'Steamed Chicken Chest', category_id: categoryIds['Steamed'], price: 100 },
            { name: 'Steamed Chicken Leg Thigh', category_id: categoryIds['Steamed'], price: 120 },
            { name: 'Steamed Fish (250 gms)', category_id: categoryIds['Steamed'], price: 290 },

            // Tandoori
            { name: 'Tandoori Chest (6 pc)', category_id: categoryIds['Tandoori'], price: 130 },
            { name: 'Tandoori Leg Thigh (3 pc)', category_id: categoryIds['Tandoori'], price: 140 },
            { name: 'Tandoori Chicken (Half)', category_id: categoryIds['Tandoori'], price: 290 },
            { name: 'Tandoori Chicken (Full)', category_id: categoryIds['Tandoori'], price: 450 },

            // Sandwich
            { name: 'Chicken Sandwich (Grilled)', category_id: categoryIds['Sandwich'], price: 100 },
            { name: 'Boiled Egg Sandwich', category_id: categoryIds['Sandwich'], price: 70 },
            { name: 'Egg Omlette Sandwich', category_id: categoryIds['Sandwich'], price: 80 },
            { name: 'Veg. Paneer Sandwich', category_id: categoryIds['Sandwich'], price: 80 },
            { name: 'Peanut Butter Sandwich (Grilled)', category_id: categoryIds['Sandwich'], price: 50 },

            // Boiled/Omelette
            { name: 'Boiled Egg (per pc)', category_id: categoryIds['Boiled/Omelette'], price: 10 },
            { name: 'Egg Omelette (3 pc)', category_id: categoryIds['Boiled/Omelette'], price: 60 },
            { name: 'Chicken Egg Omelette', category_id: categoryIds['Boiled/Omelette'], price: 150 },
            { name: 'Oats Egg Omelette', category_id: categoryIds['Boiled/Omelette'], price: 80 },
            { name: 'Egg Bhurji', category_id: categoryIds['Boiled/Omelette'], price: 70 },
            { name: 'Paneer Bhurji', category_id: categoryIds['Boiled/Omelette'], price: 100 },

            // Salad
            { name: 'Chicken Salad', category_id: categoryIds['Salad'], price: 190 },
            { name: 'Boiled Egg Salad', category_id: categoryIds['Salad'], price: 160 },
            { name: 'Paneer Veg. Salad', category_id: categoryIds['Salad'], price: 160 },

            // Brown Rice
            { name: 'Plain Brown Rice', category_id: categoryIds['Brown Rice'], price: 80 },
            { name: 'Veg. Paneer Rice', category_id: categoryIds['Brown Rice'], price: 140 },
            { name: 'Chicken Chest Rice', category_id: categoryIds['Brown Rice'], price: 160 },
            { name: 'Chicken Leg Rice', category_id: categoryIds['Brown Rice'], price: 170 },
            { name: 'Egg Brown Rice', category_id: categoryIds['Brown Rice'], price: 140 },
            { name: 'Fish Rice (Full 650g)', category_id: categoryIds['Brown Rice'], price: 240 },

            // Shakes/Coffee
            { name: 'Whey Protein Shake', category_id: categoryIds['Shakes/Coffee'], price: 110 },
            { name: 'Gaining Protein Shake', category_id: categoryIds['Shakes/Coffee'], price: 150 },
            { name: 'Banana Shake', category_id: categoryIds['Shakes/Coffee'], price: 50 },
            { name: 'Cold Coffee', category_id: categoryIds['Shakes/Coffee'], price: 90 },
            { name: 'Hot Coffee', category_id: categoryIds['Shakes/Coffee'], price: 70 },

            // Sprouts
            { name: 'Chana+Mung Daal', category_id: categoryIds['Sprouts'], price: 50 },
            { name: 'Sweet Corn Sprouts', category_id: categoryIds['Sprouts'], price: 50 },
            { name: 'Mix Sprouts', category_id: categoryIds['Sprouts'], price: 60 },
            { name: 'Egg Sprouts', category_id: categoryIds['Sprouts'], price: 70 },

            // Wrap
            { name: 'Chicken Wrap', category_id: categoryIds['Wrap'], price: 150 },
            { name: 'Veg. Paneer Wrap', category_id: categoryIds['Wrap'], price: 130 }
        ];

        const { data: insertedProducts, error: productsError } = await supabase
            .from('products')
            .insert(products)
            .select();

        if (productsError) {
            console.error('Error seeding products:', productsError);
            throw productsError;
        }

        console.log('Database seeded successfully!');
        console.log(`- Created 2 users (admin: 1234, cashier: 5678)`);
        console.log(`- Created ${categories.length} categories`);
        console.log(`- Created ${products.length} products`);
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

export default seedDatabase;
