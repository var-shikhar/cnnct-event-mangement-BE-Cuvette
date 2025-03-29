import bcrypt from 'bcryptjs';
import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import User from '../modal/user-modal.js';

configDotenv();
const { MONGO_URI, SALT } = process.env;

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const userCount = await User.countDocuments();
        // If the user count is zero, create an admin user
        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash('Admin@123', Number(SALT));
            let adminUser = new User({
                firstName: 'Shikhar',
                lastName: 'Varshney',
                contact: 7500104052,
                email: 'shikharvarshney10@gmail.com',
                password: hashedPassword,
                preferences: ['Education', 'Tech'],
            });

            await adminUser.save();
            console.log('Admin User created successfully');
        }
        mongoose.connection.emit('connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;