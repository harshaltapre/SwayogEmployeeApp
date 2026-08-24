import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ override: true });

const prisma = new PrismaClient();

// Helper to convert array of flat objects to CSV format
function arrayToCsv(data: any[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(","));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      let escaped = "";
      if (val === null || val === undefined) {
        escaped = "";
      } else if (val instanceof Date) {
        escaped = val.toISOString();
      } else if (typeof val === "object") {
        escaped = JSON.stringify(val).replace(/"/g, '""');
      } else {
        escaped = String(val).replace(/"/g, '""');
      }
      // Wrap in double quotes and escape existing quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

async function main() {
  console.log("Starting data export...");
  
  // Resolve export directories
  const localExportDir = path.resolve("./exports");
  const extraExportDirArg = process.argv[2];
  
  if (!fs.existsSync(localExportDir)) {
    fs.mkdirSync(localExportDir, { recursive: true });
  }
  
  console.log(`Local export directory: ${localExportDir}`);
  if (extraExportDirArg) {
    console.log(`Extra export directory: ${path.resolve(extraExportDirArg)}`);
    if (!fs.existsSync(extraExportDirArg)) {
      fs.mkdirSync(extraExportDirArg, { recursive: true });
    }
  }

  // 1. Users
  console.log("Fetching Users...");
  const users = await prisma.user.findMany();
  const usersMapped = users.map(u => ({
    id: u.id,
    loginId: u.loginId,
    employeeCode: u.employeeCode || "",
    email: u.email,
    phoneNumber: u.phoneNumber || "",
    fullName: u.fullName,
    role: u.role,
    designationTitle: u.designationTitle || "",
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));

  // 2. Employees (Employee Profile)
  console.log("Fetching Employee Profiles...");
  const employees = await prisma.employeeProfile.findMany({
    include: { user: true }
  });
  const employeesMapped = employees.map(emp => ({
    id: emp.id,
    userId: emp.userId,
    name: emp.user?.fullName || "",
    email: emp.user?.email || "",
    phone: emp.user?.phoneNumber || "",
    loginId: emp.user?.loginId || "",
    jobRole: emp.jobRole,
    zone: emp.zone || "Unassigned",
    monthlySalaryInr: emp.monthlySalaryInr || 0,
    isActive: emp.isActive,
    createdAt: emp.createdAt
  }));

  // 3. Customers
  console.log("Fetching Customers...");
  const customers = await prisma.customer.findMany();
  const customersMapped = customers.map(c => ({
    id: c.id,
    customerCode: c.customerCode,
    fullName: c.fullName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    city: c.city,
    state: c.state || "",
    address: c.address,
    systemSizeKw: c.systemSizeKw,
    installationDate: c.installationDate,
    warrantyExpiry: c.warrantyExpiry || "",
    amcStatus: c.amcStatus,
    amcExpiryDate: c.amcExpiryDate || "",
    status: c.status,
    partnerId: c.partnerId || "",
    assignedEmployeeId: c.assignedEmployeeId || "",
    createdAt: c.createdAt
  }));

  // 4. Tasks
  console.log("Fetching Tasks...");
  const tasks = await prisma.task.findMany();
  const tasksMapped = tasks.map(t => ({
    id: t.id,
    jobType: t.jobType,
    description: t.description,
    customerName: t.customerName,
    customerPhone: t.customerPhone,
    address: t.address,
    status: t.status,
    scheduledTime: t.scheduledTime,
    employeeUserId: t.employeeUserId,
    assignedById: t.assignedById,
    completedAt: t.completedAt || "",
    createdAt: t.createdAt
  }));

  // 5. Service Requests (Complaints)
  console.log("Fetching Service Requests...");
  const serviceRequests = await prisma.serviceRequest.findMany({
    include: { customer: true }
  });
  const serviceRequestsMapped = serviceRequests.map(sr => ({
    id: sr.id,
    customerId: sr.customerId,
    customerName: sr.customer?.fullName || "",
    title: sr.title,
    description: sr.description,
    status: sr.status,
    scheduledDate: sr.scheduledDate || "",
    scheduledTime: sr.scheduledTime || "",
    createdAt: sr.createdAt
  }));

  // 6. Invoices
  console.log("Fetching Invoices...");
  const invoices = await prisma.invoice.findMany({
    include: { Customer: true }
  });
  const invoicesMapped = invoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "",
    customerId: inv.customerId,
    customerName: inv.Customer?.fullName || "",
    invoiceType: inv.invoiceType,
    amount: inv.amount,
    paymentStatus: inv.paymentStatus,
    amountPaid: inv.amountPaid,
    invoiceDate: inv.invoiceDate,
    paymentDate: inv.paymentDate || "",
    zone: inv.zone || "",
    createdAt: inv.createdAt
  }));

  // 7. AMC Contracts
  console.log("Fetching AMC Contracts...");
  const amcContracts = await prisma.amcContract.findMany({
    include: { Customer: true }
  });
  const amcContractsMapped = amcContracts.map(c => ({
    id: c.id,
    customerId: c.customerId,
    customerName: c.Customer?.fullName || "",
    state: c.state,
    annualFeeInr: c.annualFeeInr,
    startDate: c.startDate,
    renewalDate: c.renewalDate,
    isActive: c.isActive,
    isRenewed: c.isRenewed,
    createdAt: c.createdAt
  }));

  // 8. AMC Visits
  console.log("Fetching AMC Visits...");
  const amcVisits = await prisma.amcVisit.findMany({
    include: {
      customer: true,
      assignedEmployee: true
    }
  });
  const amcVisitsMapped = amcVisits.map(v => ({
    id: v.id,
    customerId: v.customerId,
    customerName: v.customer?.fullName || "",
    scheduledDate: v.scheduledDate,
    status: v.status,
    completedAt: v.completedAt || "",
    assignedEmployeeId: v.assignedEmployeeId || "",
    assignedEmployeeName: v.assignedEmployee?.fullName || "",
    timeSlot: v.timeSlot || "",
    completedByName: v.completedByName || "",
    createdAt: v.createdAt
  }));

  // 9. Inventory
  console.log("Fetching Inventory...");
  const inventory = await prisma.inventory.findMany();
  const inventoryMapped = inventory.map(i => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    inStock: i.inStock,
    minThreshold: i.minThreshold,
    supplier: i.supplier || "",
    pricePerUnit: i.pricePerUnit,
    createdAt: i.createdAt
  }));

  const datasets = [
    { name: "users", data: usersMapped },
    { name: "employees", data: employeesMapped },
    { name: "customers", data: customersMapped },
    { name: "tasks", data: tasksMapped },
    { name: "service_requests", data: serviceRequestsMapped },
    { name: "invoices", data: invoicesMapped },
    { name: "amc_contracts", data: amcContractsMapped },
    { name: "amc_visits", data: amcVisitsMapped },
    { name: "inventory", data: inventoryMapped }
  ];

  for (const set of datasets) {
    const jsonContent = JSON.stringify(set.data, null, 2);
    const csvContent = arrayToCsv(set.data);
    
    // Write locally
    fs.writeFileSync(path.join(localExportDir, `${set.name}.json`), jsonContent);
    fs.writeFileSync(path.join(localExportDir, `${set.name}.csv`), csvContent);
    console.log(`Exported ${set.name}: ${set.data.length} records to local exports folder`);
    
    // Write extra if argument provided
    if (extraExportDirArg) {
      fs.writeFileSync(path.join(extraExportDirArg, `${set.name}.json`), jsonContent);
      fs.writeFileSync(path.join(extraExportDirArg, `${set.name}.csv`), csvContent);
    }
  }
  
  console.log("Data export completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
