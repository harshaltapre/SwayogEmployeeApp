import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || "harshaltapre27@gmail.com").toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "Harshal.27";
  const name = process.env.SEED_SUPER_ADMIN_NAME || "Harshal Tapre";

  console.log(`[SEED] Upserting Super Admin: ${email}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email,
      fullName: name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      loginId: "SA-001", // Default login ID for super admin if needed
    },
  });

  console.log(`[SEED] Success! Super Admin created/updated with ID: ${user.id}`);

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
  console.log(`[SEED] Seeded ${inventoryItems.length} inventory items.`);

  // Seed Mock Customers with Active AMC Status
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
      amcStatus: "ACTIVE" as const,
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
      amcStatus: "ACTIVE" as const,
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
      amcStatus: "ACTIVE" as const,
      clientType: "corporate",
      consumerNumber: "CON-3007890",
      monthlyCleaningRate: 3500,
      cleaningsPerMonth: 1,
      cleaningWindow1: "5-15",
      contractStartDate: new Date("2026-03-01"),
      contractEndDate: new Date("2027-02-28"),
      paymentTerms: "Quarterly in advance",
      remarks: "Corporate office client. Clean during weekends only.",
    }
  ];

  console.log("[SEED] Seeding mock active AMC customers...");
  for (const customerData of mockCustomers) {
    const existing = await prisma.customer.findUnique({
      where: { customerCode: customerData.customerCode }
    });

    if (!existing) {
      const createdCustomer = await prisma.customer.create({
        data: customerData,
      });

      // Generate default AMC visits for this customer
      const startDate = customerData.contractStartDate;
      const endDate = customerData.contractEndDate;
      const cleaningsCount = customerData.cleaningsPerMonth;
      const windows = [customerData.cleaningWindow1, customerData.cleaningWindow2, customerData.cleaningWindow3].filter(Boolean);

      const visitsList = [];
      let currentMonth = new Date(startDate);
      currentMonth.setDate(1);

      while (currentMonth <= endDate) {
        for (let i = 0; i < cleaningsCount; i++) {
          const window = windows[i] || "1-28";
          const [startDayRaw] = window.split("-").map(Number);
          const day = isNaN(startDayRaw) ? 10 : startDayRaw;
          const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 10, 0, 0);

          if (scheduledDate >= startDate && scheduledDate <= endDate) {
            visitsList.push({
              customerId: createdCustomer.id,
              scheduledDate,
              status: "PENDING",
            });
          }
        }
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      if (visitsList.length > 0) {
        await prisma.amcVisit.createMany({
          data: visitsList,
        });
      }
    }
  }
  console.log(`[SEED] Seeded mock AMC active customers and their visits.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[SEED] Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
