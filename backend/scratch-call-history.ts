import dotenv from "dotenv";
dotenv.config({ override: true });
import { PrismaClient } from "@prisma/client";
import { issueAccessToken } from "./src/lib/token.js";
import axios from "axios";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { loginId: "CUST-1268333" },
    include: { customerProfile: true }
  });
  if (!user) {
    console.log("User not found!");
    return;
  }
  const customerId = user.customerProfile?.id;
  console.log(`User ID: ${user.id}, Customer ID: ${customerId}`);
  
  const token = issueAccessToken({
    sub: user.id,
    role: user.role,
    loginId: user.loginId
  });
  
  console.log("AccessToken issued.");
  
  try {
    const res = await axios.get(`http://localhost:4000/api/v1/subadmin/customers/${customerId}/inverter-generation-history?period=monthly`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("RESPONSE SUCCESS:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error("RESPONSE ERROR:");
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
