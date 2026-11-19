const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALL_STAGES = [
  "CUSTOMER_REGISTRATION",
  "DOCUMENT_COLLECTION",
  "PORTAL_APPLICATION_SUBMISSION",
  "TECHNICAL_FEASIBILITY_APPROVAL",
  "SOLAR_INSTALLATION",
  "NET_METERING_APPLICATION",
  "DISCOM_INSPECTION",
  "NET_METER_INSTALLATION",
  "COMMISSIONING_CERTIFICATE",
  "SUBSIDY_APPLICATION",
  "SUBSIDY_CREDITED",
];

async function syncCustomers() {
  console.log("Checking converted marketing leads without liaisoning application...");
  
  const convertedLeads = await prisma.marketingLead.findMany({
    where: { status: { equals: "Converted", mode: "insensitive" } },
    select: { phone: true, email: true },
  });

  const phones = convertedLeads.map((l) => l.phone).filter(Boolean);
  const emails = convertedLeads.map((l) => l.email).filter(Boolean);

  if (phones.length === 0 && emails.length === 0) {
    console.log("No converted marketing leads found.");
    await prisma.$disconnect();
    return;
  }

  const customers = await prisma.customer.findMany({
    where: {
      liaisoningApplication: null,
      OR: [
        ...(phones.length > 0 ? [{ phoneNumber: { in: phones } }] : []),
        ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
      ],
    },
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      city: true,
      solarSystemInstalled: true,
      documentsCollected: true,
      consumerNumber: true,
      createdAt: true,
    },
  });

  console.log(`Found ${customers.length} customers without liaisoning applications.`);

  if (customers.length === 0) {
    console.log("All customers already have liaisoning applications.");
    await prisma.$disconnect();
    return;
  }

  const BATCH_SIZE = 25;
  let totalCreated = 0;

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const chunk = customers.slice(i, i + BATCH_SIZE);
    
    await Promise.all(chunk.map(async (customer) => {
      const isInstalled = Boolean(customer.solarSystemInstalled);
      const docsCollected = Boolean(customer.documentsCollected);
      
      const discomName = 
        customer.city?.toLowerCase().includes("gujarat") || 
        customer.city?.toLowerCase().includes("ahmedabad") || 
        customer.city?.toLowerCase().includes("surat") 
          ? "Torrent Power" 
          : "MSEDCL";

      const stagesData = ALL_STAGES.map((stage) => {
        let status = "NOT_STARTED";
        let completedAt = null;

        if (stage === "CUSTOMER_REGISTRATION") {
          status = "COMPLETED";
          completedAt = customer.createdAt || new Date();
        } else if (stage === "DOCUMENT_COLLECTION") {
          status = docsCollected ? "COMPLETED" : "PENDING";
          if (docsCollected) completedAt = customer.createdAt || new Date();
        } else if (stage === "PORTAL_APPLICATION_SUBMISSION") {
          status = isInstalled ? "COMPLETED" : "NOT_STARTED";
          if (isInstalled) completedAt = customer.createdAt || new Date();
        } else if (stage === "TECHNICAL_FEASIBILITY_APPROVAL") {
          status = isInstalled ? "APPROVED" : "NOT_STARTED";
          if (isInstalled) completedAt = customer.createdAt || new Date();
        } else if (stage === "SOLAR_INSTALLATION") {
          status = isInstalled ? "COMPLETED" : "NOT_STARTED";
          if (isInstalled) completedAt = customer.createdAt || new Date();
        } else if (stage === "NET_METERING_APPLICATION") {
          status = isInstalled ? "PENDING" : "NOT_STARTED";
        }

        return {
          stage,
          status,
          completedAt,
        };
      });

      const completionPercentage = isInstalled ? 45 : (docsCollected ? 18 : 9);
      const currentStage = isInstalled 
        ? "NET_METERING_APPLICATION" 
        : (docsCollected ? "PORTAL_APPLICATION_SUBMISSION" : "DOCUMENT_COLLECTION");

      try {
        await prisma.liaisoningApplication.create({
          data: {
            customerId: customer.id,
            applicationNumber: `SWY-LIA-${String(customer.id).padStart(4, '0')}`,
            discomName,
            overallStatus: isInstalled ? "IN_PROGRESS" : "PENDING",
            currentStage,
            completionPercentage,
            startedAt: customer.createdAt || new Date(),
            stages: {
              create: stagesData,
            },
          },
        });
        totalCreated++;
      } catch (err) {
        // Skip if already created concurrently
      }
    }));

    console.log(`Processed ${Math.min(i + BATCH_SIZE, customers.length)}/${customers.length}...`);
  }

  console.log(`Successfully created ${totalCreated} liaisoning applications for existing CRM customers!`);
  await prisma.$disconnect();
}

syncCustomers().catch(e => {
  console.error("Sync error:", e);
  process.exit(1);
});
