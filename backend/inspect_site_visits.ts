import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const completedTasks = await prisma.task.findMany({
    where: {
      status: "COMPLETED"
    },
    include: {
      taskImages: true
    }
  });

  console.log(`Found ${completedTasks.length} completed tasks in DB:`);
  for (const task of completedTasks) {
    console.log(`\nTask ID: ${task.id}, JobType: ${task.jobType}`);
    console.log("Images related to task in taskImage table:");
    console.log(task.taskImages.map(img => ({ id: img.id, type: img.type, url: img.url })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
