import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function syncProfiles() {
  console.log('Starting customer profile sync...');
  
  const usersWithoutProfile = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      customerProfile: null
    }
  });

  console.log(`Found ${usersWithoutProfile.length} customers without profiles.`);

  for (const user of usersWithoutProfile) {
    console.log(`Syncing profile for: ${user.email} (${user.fullName})`);
    
    // Generate a code if none exists or use loginId
    const customerCode = user.loginId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      await prisma.customer.create({
        data: {
          userId: user.id,
          customerCode: customerCode,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber || 'Not Provided',
          city: 'Not Provided',
          address: 'Not Provided',
          systemSizeKw: 0,
          installationDate: new Date(),
          status: 'ACTIVE',
          amcStatus: 'NONE',
        }
      });
      console.log(`✓ Profile created for ${user.email}`);
    } catch (err) {
      console.error(`✕ Failed to create profile for ${user.email}:`, err.message);
    }
  }

  console.log('Sync complete.');
  process.exit(0);
}

syncProfiles();
