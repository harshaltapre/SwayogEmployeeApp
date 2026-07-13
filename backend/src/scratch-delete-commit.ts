import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "achalwankar26@gmail.com";
  console.log(`Finding user: ${email}...`);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error("User not found!");
    return;
  }

  console.log(`User found: ${user.fullName} (${user.id})`);

  console.log("Searching for daily commits...");
  const commits = await prisma.dailyCommit.findMany({
    where: {
      employeeId: user.id,
    },
  });

  console.log(`Found ${commits.length} commits.`);
  for (const commit of commits) {
    console.log(`- Commit Date: ${commit.commitDate.toISOString().slice(0, 10)} | Task: "${commit.taskWorkedOn}" | Summary: "${commit.workSummary}"`);
    if (commit.taskWorkedOn.includes("mkkle") || commit.workSummary.includes("nnjkh")) {
      console.log(`Deleting jargon commit with ID: ${commit.id}`);
      await prisma.dailyCommit.delete({
        where: { id: commit.id },
      });
      console.log("Successfully deleted!");
    }
  }
}

main()
  .catch((err) => {
    console.error("Error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
