import "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function inspectDbImageUrls() {
  const tasks = await prisma.task.findMany({
    take: 10,
    orderBy: { id: "desc" },
    select: {
      id: true,
      jobType: true,
      status: true,
      beforeImageUrl: true,
      afterImageUrl: true,
      sitePhotos: true,
    },
  });

  console.log("Recent Tasks Image URLs in DB:");
  console.dir(tasks, { depth: null });

  const amcVisits = await prisma.amcVisit.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      beforeImageUrl: true,
      afterImageUrl: true,
    },
  });

  console.log("\nRecent AMC Visits in DB:");
  console.dir(amcVisits, { depth: null });
}

inspectDbImageUrls().catch(console.error);
