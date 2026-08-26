import { PrismaClient, UserRole, CustomerAmcStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database push & seed process...");

  // 1. Seed Super Admin
  const saEmail = (process.env.SEED_SUPER_ADMIN_EMAIL || "harshaltapre27@gmail.com").toLowerCase();
  const saPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || "Harshal.27";
  const saName = process.env.SEED_SUPER_ADMIN_NAME || "Harshal Tapre";
  const saPasswordHash = await bcrypt.hash(saPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: saEmail },
    update: {
      fullName: saName,
      passwordHash: saPasswordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: saEmail,
      fullName: saName,
      passwordHash: saPasswordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      loginId: "SADM-001",
    },
  });
  console.log(`✓ Super Admin seeded: ${superAdmin.email}`);

  // 2. Seed Mock Users from mock-users.json
  const mockUsersPath = path.join(process.cwd(), "mock-users.json");
  if (fs.existsSync(mockUsersPath)) {
    try {
      const raw = fs.readFileSync(mockUsersPath, "utf-8");
      const mockUsers = JSON.parse(raw);
      let seededUsers = 0;

      for (const u of mockUsers) {
        if (!u.email) continue;
        const passwordHash = u.passwordHash || (await bcrypt.hash("Password@123", 10));

        const user = await prisma.user.upsert({
          where: { email: u.email.toLowerCase() },
          update: {
            fullName: u.fullName || "User",
            loginId: u.loginId || `LID-${Date.now()}`,
            role: (u.role as UserRole) || UserRole.EMPLOYEE,
            isActive: u.isActive !== false,
          },
          create: {
            email: u.email.toLowerCase(),
            loginId: u.loginId || `LID-${Date.now()}`,
            fullName: u.fullName || "User",
            passwordHash,
            role: (u.role as UserRole) || UserRole.EMPLOYEE,
            isActive: u.isActive !== false,
          },
        });

        // Seed Employee Profile if exists
        if (u.employeeProfile && (user.role === UserRole.EMPLOYEE || user.role === UserRole.SUB_ADMIN)) {
          await prisma.employeeProfile.upsert({
            where: { userId: user.id },
            update: {
              jobRole: u.employeeProfile.jobRole || "Field Specialist",
              zone: u.employeeProfile.zone || "Baner, Pune",
              monthlySalaryInr: u.employeeProfile.monthlySalaryInr || 25000,
            },
            create: {
              userId: user.id,
              jobRole: u.employeeProfile.jobRole || "Field Specialist",
              zone: u.employeeProfile.zone || "Baner, Pune",
              monthlySalaryInr: u.employeeProfile.monthlySalaryInr || 25000,
            },
          });
        }

        // Seed Partner Profile if exists
        if (u.partnerProfile && user.role === UserRole.PARTNER) {
          await prisma.partnerProfile.upsert({
            where: { userId: user.id },
            update: {
              businessName: u.partnerProfile.businessName || "Swayog Partner",
              serviceZone: u.partnerProfile.serviceZone || "Pune Zone",
            },
            create: {
              userId: user.id,
              businessName: u.partnerProfile.businessName || "Swayog Partner",
              serviceZone: u.partnerProfile.serviceZone || "Pune Zone",
            },
          });
        }

        seededUsers++;
      }
      console.log(`✓ Seeded ${seededUsers} users from mock-users.json`);
    } catch (err: any) {
      console.error("Error reading mock-users.json:", err.message);
    }
  }

  // 3. Seed Inventory Items
  const inventoryItems = [
    { sku: "ER-3M", name: "Earthing Rod with Nut Bolts 3m", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EDC-16-GR", name: "Earthing Down Conductor 16 sq mm Green", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EPC-FRP", name: "Earthing Pit Cover FRP", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EBFC-25KG", name: "Earthing Backfill Compound 25 Kg Bag", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "LA-01", name: "Lightning Arrestor", category: "Protection", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "ACC-4-CU", name: "AC Cable 1C x 4 sq mm Cu Flexible", category: "Cables", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "DCC-4-RB", name: "DC Cable 4 sq mm (Red & Black)", category: "Cables", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "SP-2X2", name: "Structure Pipe 2x2", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "SP-1.5X1.5", name: "Structure Pipe 1.5x1.5", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "SP-1X1", name: "Structure Pipe 1x1", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "BP-01", name: "Base Plate", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "AB-01", name: "Anchor Bolts", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "MR-01", name: "Monorail", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "MC-01", name: "Mid Clamp", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EC-01", name: "End Clamp", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "RV-01", name: "Rivet", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "SB-01", name: "Silicon Bottle", category: "Chemicals", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "CP-25", name: "Conduit Pipe 25 mm", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "MC-25-PVC", name: "Mounting Clamps 25 mm PVC", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EL-25", name: "25 mm Elbow", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "T-25", name: "25 mm T", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "EIT-01", name: "Electrical Insulation Tape", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "CT-PKT", name: "Cable Tie Packet", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "FC-1IN", name: "Flexible Conduit – 1 inch", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "JB-SS", name: "J Bolt SS with Single Washer and Nut", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "MC4-PR", name: "MC4 Connector Pair", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "INV-01", name: "Inverter", category: "Electronics", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "DCR-PNL", name: "DCR Panel", category: "Electronics", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "ACDB-01", name: "ACDB", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "DCDB-01", name: "DCDB", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "WPL-SB", name: "Waterproofing Liquid (small bottle)", category: "Chemicals", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "DB-01", name: "Dewalt Bottle", category: "Tools", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
    { sku: "PVCD-01", name: "PVC Duct", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", pricePerUnit: 0 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }
  console.log(`✓ Seeded ${inventoryItems.length} inventory items.`);

  // 4. Seed Mock Customers
  const mockCustomers = [
    {
      customerCode: "CUST-001",
      fullName: "Anil Sharma",
      email: "anil.sharma@example.com",
      phoneNumber: "9876543210",
      city: "Pune",
      address: "Flat 401, Sapphire Heights, Baner, Pune",
      systemSizeKw: 5.0,
      installationDate: new Date("2025-01-15"),
      amcStatus: CustomerAmcStatus.ACTIVE,
      clientType: "post_paid",
      consumerNumber: "CON-1002345",
      monthlyCleaningRate: 1500,
      cleaningsPerMonth: 2,
      cleaningWindow1: "1-10",
      cleaningWindow2: "15-25",
      contractStartDate: new Date("2026-01-01"),
      contractEndDate: new Date("2026-12-31"),
      paymentTerms: "Monthly after cleaning",
      remarks: "Panel cleaning requires a 10ft ladder.",
    },
    {
      customerCode: "CUST-002",
      fullName: "Rajesh Patel",
      email: "rajesh.patel@example.com",
      phoneNumber: "9123456780",
      city: "Mumbai",
      address: "B-12, Green Glen Layout, Andheri East, Mumbai",
      systemSizeKw: 10.0,
      installationDate: new Date("2024-06-20"),
      amcStatus: CustomerAmcStatus.ACTIVE,
      clientType: "pre_paid",
      consumerNumber: "CON-2004567",
      monthlyCleaningRate: 2500,
      cleaningsPerMonth: 3,
      cleaningWindow1: "1-5",
      cleaningWindow2: "11-15",
      cleaningWindow3: "21-25",
      contractStartDate: new Date("2026-01-01"),
      contractEndDate: new Date("2026-12-31"),
      paymentTerms: "Quarterly in advance",
      remarks: "Safety harness must be used for roof access.",
    },
    {
      customerCode: "CUST-003",
      fullName: "Meera Nair",
      email: "meera.nair@example.com",
      phoneNumber: "9345678901",
      city: "Bangalore",
      address: "42, Sunrise Villa, HSR Layout, Bangalore",
      systemSizeKw: 8.0,
      installationDate: new Date("2024-11-05"),
      amcStatus: CustomerAmcStatus.ACTIVE,
      clientType: "corporate",
      consumerNumber: "CON-3007890",
      monthlyCleaningRate: 3500,
      cleaningsPerMonth: 1,
      cleaningWindow1: "5-15",
      contractStartDate: new Date("2026-03-01"),
      contractEndDate: new Date("2027-02-28"),
      paymentTerms: "Quarterly in advance",
      remarks: "Corporate office client. Clean during weekends only.",
    },
  ];

  for (const customerData of mockCustomers) {
    const existing = await prisma.customer.findUnique({
      where: { customerCode: customerData.customerCode },
    });

    if (!existing) {
      await prisma.customer.create({ data: customerData });
    }
  }
  console.log(`✓ Seeded ${mockCustomers.length} active AMC customers.`);

  console.log("🎉 All data successfully pushed to database!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Push data error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
