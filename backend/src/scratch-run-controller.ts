/**
 * Scratch test controller for Waaree integration.
 *
 * Customer 116 credentials (set in DB):
 *   inverterLoginId   = Waaree portal username (e.g. "Shubhamtyres" or email)
 *   inverterPassword  = Waaree portal password
 *   inverterBrand     = "Waaree (Waaree)"
 *   inverterDeviceSn  = (optional) specific plant ID
 *
 * Run with:  npx ts-node --esm src/scratch-run-controller.ts
 */
import { getCustomerInverterGeneration } from "./modules/subadmin/subadmin.controller.js";
import type { Request, Response } from "express";

async function run() {
  const req = {
    params: { customerId: "116" },
    query: { period: "realtime" },
    auth: { userId: "b629b208-fca8-4bee-b36a-a2825dae8edc", role: "super_admin" }
  } as unknown as Request;

  const res = {
    status: function(code: number) {
      console.log("Status Code:", code);
      return this;
    },
    json: function(data: any) {
      console.log("Response Data:", JSON.stringify(data, null, 2));
      return this;
    }
  } as unknown as Response;

  console.log("--- Calling getCustomerInverterGeneration for Customer 116 (Waaree) ---");
  try {
    await getCustomerInverterGeneration(req, res);
  } catch (err: any) {
    console.log("Error thrown by controller:", err.statusCode, err.message);
  }
}

run().catch(console.error);
