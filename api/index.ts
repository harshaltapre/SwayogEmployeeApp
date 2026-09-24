import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import the bundled Express app to catch load-time exceptions
    const appModule = await import("../backend/dist/vercel-app.cjs");
    const app = appModule.app || appModule.default?.app || appModule.default || appModule;

    return new Promise<void>((resolve, reject) => {
      res.on("finish", () => resolve());
      res.on("close", () => resolve());
      res.on("error", (err) => reject(err));

      app(req, res, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (error: any) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({
      error: `Vercel Serverless Function Error: ${error?.message || String(error)}`,
      details: error?.stack || "No stack trace available"
    });
  }
}
