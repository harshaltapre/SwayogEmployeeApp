import assert from "node:assert/strict";
import test from "node:test";

import {
  checkInEmployee,
  checkOutEmployee,
  calculateWorkMinutes,
  finalizeMissingLogouts,
  getAutoLogoutAt,
  getBusinessDate,
  formatBusinessTime,
  listEmployeeAttendance,
} from "./attendance.service.js";
import { ensurePrismaInitialized } from "../../lib/prisma.js";

test("calculates work time from check-in, checkout, and breaks", () => {
  assert.equal(
    calculateWorkMinutes(new Date("2026-10-15T04:30:00.000Z"), new Date("2026-10-15T13:30:00.000Z")),
    540,
  );
  assert.equal(
    calculateWorkMinutes(new Date("2026-10-15T05:00:00.000Z"), new Date("2026-10-15T12:30:00.000Z"), 30),
    420,
  );
});

test("uses the Asia/Kolkata business date and 19:00 cutoff", () => {
  const beforeCutoff = new Date("2026-10-15T13:29:59.000Z");
  const atCutoff = new Date("2026-10-15T13:30:00.000Z");
  assert.equal(getBusinessDate(beforeCutoff), "2026-10-15");
  assert.equal(formatBusinessTime(getAutoLogoutAt("2026-10-15")), "19:00");
  assert.equal(getBusinessDate(atCutoff), "2026-10-15");
});

test("preserves actual checkout time instead of replacing it with the cutoff", () => {
  const actualCheckout = new Date("2026-10-15T12:30:00.000Z");
  assert.equal(formatBusinessTime(actualCheckout), "18:00");
  assert.notEqual(actualCheckout.getTime(), getAutoLogoutAt("2026-10-15").getTime());
});

test("finalizes missing logout once and leaves manually logged-out records unchanged", async () => {
  await ensurePrismaInitialized();
  const missingLogoutEmployee = `test-missing-${Date.now()}`;
  const manualLogoutEmployee = `test-manual-${Date.now()}`;
  const checkInAt = new Date("2026-10-15T04:30:00.000Z");
  const manualCheckoutAt = new Date("2026-10-15T12:30:00.000Z");
  const cutoffTime = new Date("2026-10-15T13:30:00.000Z");

  await checkInEmployee(missingLogoutEmployee, {}, checkInAt);
  const firstRun = await finalizeMissingLogouts(cutoffTime);
  const secondRun = await finalizeMissingLogouts(cutoffTime);
  const finalized = (await listEmployeeAttendance(missingLogoutEmployee))[0];

  assert.equal(firstRun, 1);
  assert.equal(secondRun, 0);
  assert.equal(formatBusinessTime(finalized.checkOutAt), "19:00");
  assert.equal(finalized.workMinutes, 540);

  await checkInEmployee(manualLogoutEmployee, {}, checkInAt);
  await checkOutEmployee(manualLogoutEmployee, 0, [], manualCheckoutAt);
  assert.equal(await finalizeMissingLogouts(cutoffTime), 0);
  const manuallyClosed = (await listEmployeeAttendance(manualLogoutEmployee))[0];
  assert.equal(formatBusinessTime(manuallyClosed.checkOutAt), "18:00");
});
