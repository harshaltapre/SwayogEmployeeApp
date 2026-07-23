import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve('d:/intrnship/SwayogEmployeeApp/backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value.trim();
    }
  });
}

const sampleBeforeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const sampleAfterBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function testAmcCompletion() {
  const { completeTask, listTasks } = await import('../backend/src/modules/tasks/tasks.service.js');
  const prisma = new PrismaClient();

  try {
    // Find an active employee
    const employee = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE', isActive: true }
    });
    const customer = await prisma.customer.findFirst();

    if (!employee || !customer) {
      console.error('Employee or customer missing');
      return;
    }

    // Create a pending AMC visit
    const visit = await prisma.amcVisit.create({
      data: {
        customerId: customer.id,
        scheduledDate: new Date(),
        status: 'PENDING',
        assignedEmployeeId: employee.id
      }
    });

    console.log(`Created test AMC visit ID amc_${visit.id} for customer ${customer.fullName}`);

    const authContext = {
      userId: employee.id,
      role: employee.role,
      jobRole: 'field_technician',
      departmentId: null
    };

    const completionPayload = {
      message: "Completed solar panel cleaning and inverter check.",
      beforeImageUrl: sampleBeforeBase64,
      afterImageUrl: sampleAfterBase64
    };

    console.log('Submitting completeTask for AMC visit...');
    const completeResult: any = await completeTask(authContext as any, `amc_${visit.id}`, completionPayload);

    console.log('completeTask Result:', {
      id: completeResult.id,
      status: completeResult.status,
      beforeImageUrl: completeResult.beforeImageUrl,
      afterImageUrl: completeResult.afterImageUrl,
      completionMessage: completeResult.completionMessage
    });

    // Test listTasks to ensure serializedAmc includes image URLs
    console.log('Fetching tasks list for employee...');
    const tasksList: any = await listTasks(authContext as any, { employeeUserId: employee.id, limit: 100 });
    const amcInList = tasksList.find((t: any) => t.id === `amc_${visit.id}`);

    console.log('AMC visit in listTasks:', {
      id: amcInList?.id,
      jobType: amcInList?.jobType,
      status: amcInList?.status,
      beforeImageUrl: amcInList?.beforeImageUrl,
      afterImageUrl: amcInList?.afterImageUrl,
      completionMessage: amcInList?.completionMessage
    });

    // Query Neon DB directly to verify AmcVisit record columns
    console.log('=== VERIFYING AMC VISIT RECORD DIRECTLY IN DB ===');
    const dbRecord = await prisma.amcVisit.findUnique({
      where: { id: visit.id }
    });

    console.log({
      id: dbRecord?.id,
      status: dbRecord?.status,
      notes: dbRecord?.notes,
      beforeImageUrl: dbRecord?.beforeImageUrl,
      afterImageUrl: dbRecord?.afterImageUrl,
      completedAt: dbRecord?.completedAt
    });

    if (dbRecord?.beforeImageUrl && dbRecord?.afterImageUrl && amcInList?.beforeImageUrl && amcInList?.afterImageUrl) {
      console.log('\nSUCCESS! AMC visit images are now saved in DB AND correctly returned to the Android app in listTasks & completeTask!');
    } else {
      console.error('\nFAILURE! AMC visit images still missing.');
    }

  } catch (err) {
    console.error('AMC Test error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAmcCompletion();
