import { createInternalUserSchema } from "./modules/users/users.schemas.js";

const payloadFromFrontend = {
  fullName: "Test Employee",
  email: "test.employee@example.com",
  loginId: "test.employee@example.com",
  phoneNumber: undefined,
  password: "password123",
  role: "EMPLOYEE",
  jobRole: "Solar Design Engineer",
  zone: "Unassigned",
  monthlySalaryInr: 18000,
  reportingManagerId: null, // Frontend sends null when "none" or empty
};

console.log("Testing frontend payload with Zod schema...");
try {
  const parsed = createInternalUserSchema.parse(payloadFromFrontend);
  console.log("Parsed successfully:", parsed);
} catch (err: any) {
  console.error("Zod Validation Failed!");
  console.error(err.errors || err);
}
