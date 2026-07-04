import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const shouldRun = process.env.RUN_PRODUCTION_DB_SETUP === "true";

if (!shouldRun) {
  process.exit(0);
}

if (process.env.VERCEL !== "1") {
  throw new Error("Refusing to run production DB setup outside Vercel.");
}

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const backendDir = join(rootDir, "backend");
const run = process.platform === "win32" ? "npx.cmd" : "npx";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
};

function exec(args) {
  const result = spawnSync(run, args, {
    cwd: backendDir,
    env,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Running production Prisma migrations...");
if (process.env.PRISMA_RESOLVE_ROLLED_BACK_MIGRATION) {
  console.log(`Resolving failed migration as rolled back: ${process.env.PRISMA_RESOLVE_ROLLED_BACK_MIGRATION}`);
  exec(["prisma", "migrate", "resolve", "--rolled-back", process.env.PRISMA_RESOLVE_ROLLED_BACK_MIGRATION]);
}

exec(["prisma", "migrate", "deploy"]);

console.log("Running production seed...");
exec(["tsx", "src/seed.ts"]);

console.log("Production DB setup completed.");
