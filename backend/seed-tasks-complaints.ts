import { PrismaClient, TaskStatus, ServiceRequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting tasks and complaints seeding...");

  // 1. Get existing customers
  const customers = await prisma.customer.findMany({
    take: 10
  });

  if (customers.length === 0) {
    console.error("No customers found in database. Please run migrations/seed first.");
    return;
  }

  // 2. Find employees and subadmin
  const mohsin = await prisma.user.findFirst({ where: { email: { contains: "mohsinali" } } });
  const sanket = await prisma.user.findFirst({ where: { email: { contains: "sanketchatarkar" } } });
  const arbaz = await prisma.user.findFirst({ where: { email: { contains: "arbazkhan" } } });
  const subadmin = await prisma.user.findFirst({ where: { role: "SUB_ADMIN" } });

  const assignedById = subadmin?.id || "e2ac16b5-74ee-4f4b-a16c-bd670d2709ac";
  const employee1 = mohsin?.id || "4913afb7-b117-4a00-ad39-281ecf9e1f8f";
  const employee2 = sanket?.id || "210328c8-be79-40e6-b022-22721f651ed2";
  const employee3 = arbaz?.id || "26766e11-aaba-4a9c-816f-398127578e10";

  console.log(`Seeding tasks assigned by ${assignedById} to employees: ${employee1}, ${employee2}, ${employee3}`);

  // 3. Clear existing tasks & service requests first if needed
  await prisma.taskAssignee.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.taskImage.deleteMany({});
  await prisma.imageRecord.deleteMany({});
  await prisma.workSubmission.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.serviceRequest.deleteMany({});

  // 4. Seed Tasks
  const taskData = [
    {
      jobType: "Installation",
      description: "Install solar panels and base structure mounting",
      customerName: customers[0].fullName,
      customerPhone: customers[0].phoneNumber,
      address: customers[0].address,
      status: TaskStatus.ASSIGNED,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      employeeUserId: employee1,
      assignedById: assignedById,
    },
    {
      jobType: "Service",
      description: "Clean solar inverter ventilation filters and test voltage output",
      customerName: customers[1].fullName,
      customerPhone: customers[1].phoneNumber,
      address: customers[1].address,
      status: TaskStatus.IN_PROGRESS,
      scheduledTime: new Date(), // today
      employeeUserId: employee2,
      assignedById: assignedById,
    },
    {
      jobType: "Survey",
      description: "Conduct roof structural integrity assessment and shade analysis",
      customerName: customers[2].fullName,
      customerPhone: customers[2].phoneNumber,
      address: customers[2].address,
      status: TaskStatus.ASSIGNED,
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      employeeUserId: employee3,
      assignedById: assignedById,
    },
    {
      jobType: "AMC Visit",
      description: "Scheduled bi-monthly cleaning and wiring check",
      customerName: customers[3 % customers.length].fullName,
      customerPhone: customers[3 % customers.length].phoneNumber,
      address: customers[3 % customers.length].address,
      status: TaskStatus.COMPLETED,
      scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      employeeUserId: employee1,
      assignedById: assignedById,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completionMessage: "Successfully completed routine AMC cleaning. All systems functional.",
    },
    {
      jobType: "Complaint",
      description: "Fix inverter underperformance and check DC cabling fuse",
      customerName: customers[4 % customers.length].fullName,
      customerPhone: customers[4 % customers.length].phoneNumber,
      address: customers[4 % customers.length].address,
      status: TaskStatus.IN_PROGRESS,
      scheduledTime: new Date(),
      employeeUserId: employee2,
      assignedById: assignedById,
    }
  ];

  for (const t of taskData) {
    const createdTask = await prisma.task.create({ data: t });
    // Add default assignee link
    await prisma.taskAssignee.create({
      data: {
        taskId: createdTask.id,
        userId: t.employeeUserId,
        status: t.status.toLowerCase()
      }
    });
  }

  // 5. Seed ServiceRequests (Complaints)
  const complaintData = [
    {
      customerId: customers[0].id,
      title: "Inverter Offline",
      description: "Inverter device sn is offline since morning, no generation logged.",
      status: ServiceRequestStatus.PENDING,
      address: customers[0].address,
    },
    {
      customerId: customers[1].id,
      title: "Panel Cleaning Required",
      description: "Lots of dust gathered on solar panels. Generation dropped by 20%.",
      status: ServiceRequestStatus.SCHEDULED,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scheduledTime: "11:00 AM",
      address: customers[1].address,
    },
    {
      customerId: customers[2].id,
      title: "Fluctuating Voltage",
      description: "ACDB reading shows irregular voltage inputs. Grid sync failures.",
      status: ServiceRequestStatus.PENDING,
      address: customers[2].address,
    },
    {
      customerId: customers[3 % customers.length].id,
      title: "Cable Loose Connection",
      description: "Visual wire sagging near base plate, safety check needed.",
      status: ServiceRequestStatus.COMPLETED,
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scheduledTime: "03:30 PM",
      address: customers[3 % customers.length].address,
    }
  ];

  for (const c of complaintData) {
    await prisma.serviceRequest.create({ data: c });
  }

  console.log("Seeding complete! Seeded 5 Tasks and 4 ServiceRequests (Complaints).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
