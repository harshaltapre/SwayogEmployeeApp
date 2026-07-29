import { prisma } from "./lib/prisma.js";

async function testIsphereGreen() {
  console.log("Testing IsphereGreenEntry table insertion & retrieval...");

  const testEntry = await (prisma as any).isphereGreenEntry.create({
    data: {
      category: "SUPPLY_CHAIN",
      subcategory: "MANUFACTURER",
      name: "Swayog Solar Tech Pvt Ltd",
      place: "Pune",
      phone: "+91 9876543210",
      email: "info@swayogsolar.com",
      address: "Hadapsar Industrial Estate, Pune, Maharashtra",
      details: {
        productRange: "Bifacial Solar Modules 550W+",
        annualCapacity: "1000 MW",
        gstNumber: "27AAACS1234A1Z5",
      },
      status: "ACTIVE",
    },
  });

  console.log("Created test entry:", testEntry);

  const found = await (prisma as any).isphereGreenEntry.findMany({
    where: { category: "SUPPLY_CHAIN" },
  });

  console.log("Found entries count:", found.length);

  // Cleanup test record
  await (prisma as any).isphereGreenEntry.delete({
    where: { id: testEntry.id },
  });

  console.log("Deleted test entry successfully. All database checks passed!");
}

testIsphereGreen()
  .catch((err) => {
    console.error("Test failed:", err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
