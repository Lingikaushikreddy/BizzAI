import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Item from '../models/Item.js';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming .env is in the root backend directory, which is one level up from scripts/
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bizzai';
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // clear existing data
        await User.deleteMany({});
        await Item.deleteMany({});
        console.log('Cleared existing data');

        // Create Admin User
        const user = await User.create({
            name: 'Test Admin',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            shopName: 'Test Shop'
        });
        console.log('Admin User created: admin@example.com / password123');

        // Create Items
        const items = [
            {
                user: user._id,
                addedBy: user._id,
                name: 'Wireless Mouse',
                sku: '12345678',
                costPrice: 500,
                sellingPrice: 1200,
                stockQty: 50,
                category: 'Electronics'
            },
            {
                user: user._id,
                addedBy: user._id,
                name: 'Mechanical Keyboard',
                sku: '87654321',
                costPrice: 2000,
                sellingPrice: 4500,
                stockQty: 20,
                category: 'Electronics'
            },
            {
                user: user._id,
                addedBy: user._id,
                name: 'USB-C Cable',
                sku: '11223344',
                costPrice: 100,
                sellingPrice: 350,
                stockQty: 100,
                category: 'Accessories'
            }
        ];

        await Item.insertMany(items);
        console.log('Sample Items created');

        console.log('Database Seeded Successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
