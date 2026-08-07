const fs = require('fs');
const http = require('http');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
  if (!user) return console.log('No employee found');

  const task = await prisma.task.findFirst({ where: { employeeUserId: user.id, status: 'ASSIGNED' } });
  if (!task) return console.log('No assigned task found');

  console.log('Testing on task:', task.id);
  // We can just call completeTask directly from tasks.service.ts
  // but this is compiled typescript so let's hit the DB instead
  const imageRecords = [];
  imageRecords.push({
    taskId: task.id,
    employeeUserId: user.id,
    type: "sitePhoto",
    url: "data:image/jpeg;base64,abc123def456",
    latitude: null,
    longitude: null,
  });
  
  try {
      if (imageRecords.length > 0) {
        for (const image of imageRecords) {
          await prisma.taskImage.deleteMany({
            where: { taskId: task.id, employeeUserId: user.id, type: image.type },
          });
        }
        await prisma.taskImage.createMany({ data: imageRecords });
      }
      console.log('Created many site photos');
      const saved = await prisma.taskImage.findMany({ where: { taskId: task.id } });
      console.log('Saved images:', saved);
  } catch (err) {
      console.error('Error:', err);
  }
  await prisma.$disconnect();
}
run();
