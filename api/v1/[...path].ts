/**
 * Vercel serverless entry: forwards /api/v1/* to the Express app (same routes as local backend).
 * Build must compile backend to backend/dist before deploy (see npm run vercel-build).
 */
import serverless from "serverless-http";

// @ts-ignore
import appModule from "../../backend/dist/vercel-app.cjs";

const app = appModule.app || appModule.default?.app || appModule.default || appModule;

export default serverless(app);
