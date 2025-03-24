import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.qbank_users.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User'
      }
    });

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    });

    console.log('\nYou can now log in with:');
    console.log('Email: test@example.com');
    console.log('Password: test123');

  } catch (error) {
    console.error('Failed to create test user:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser().catch(console.error);