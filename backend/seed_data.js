import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Item from './models/Item.js';

dotenv.config();

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bizzai_example';

        // Clean the connection string
        const cleanUri = mongoUri.replace(/^\?o/g, '').replace(/\?\?$/g, '').trim();

        console.log(`🔌 Connecting to MongoDB at ${cleanUri}...`);
        await mongoose.connect(cleanUri);
        console.log('📦 Connected to MongoDB');

        // Clean existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Item.deleteMany({});

        // Create Admin User
        console.log('👤 Creating Admin User...');
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            shopName: 'Test Shop'
        });
        console.log('✅ Admin User created: admin@example.com / password123');

        // Create Items
        console.log('📦 Creating Inventory Items...');
        const items = [
            {
                name: 'Laptop',
                sku: '123456789',
                category: 'Electronics',
                costPrice: 50000,
                sellingPrice: 65000,
                stockQty: 10,
                addedBy: adminUser._id
            },
            {
                name: 'Wireless Mouse',
                sku: 'MSE-002',
                category: 'Electronics',
                costPrice: 500,
                sellingPrice: 999,
                stockQty: 50,
                addedBy: adminUser._id
            },
            {
                name: 'Keyboard',
                sku: 'KEY-003',
                category: 'Electronics',
                costPrice: 800,
                sellingPrice: 1500,
                stockQty: 30,
                addedBy: adminUser._id
            }
        ];

        await Item.insertMany(items);
        console.log(`✅ Created ${items.length} sample items`);

        console.log('✨ Seed Script Completed Successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Script Failed:', error);
        process.exit(1);
    }
};

seedData();
