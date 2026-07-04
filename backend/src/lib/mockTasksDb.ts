import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "mock-tasks.json");

export function getMockTasks() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading mock tasks DB:", error);
    return [];
  }
}

export function saveMockTask(task: any) {
  const tasks = getMockTasks();
  const index = tasks.findIndex((t: any) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error("Error writing to mock tasks DB:", error);
  }
}
