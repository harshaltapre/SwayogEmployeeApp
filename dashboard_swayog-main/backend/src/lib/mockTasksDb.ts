/**
 * Mock Tasks DB
 * Uses in-memory storage (Vercel serverless has a read-only filesystem).
 * In development, optionally persists to disk for convenience.
 */

let mockTasks: any[] = [];

export function getMockTasks() {
  return [...mockTasks];
}

export function saveMockTask(task: any) {
  const index = mockTasks.findIndex((t: any) => t.id === task.id);
  if (index >= 0) {
    mockTasks[index] = task;
  } else {
    mockTasks.push(task);
  }
}

