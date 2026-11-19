import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createLiaisoningEmployee() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'liaisoning@swayog.in' }
    });

    if (existing) {
      console.log('Liaisoning Employee user already exists:', existing.email);
      console.log('Login ID:', existing.loginId);
      console.log('Password: liaisoning123');
      return;
    }

    // Create the user
    const passwordHash = await bcrypt.hash('liaisoning123', 10);
    
    const user = await prisma.user.create({
      data: {
        loginId: 'LIA-001',
        email: 'liaisoning@swayog.in',
        phoneNumber: '9999999999',
        fullName: 'Liaisoning Employee',
        passwordHash,
        role: 'EMPLOYEE',
        designationTitle: 'Liaisoning Employee',
        isActive: true,
        employeeProfile: {
          create: {
            jobRole: 'liaisoning_employee',
            zone: 'Pune',
            isActive: true,
          }
        }
      }
    });

    console.log('✅ Liaisoning Employee user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('-------------------');
    console.log('Role: Employee');
    console.log('Login ID: LIA-001');
    console.log('Email: liaisoning@swayog.in');
    console.log('Password: liaisoning123');
    console.log('');
    console.log('After login, you will be automatically redirected to the Liaisoning Dashboard.');
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLiaisoningEmployee();
