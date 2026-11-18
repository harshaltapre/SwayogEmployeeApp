import assert from "node:assert/strict";
import {
  AttendanceConflictError,
  AttendanceValidationError,
} from "../services/attendanceService.js";

console.log("=== STARTING ATTENDANCE IDEMPOTENCY & ERROR TESTS ===");

const conflict = new AttendanceConflictError("Already checked in today");
assert.equal(conflict.statusCode, 409);
assert.equal(conflict.code, "ATTENDANCE_CONFLICT");
assert.equal(conflict.message, "Already checked in today");
console.log("✔ Test 1 Passed: AttendanceConflictError exposes HTTP 409 & ATTENDANCE_CONFLICT");

const validation = new AttendanceValidationError("Face verification is required");
assert.equal(validation.statusCode, 422);
assert.equal(validation.code, "ATTENDANCE_VALIDATION_ERROR");
assert.equal(validation.message, "Face verification is required");
console.log("✔ Test 2 Passed: AttendanceValidationError exposes HTTP 422 & ATTENDANCE_VALIDATION_ERROR");

console.log("=== ALL ATTENDANCE IDEMPOTENCY & ERROR TESTS PASSED! ===");
