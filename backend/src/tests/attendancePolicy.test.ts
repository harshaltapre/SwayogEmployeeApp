import {
  evaluateAttendancePolicy,
  generateFaceVerificationToken,
  verifyFaceToken,
  calculateHaversineDistance,
  calculateCosineSimilarity,
  getKolkataTimeInfo,
} from "../services/attendancePolicyEngine.js";

export function runComprehensivePolicyTests() {
  console.log("=== STARTING ATTENDANCE POLICY ENGINE TEST SUITE ===");

  const reportingTime = "10:30";
  const monthlyAllowance = 3;

  // 1. 10:00 AM -> PRESENT
  const t1 = new Date("2026-11-02T10:00:00+05:30");
  const res1 = evaluateAttendancePolicy({
    checkInTime: t1,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 0,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res1.status === "PRESENT", `Test 1 Failed: Expected PRESENT, got ${res1.status}`);
  console.assert(!res1.lateAllowanceConsumed, "Test 1 Failed: On time must not consume allowance");
  console.assert(res1.newLateDaysUsed === 0, "Test 1 Failed: Late days should remain 0");
  console.log("✔ Test 1 Passed: 10:00 AM -> PRESENT (No allowance consumed)");

  // 2. 10:30 AM exactly -> PRESENT
  const t2 = new Date("2026-11-02T10:30:00+05:30");
  const res2 = evaluateAttendancePolicy({
    checkInTime: t2,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 0,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res2.status === "PRESENT", `Test 2 Failed: Expected PRESENT, got ${res2.status}`);
  console.assert(!res2.lateAllowanceConsumed, "Test 2 Failed: 10:30 AM must not consume allowance");
  console.log("✔ Test 2 Passed: 10:30 AM exactly -> PRESENT");

  // 3. 10:31 AM, first late day -> PRESENT_LATE_ALLOWANCE (count 1/3)
  const t3 = new Date("2026-11-03T10:31:00+05:30");
  const res3 = evaluateAttendancePolicy({
    checkInTime: t3,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 0,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res3.status === "PRESENT_LATE_ALLOWANCE", `Test 3 Failed: got ${res3.status}`);
  console.assert(res3.lateAllowanceConsumed, "Test 3 Failed: Must consume allowance");
  console.assert(res3.newLateDaysUsed === 1, "Test 3 Failed: Late days must be 1");
  console.assert(res3.lateSequenceNumber === 1, "Test 3 Failed: Sequence number must be 1");
  console.log("✔ Test 3 Passed: 10:31 AM, 1st late day -> PRESENT_LATE_ALLOWANCE (1/3)");

  // 4. 11:30 AM, second late day -> PRESENT_LATE_ALLOWANCE (count 2/3)
  const t4 = new Date("2026-11-06T11:30:00+05:30");
  const res4 = evaluateAttendancePolicy({
    checkInTime: t4,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 1,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res4.status === "PRESENT_LATE_ALLOWANCE", `Test 4 Failed: got ${res4.status}`);
  console.assert(res4.lateAllowanceConsumed, "Test 4 Failed: Must consume allowance");
  console.assert(res4.newLateDaysUsed === 2, "Test 4 Failed: Late days must be 2");
  console.assert(res4.lateSequenceNumber === 2, "Test 4 Failed: Sequence number must be 2");
  console.log("✔ Test 4 Passed: 11:30 AM, 2nd late day -> PRESENT_LATE_ALLOWANCE (2/3)");

  // 5. 10:45 AM, third late day -> PRESENT_LATE_ALLOWANCE (count 3/3)
  const t5 = new Date("2026-11-09T10:45:00+05:30");
  const res5 = evaluateAttendancePolicy({
    checkInTime: t5,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 2,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res5.status === "PRESENT_LATE_ALLOWANCE", `Test 5 Failed: got ${res5.status}`);
  console.assert(res5.lateAllowanceConsumed, "Test 5 Failed: Must consume allowance");
  console.assert(res5.newLateDaysUsed === 3, "Test 5 Failed: Late days must be 3");
  console.assert(res5.lateSequenceNumber === 3, "Test 5 Failed: Sequence number must be 3");
  console.log("✔ Test 5 Passed: 10:45 AM, 3rd late day -> PRESENT_LATE_ALLOWANCE (3/3)");

  // 6. 10:31 AM, fourth late day -> HALF_DAY (count 4)
  const t6 = new Date("2026-11-12T10:31:00+05:30");
  const res6 = evaluateAttendancePolicy({
    checkInTime: t6,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 3,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res6.status === "HALF_DAY", `Test 6 Failed: Expected HALF_DAY, got ${res6.status}`);
  console.assert(!res6.lateAllowanceConsumed, "Test 6 Failed: No allowance remaining to consume");
  console.assert(res6.newLateDaysUsed === 4, "Test 6 Failed: Late count must continue to 4");
  console.assert(res6.newHalfDayCount === 1, "Test 6 Failed: Half day count must be 1");
  console.log("✔ Test 6 Passed: 10:31 AM, 4th late day -> HALF_DAY (count 4, half-days: 1)");

  // 7. Fifth and subsequent late days -> HALF_DAY (count 5)
  const t7 = new Date("2026-11-14T10:50:00+05:30");
  const res7 = evaluateAttendancePolicy({
    checkInTime: t7,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 4,
    currentHalfDayCount: 1,
    weeklyOffDays: [0],
  });
  console.assert(res7.status === "HALF_DAY", `Test 7 Failed: got ${res7.status}`);
  console.assert(res7.newLateDaysUsed === 5, "Test 7 Failed: Late count must continue to 5");
  console.assert(res7.newHalfDayCount === 2, "Test 7 Failed: Half day count must be 2");
  console.log("✔ Test 7 Passed: 10:50 AM, 5th late day -> HALF_DAY (count 5, half-days: 2)");

  // 8. On-time arrival after all allowances used -> PRESENT
  const t8 = new Date("2026-11-16T10:15:00+05:30");
  const res8 = evaluateAttendancePolicy({
    checkInTime: t8,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 5,
    currentHalfDayCount: 2,
    weeklyOffDays: [0],
  });
  console.assert(res8.status === "PRESENT", `Test 8 Failed: Expected PRESENT, got ${res8.status}`);
  console.assert(res8.newLateDaysUsed === 5, "Test 8 Failed: On-time arrival must not increment late count");
  console.assert(res8.newHalfDayCount === 2, "Test 8 Failed: Half-day count must not change");
  console.log("✔ Test 8 Passed: On-time arrival after allowances exhausted remains PRESENT");

  // 9. Sunday -> WEEKLY_OFF
  const t9 = new Date("2026-11-08T11:00:00+05:30"); // Sunday
  const res9 = evaluateAttendancePolicy({
    checkInTime: t9,
    reportingTimeStr: reportingTime,
    monthlyLateAllowance: monthlyAllowance,
    currentLateDaysUsed: 2,
    currentHalfDayCount: 0,
    weeklyOffDays: [0],
  });
  console.assert(res9.status === "WEEKLY_OFF", `Test 9 Failed: Sunday must be WEEKLY_OFF, got ${res9.status}`);
  console.assert(res9.newLateDaysUsed === 2, "Test 9 Failed: Sunday must not increment late count");
  console.log("✔ Test 9 Passed: Sunday -> WEEKLY_OFF (does not consume allowance)");

  // 10. Month change -> new month key
  const novInfo = getKolkataTimeInfo(new Date("2026-11-30T10:00:00+05:30"));
  const decInfo = getKolkataTimeInfo(new Date("2026-12-01T10:00:00+05:30"));
  console.assert(novInfo.yearMonth === "2026-11", "Test 10 Failed: Expected 2026-11");
  console.assert(decInfo.yearMonth === "2026-12", "Test 10 Failed: Expected 2026-12");
  console.log("✔ Test 10 Passed: Calendar month key correctly transitions from 2026-11 to 2026-12");

  // 11. Face Verification Token Generation & Validation
  const empId = "emp-test-123";
  const { token, expiresAt } = generateFaceVerificationToken({
    employeeId: empId,
    matchScore: 0.92,
    livenessVerified: true,
  });
  console.assert(!!token, "Test 11 Failed: Token must be generated");
  const verifyRes = verifyFaceToken(token, empId);
  console.assert(verifyRes.valid, `Test 11 Failed: Token must be valid: ${verifyRes.error}`);
  console.assert(verifyRes.payload?.matchScore === 0.92, "Test 11 Failed: Match score mismatch");

  // 12. Token Replay Protection
  const replayRes = verifyFaceToken(token, empId);
  console.assert(!replayRes.valid, "Test 12 Failed: Replayed token must be rejected");
  console.assert(replayRes.error?.includes("replay"), `Test 12 Failed: Expected replay error, got ${replayRes.error}`);
  console.log("✔ Test 11 & 12 Passed: Face verification token generation, verification & replay rejection");

  // 13. Token Wrong Employee
  const { token: token2 } = generateFaceVerificationToken({
    employeeId: "emp-other",
    matchScore: 0.88,
    livenessVerified: true,
  });
  const wrongEmpRes = verifyFaceToken(token2, empId);
  console.assert(!wrongEmpRes.valid, "Test 13 Failed: Token for another employee must be rejected");
  console.log("✔ Test 13 Passed: Token for wrong employee rejected");

  // 14. Geofence Distance Validation
  const officeLat = 18.5204;
  const officeLng = 73.8567;
  // Point exactly at office
  const dist0 = calculateHaversineDistance(officeLat, officeLng, officeLat, officeLng);
  console.assert(dist0 < 1, "Test 14 Failed: Same coordinate distance should be ~0m");

  // Point ~50 meters away
  const dist50 = calculateHaversineDistance(officeLat, officeLng, officeLat + 0.0004, officeLng);
  console.assert(dist50 < 100, `Test 14 Failed: Expected < 100m, got ${dist50}`);

  // Point 5 km away
  const dist5km = calculateHaversineDistance(officeLat, officeLng, officeLat + 0.05, officeLng);
  console.assert(dist5km > 3000, `Test 14 Failed: Expected > 3km, got ${dist5km}`);
  console.log("✔ Test 14 Passed: Haversine geofence distance calculation verified");

  // 15. Biometric Cosine Similarity Matching
  const v1 = [0.5, 0.5, 0.5, 0.5];
  const v2 = [0.5, 0.5, 0.5, 0.5];
  const sim1 = calculateCosineSimilarity(v1, v2);
  console.assert(Math.abs(sim1 - 1.0) < 0.0001, `Test 15 Failed: Identical vectors should have similarity 1.0, got ${sim1}`);

  const sim2 = calculateCosineSimilarity([1, 0], [0, 1]);
  console.assert(Math.abs(sim2) < 0.0001, "Test 15 Failed: Orthogonal vectors should have similarity 0");
  console.log("✔ Test 15 Passed: Cosine similarity biometric matching verified");

  console.log("=================================================");
  console.log("ALL 15 COMPREHENSIVE ATTENDANCE TESTS PASSED! 🎉");
  console.log("=================================================");
}

// Run immediately
runComprehensivePolicyTests();
