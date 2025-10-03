import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chatbot.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isApproved: true,
      approvedBy: null,
      approvedAt: new Date(),
      isActive: true
    });

    console.log('Admin user created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Username:', adminUser.username);
    console.log('Password:', adminPassword);
    console.log('Role:', adminUser.role);
    console.log('Approved:', adminUser.isApproved);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();
