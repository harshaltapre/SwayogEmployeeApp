/**
 * Run: npx tsx --test src/modules/financials/finance-access.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";

import {
  checkApprovalAuthority,
  financeLevelFromTitle,
  hasFinancePermission,
  resolveFinanceLevel,
} from "./finance-access.js";

const base = { isActive: true, departmentCode: "FINANCE" as string | null };

test("designations map to finance levels", () => {
  assert.equal(financeLevelFromTitle("finance_executive"), "executive");
  assert.equal(financeLevelFromTitle("Accountant"), "executive");
  assert.equal(financeLevelFromTitle("Senior Accountant"), "executive");
  assert.equal(financeLevelFromTitle("Finance Manager"), "manager");
  assert.equal(financeLevelFromTitle("finance-head"), "head");
  assert.equal(financeLevelFromTitle("service_engineer"), null);
  assert.equal(financeLevelFromTitle(undefined), null);
});

test("admin roles get admin level; partners/customers/sub-admins get none", () => {
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.SUPER_ADMIN }), "admin");
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.ADMIN }), "admin");
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.PARTNER, jobRole: "finance_manager" }), null);
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.CUSTOMER, jobRole: "accountant" }), null);
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.SUB_ADMIN, jobRole: "finance_manager" }), null);
});

test("employees resolve by designation; inactive or wrong department get none", () => {
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.EMPLOYEE, jobRole: "finance_executive" }), "executive");
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.EMPLOYEE, designationTitle: "Finance Manager" }), "manager");
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.EMPLOYEE, jobRole: "service_engineer" }), null);
  assert.equal(resolveFinanceLevel({ ...base, isActive: false, role: UserRole.EMPLOYEE, jobRole: "finance_manager" }), null);
  assert.equal(resolveFinanceLevel({ ...base, departmentCode: "SALES", role: UserRole.EMPLOYEE, jobRole: "finance_manager" }), null);
  // No department assigned yet: designation still applies
  assert.equal(resolveFinanceLevel({ ...base, departmentCode: null, role: UserRole.EMPLOYEE, jobRole: "accountant" }), "executive");
  // Department head of Finance is Finance Head
  assert.equal(resolveFinanceLevel({ ...base, role: UserRole.DEPARTMENT_HEAD }), "head");
  // Department head of another department is not
  assert.equal(resolveFinanceLevel({ ...base, departmentCode: "HR", role: UserRole.DEPARTMENT_HEAD }), null);
});

test("permission matrix", () => {
  assert.equal(hasFinancePermission("executive", "finance.invoice.create"), true);
  assert.equal(hasFinancePermission("executive", "finance.invoice.delete"), false);
  assert.equal(hasFinancePermission("executive", "finance.commission.approve"), false);
  assert.equal(hasFinancePermission("executive", "finance.reports.company"), false);
  assert.equal(hasFinancePermission("manager", "finance.commission.approve"), true);
  assert.equal(hasFinancePermission("manager", "finance.reports.company"), true);
  assert.equal(hasFinancePermission("admin", "finance.invoice.delete"), true);
  assert.equal(hasFinancePermission(null, "finance.dashboard.view"), false);
});

test("maker-checker and approval limits", () => {
  const limit = 100_000;
  assert.equal(checkApprovalAuthority({ level: "executive", approverId: "a", amount: 10, managerLimit: limit }).allowed, false);
  assert.equal(checkApprovalAuthority({ level: "manager", approverId: "a", amount: 50_000, managerLimit: limit }).allowed, true);
  assert.equal(checkApprovalAuthority({ level: "manager", approverId: "a", amount: 100_000, managerLimit: limit }).allowed, true);
  assert.equal(checkApprovalAuthority({ level: "manager", approverId: "a", amount: 100_001, managerLimit: limit }).allowed, false);
  assert.equal(checkApprovalAuthority({ level: "head", approverId: "a", amount: 5_000_000, managerLimit: limit }).allowed, true);
  assert.equal(checkApprovalAuthority({ level: "admin", approverId: "a", amount: 5_000_000, managerLimit: limit }).allowed, true);
  // Self-approval is blocked at every level
  assert.equal(checkApprovalAuthority({ level: "manager", approverId: "a", createdById: "a", amount: 10, managerLimit: limit }).allowed, false);
  assert.equal(checkApprovalAuthority({ level: "admin", approverId: "a", createdById: "a", amount: 10, managerLimit: limit }).allowed, false);
  assert.equal(checkApprovalAuthority({ level: "head", approverId: "a", beneficiaryUserId: "a", amount: 10, managerLimit: limit }).allowed, false);
});
