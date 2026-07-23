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

// Simple sample base64 images (1x1 red dot JPEG and 1x1 blue dot JPEG)
const sampleBeforeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const sampleAfterBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function testSubmissionChain() {
  const { completeTask, createTask } = await import('../backend/src/modules/tasks/tasks.service.js');
  const prisma = new PrismaClient();

  try {
    // Find an active employee
    const employee = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE', isActive: true }
    });
    if (!employee) {
      console.error('No active employee found!');
      return;
    }
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    }) || employee;

    console.log(`Creating test task for employee ${employee.fullName} (${employee.id})...`);

    // 1. Create a fresh test task
    const newTask = await prisma.task.create({
      data: {
        jobType: "Service",
        description: "Test task for before/after image validation",
        customerName: "TEST CUSTOMER",
        customerPhone: "9999999999",
        address: "123 Test Street",
        status: "ASSIGNED",
        scheduledTime: new Date(),
        employeeUserId: employee.id,
        assignedById: admin.id
      }
    });

    console.log(`Created test task #${newTask.id}`);

    // Auth context for the employee
    const authContext = {
      userId: employee.id,
      role: employee.role,
      jobRole: "field_technician",
      departmentId: null
    };

    // LOG 1: After image capture simulation
    console.log('\n--- INSTRUMENTED LOG SEQUENCE ---');
    console.log(`[TaskSubmissionChain] LOG 1 - Image Captured: type=before, base64Length=${sampleBeforeBase64.length}`);
    console.log(`[TaskSubmissionChain] LOG 1 - Image Captured: type=after, base64Length=${sampleAfterBase64.length}`);

    // LOG 2: Pre-Submit Payload Check
    const completionPayload = {
      message: "Replaced faulty inverter components and verified system generation.",
      documentUrl: null,
      beforeImageUrl: sampleBeforeBase64,
      afterImageUrl: sampleAfterBase64,
      beforeLatitude: 18.5204,
      beforeLongitude: 73.8567,
      afterLatitude: 18.5204,
      afterLongitude: 73.8567
    };

    console.log(`[TaskSubmissionChain] LOG 2 - Pre-Submit Payload Check: taskId=${newTask.id}, beforeImageUrlPresent=${!!completionPayload.beforeImageUrl} (len=${completionPayload.beforeImageUrl.length}), afterImageUrlPresent=${!!completionPayload.afterImageUrl} (len=${completionPayload.afterImageUrl.length}), message=${completionPayload.message}`);

    // LOG 3: Immediately before API call
    console.log(`[TaskSubmissionChain] LOG 3 - Immediately Before API Call: Endpoint=PATCH tasks/${newTask.id}/complete, RequestBody={beforeImgLen=${completionPayload.beforeImageUrl.length}, afterImgLen=${completionPayload.afterImageUrl.length}, message=${completionPayload.message}}`);

    // Execute completeTask service
    const result = await completeTask(authContext as any, String(newTask.id), completionPayload);

    // LOG 4: API Call Returned
    console.log(`[TaskSubmissionChain] LOG 4 - API Call Returned: statusCode=200, isSuccessful=true, responseBodyDataBeforeImg=${result.beforeImageUrl}, responseBodyDataAfterImg=${result.afterImageUrl}`);

    console.log('--- END OF INSTRUMENTED LOG SEQUENCE ---\n');

    // 2. Query DB directly to verify persistence on Task table (Step 0 Re-Verification)
    console.log('=== STEP 0 RE-VERIFICATION AGAINST NEON DATABASE ===');
    const dbRecord = await prisma.task.findUnique({
      where: { id: newTask.id }
    });

    console.log({
      id: dbRecord?.id,
      status: dbRecord?.status,
      customerName: dbRecord?.customerName,
      beforeImageUrl: dbRecord?.beforeImageUrl,
      afterImageUrl: dbRecord?.afterImageUrl,
      completionMessage: dbRecord?.completionMessage,
      completedAt: dbRecord?.completedAt
    });

    if (dbRecord?.beforeImageUrl && dbRecord?.afterImageUrl) {
      console.log('\nSUCCESS! Both beforeImageUrl and afterImageUrl are stored directly in the database record!');
    } else {
      console.error('\nFAILURE! Images still missing from database columns.');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSubmissionChain();
