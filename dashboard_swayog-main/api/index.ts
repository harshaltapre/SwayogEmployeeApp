/**
 * Vercel Serverless Function entry point.
 * Re-exports the Express app so Vercel can handle /api/* requests.
 */
import { app } from "../backend/src/app.js";
import { ensurePrismaInitialized } from "../backend/src/lib/prisma.js";

// Ensure Prisma is initialized before handling requests
let initialized = false;

const handler = async (req: any, res: any) => {
  if (!initialized) {
    await ensurePrismaInitialized();
    initialized = true;
  }
  return app(req, res);
};

export default handler;
