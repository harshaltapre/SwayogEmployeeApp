import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "harshaltapre26@gmail.com" }
  });
  if (!user) {
    console.log("User harshaltapre26@gmail.com not found!");
    return;
  }
  
  console.log(`User: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Hash: ${user.passwordHash}`);
  console.log(`PortalPassword: ${user.portalPassword}`);
  
  const passwordsToTest = ["Harshal.26", "Harshal.27", "Password@123", "12345678", "swayog", "swayog123", " Nishank.08", "nishankzade", "Nishank.08"];
  for (const pass of passwordsToTest) {
    const isMatch = await verifyPassword(pass, user.passwordHash);
    console.log(`Password "${pass}" matches? ${isMatch}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
