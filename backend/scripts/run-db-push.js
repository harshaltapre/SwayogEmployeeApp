import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });

try {
  console.log("Running prisma db push with DATABASE_URL =", process.env.DATABASE_URL);
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env }
  });
} catch (e) {
  console.error("Prisma db push failed");
}
