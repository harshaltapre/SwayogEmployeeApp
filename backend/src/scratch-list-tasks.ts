import "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    include: {
      employee: {
        select: {
          fullName: true,
          email: true,
        }
      },
      taskAssignments: {
        include: {
          employee: {
            select: {
              fullName: true,
            }
          }
        }
      }
    }
  });
  console.log("TASKS:");
  console.log(JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
