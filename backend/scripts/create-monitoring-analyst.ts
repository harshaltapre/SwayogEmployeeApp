import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createMonitoringAnalyst() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'monitoring@swayog.in' }
    });

    if (existing) {
      console.log('Monitoring Analyst user already exists:', existing.email);
      console.log('Login ID:', existing.loginId);
      console.log('Password: monitoring123');
      return;
    }

    // Create the user
    const passwordHash = await bcrypt.hash('monitoring123', 10);
    
    const user = await prisma.user.create({
      data: {
        loginId: 'MON-001',
        email: 'monitoring.liaisoning@swayog.in',
        phoneNumber: '7777777777',
        fullName: 'Monitoring Analyst',
        passwordHash,
        role: 'EMPLOYEE',
        designationTitle: 'Monitoring Analyst',
        isActive: true,
        employeeProfile: {
          create: {
            jobRole: 'monitoring_analyst',
            zone: 'Pune',
            isActive: true,
          }
        }
      }
    });

    console.log('✅ Monitoring Analyst user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('-------------------');
    console.log('Role: Employee');
    console.log('Login ID: MON-001');
    console.log('Email: monitoring@swayog.in');
    console.log('Password: monitoring123');
    console.log('');
    console.log('After login, you will be automatically redirected to the Liaisoning Process dashboard.');
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMonitoringAnalyst();
