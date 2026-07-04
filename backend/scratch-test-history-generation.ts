import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function formatHistoryLabel(date: Date, period: "daily" | "monthly" | "yearly" | "realtime") {
  if (period === "yearly") {
    return date.getFullYear().toString();
  }
  if (period === "monthly") {
    return date.toLocaleString("default", { month: "short", year: "2-digit" });
  }
  if (period === "realtime") {
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  }
  return date.getDate() + " " + date.toLocaleString("default", { month: "short" });
}

function buildInverterGenerationHistory(customer: any, period: "daily" | "monthly" | "yearly") {
  const now = new Date();
  const stepCount = period === "yearly" ? 5 : period === "monthly" ? 12 : 7;
  const seed = `${customer.id}:${customer.inverterBrand}:${customer.inverterLoginId}:${period}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const baseValue = (parseInt(hash.slice(0, 8), 16) % 800) + 300;

  return Array.from({ length: stepCount }, (_, index) => {
    const offset = stepCount - 1 - index;
    const date = new Date(now);
    if (period === "daily") {
      date.setDate(now.getDate() - offset);
    } else if (period === "monthly") {
      date.setMonth(now.getMonth() - offset);
      date.setDate(1);
    } else {
      date.setFullYear(now.getFullYear() - offset);
      date.setMonth(0);
      date.setDate(1);
    }

    const variation = parseInt(hash.slice(8 + (index % 6) * 4, 12 + (index % 6) * 4), 16) % 600;
    const trend = offset * (period === "yearly" ? 40 : period === "monthly" ? 15 : 4);
    const generation = Math.max(1, (baseValue + variation + trend) / (period === "yearly" ? 1.5 : 10));

    return {
      date: date.toISOString().slice(0, 10),
      label: formatHistoryLabel(date, period),
      generation: Number(generation.toFixed(1)),
    };
  });
}

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { customerCode: "CUST-1268333" }
  });
  console.log("Customer: ", customer?.id, customer?.inverterBrand);
  const hist = buildInverterGenerationHistory(customer, "daily");
  console.log("History generated for 'daily':");
  console.log(hist);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
