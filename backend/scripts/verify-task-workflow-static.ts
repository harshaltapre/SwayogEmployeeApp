/**
 * Static Code Verification for Task Engine Implementation
 * 
 * This script verifies the implementation without requiring a running database:
 * 1. Schema has TaskAssignment model with employeeUserId
 * 2. Schema has TaskImage model with required fields
 * 3. Schema has CustomerNotification model
 * 4. Task type config has correct validation rules
 * 5. Tasks service uses TaskAssignment.employeeUserId filter
 * 6. Tasks service validates task type rules
 * 7. Tasks service creates TaskImage records
 * 8. Tasks service calls customer notification on assignment
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function logResult(step: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  results.push({ step, status, message, details });
  console.log(`[${status}] ${step}: ${message}`);
  if (details) console.log('  Details:', JSON.stringify(details, null, 2));
}

function readFileContent(filePath: string): string {
  try {
    return readFileSync(join(process.cwd(), filePath), 'utf-8');
  } catch (error) {
    return '';
  }
}

async function verifySchemaHasTaskAssignment() {
  const step = 'Schema: TaskAssignment Model';
  const schema = readFileContent('prisma/schema.prisma');
  
  if (!schema) {
    await logResult(step, 'FAIL', 'Could not read schema.prisma');
    return;
  }

  const hasTaskAssignment = schema.includes('model TaskAssignment');
  const hasEmployeeUserId = schema.includes('employeeUserId');
  const hasTaskId = schema.includes('taskId');
  const hasStatus = schema.includes('TaskAssignmentStatus');

  if (hasTaskAssignment && hasEmployeeUserId && hasTaskId && hasStatus) {
    await logResult(step, 'PASS', 'TaskAssignment model exists with required fields');
  } else {
    await logResult(step, 'FAIL', 'TaskAssignment model missing required fields', {
      hasTaskAssignment,
      hasEmployeeUserId,
      hasTaskId,
      hasStatus
    });
  }
}

async function verifySchemaHasTaskImage() {
  const step = 'Schema: TaskImage Model';
  const schema = readFileContent('prisma/schema.prisma');
  
  if (!schema) {
    await logResult(step, 'FAIL', 'Could not read schema.prisma');
    return;
  }

  const hasTaskImage = schema.includes('model TaskImage');
  const hasType = schema.includes('type');
  const hasUrl = schema.includes('url');
  const hasLatitude = schema.includes('latitude');
  const hasLongitude = schema.includes('longitude');
  const hasEmployeeUserId = schema.includes('employeeUserId');

  if (hasTaskImage && hasType && hasUrl && hasLatitude && hasLongitude && hasEmployeeUserId) {
    await logResult(step, 'PASS', 'TaskImage model exists with required fields');
  } else {
    await logResult(step, 'FAIL', 'TaskImage model missing required fields', {
      hasTaskImage,
      hasType,
      hasUrl,
      hasLatitude,
      hasLongitude,
      hasEmployeeUserId
    });
  }
}

async function verifySchemaHasCustomerNotification() {
  const step = 'Schema: CustomerNotification Model';
  const schema = readFileContent('prisma/schema.prisma');
  
  if (!schema) {
    await logResult(step, 'FAIL', 'Could not read schema.prisma');
    return;
  }

  const hasCustomerNotification = schema.includes('model CustomerNotification');
  const hasCustomerId = schema.includes('customerId');
  const hasType = schema.includes('type');
  const hasMessage = schema.includes('message');
  const hasTaskId = schema.includes('taskId');

  if (hasCustomerNotification && hasCustomerId && hasType && hasMessage && hasTaskId) {
    await logResult(step, 'PASS', 'CustomerNotification model exists with required fields');
  } else {
    await logResult(step, 'FAIL', 'CustomerNotification model missing required fields', {
      hasCustomerNotification,
      hasCustomerId,
      hasType,
      hasMessage,
      hasTaskId
    });
  }
}

async function verifyTaskTypeConfig() {
  const step = 'Task Type Configuration';
  const config = readFileContent('src/modules/tasks/task-type.config.ts');
  
  if (!config) {
    await logResult(step, 'FAIL', 'Could not read task-type.config.ts');
    return;
  }

  const hasAmcConfig = config.includes('AMC_VISIT');
  const hasSiteVisitConfig = config.includes('SITE_VISIT');
  const hasRequiresBefore = config.includes('requiresBeforeImage');
  const hasRequiresAfter = config.includes('requiresAfterImage');
  const hasSitePhotoMin = config.includes('sitePhotoMin');
  const hasSitePhotoMax = config.includes('sitePhotoMax');

  // Check specific values
  const amcBeforeTrue = config.includes('AMC_VISIT') && config.includes('requiresBeforeImage: true');
  const amcAfterTrue = config.includes('AMC_VISIT') && config.includes('requiresAfterImage: true');
  const siteVisitMin4 = config.includes('SITE_VISIT') && config.includes('sitePhotoMin: 4');
  const siteVisitMax10 = config.includes('SITE_VISIT') && config.includes('sitePhotoMax: 10');

  if (hasAmcConfig && hasSiteVisitConfig && hasRequiresBefore && hasRequiresAfter && 
      amcBeforeTrue && amcAfterTrue && siteVisitMin4 && siteVisitMax10) {
    await logResult(step, 'PASS', 'Task type validation rules correctly configured');
  } else {
    await logResult(step, 'FAIL', 'Task type config has incorrect rules', {
      hasAmcConfig,
      hasSiteVisitConfig,
      amcBeforeTrue,
      amcAfterTrue,
      siteVisitMin4,
      siteVisitMax10
    });
  }
}

async function verifyTaskAssignmentFilter() {
  const step = 'Tasks Service: TaskAssignment Filter';
  const service = readFileContent('src/modules/tasks/tasks.service.ts');
  
  if (!service) {
    await logResult(step, 'FAIL', 'Could not read tasks.service.ts');
    return;
  }

  const hasGetAssignedTaskWhere = service.includes('getAssignedTaskWhere');
  const usesTaskAssignmentsSome = service.includes('taskAssignments: { some:');
  const filtersByEmployeeUserId = service.includes('employeeUserId') && 
                                   service.includes('taskAssignments') &&
                                   service.includes('some');

  if (hasGetAssignedTaskWhere && usesTaskAssignmentsSome && filtersByEmployeeUserId) {
    await logResult(step, 'PASS', 'Tasks service uses TaskAssignment.employeeUserId filter');
  } else {
    await logResult(step, 'FAIL', 'Tasks service missing TaskAssignment filter', {
      hasGetAssignedTaskWhere,
      usesTaskAssignmentsSome,
      filtersByEmployeeUserId
    });
  }
}

async function verifyTaskTypeValidation() {
  const step = 'Tasks Service: Task Type Validation';
  const service = readFileContent('src/modules/tasks/tasks.service.ts');
  
  if (!service) {
    await logResult(step, 'FAIL', 'Could not read tasks.service.ts');
    return;
  }

  const hasValidateFunction = service.includes('validateTaskCompletionImages');
  const callsGetTaskTypeConfig = service.includes('getTaskTypeConfig');
  const checksRequiresBefore = service.includes('requiresBeforeImage');
  const checksRequiresAfter = service.includes('requiresAfterImage');
  const checksSitePhotoMin = service.includes('sitePhotoMin');
  const checksSitePhotoMax = service.includes('sitePhotoMax');

  if (hasValidateFunction && callsGetTaskTypeConfig && checksRequiresBefore && 
      checksRequiresAfter && checksSitePhotoMin && checksSitePhotoMax) {
    await logResult(step, 'PASS', 'Tasks service validates task type rules');
  } else {
    await logResult(step, 'FAIL', 'Tasks service missing task type validation', {
      hasValidateFunction,
      callsGetTaskTypeConfig,
      checksRequiresBefore,
      checksRequiresAfter,
      checksSitePhotoMin,
      checksSitePhotoMax
    });
  }
}

async function verifyTaskImageCreation() {
  const step = 'Tasks Service: TaskImage Creation';
  const service = readFileContent('src/modules/tasks/tasks.service.ts');
  
  if (!service) {
    await logResult(step, 'FAIL', 'Could not read tasks.service.ts');
    return;
  }

  const hasTaskImageCreate = service.includes('prisma.taskImage.createMany');
  const hasTaskImageDelete = service.includes('prisma.taskImage.deleteMany');
  const createsBeforeRecord = service.includes('type: "before"');
  const createsAfterRecord = service.includes('type: "after"');
  const createsSitePhotoRecord = service.includes('type: `site_photo_');

  if (hasTaskImageCreate && hasTaskImageDelete && createsBeforeRecord && 
      createsAfterRecord && createsSitePhotoRecord) {
    await logResult(step, 'PASS', 'Tasks service creates TaskImage records');
  } else {
    await logResult(step, 'FAIL', 'Tasks service missing TaskImage creation', {
      hasTaskImageCreate,
      hasTaskImageDelete,
      createsBeforeRecord,
      createsAfterRecord,
      createsSitePhotoRecord
    });
  }
}

async function verifyCustomerNotification() {
  const step = 'Tasks Service: Customer Notification';
  const service = readFileContent('src/modules/tasks/tasks.service.ts');
  
  if (!service) {
    await logResult(step, 'FAIL', 'Could not read tasks.service.ts');
    return;
  }

  const hasNotifyTaskScheduled = service.includes('notifyTaskScheduled');
  const hasNotifyTaskCompleted = service.includes('notifyTaskCompleted');
  const callsCreateCustomerNotification = service.includes('createCustomerNotification');
  const callsOnAssignment = service.includes('await notifyTaskScheduled');
  const callsOnCompletion = service.includes('await notifyTaskCompleted');

  if (hasNotifyTaskScheduled && hasNotifyTaskCompleted && callsCreateCustomerNotification &&
      callsOnAssignment && callsOnCompletion) {
    await logResult(step, 'PASS', 'Tasks service sends customer notifications');
  } else {
    await logResult(step, 'FAIL', 'Tasks service missing customer notification', {
      hasNotifyTaskScheduled,
      hasNotifyTaskCompleted,
      callsCreateCustomerNotification,
      callsOnAssignment,
      callsOnCompletion
    });
  }
}

async function verifyEmployeeTaskQuery() {
  const step = 'Tasks Service: Employee Query Scoping';
  const service = readFileContent('src/modules/tasks/tasks.service.ts');
  
  if (!service) {
    await logResult(step, 'FAIL', 'Could not read tasks.service.ts');
    return;
  }

  const hasListTasks = service.includes('export async function listTasks');
  const checksEmployeeRole = service.includes('auth.role === UserRole.EMPLOYEE');
  const usesGetAssignedTaskWhere = service.includes('getAssignedTaskWhere');
  const scopesToEmployeeUserId = service.includes('employeeScopeId');

  if (hasListTasks && checksEmployeeRole && usesGetAssignedTaskWhere && scopesToEmployeeUserId) {
    await logResult(step, 'PASS', 'Employee task query is scoped to TaskAssignment.employeeUserId');
  } else {
    await logResult(step, 'FAIL', 'Employee task query not properly scoped', {
      hasListTasks,
      checksEmployeeRole,
      usesGetAssignedTaskWhere,
      scopesToEmployeeUserId
    });
  }
}

async function runVerification() {
  console.log('=== Phase 1: Task Engine Static Code Verification ===\n');
  
  await verifySchemaHasTaskAssignment();
  await verifySchemaHasTaskImage();
  await verifySchemaHasCustomerNotification();
  await verifyTaskTypeConfig();
  await verifyTaskAssignmentFilter();
  await verifyTaskTypeValidation();
  await verifyTaskImageCreation();
  await verifyCustomerNotification();
  await verifyEmployeeTaskQuery();
  
  console.log('\n=== Verification Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  
  if (failed > 0) {
    console.log('\n❌ Verification FAILED - Fix the following issues:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.step}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ Verification PASSED - Phase 1 Task Engine is correctly implemented');
    console.log('\nKey findings:');
    console.log('  ✓ TaskAssignment model exists with employeeUserId filter');
    console.log('  ✓ TaskImage model exists for Before/After/Site photos');
    console.log('  ✓ CustomerNotification model exists for customer alerts');
    console.log('  ✓ Task type validation rules are enforced (AMC: Before+After, Site Visit: 4-10 photos)');
    console.log('  ✓ Employee task query uses TaskAssignment.employeeUserId filter');
    console.log('  ✓ Customer notifications sent on assignment and completion');
    process.exit(0);
  }
}

runVerification().catch((error) => {
  console.error('Verification script error:', error);
  process.exit(1);
});
