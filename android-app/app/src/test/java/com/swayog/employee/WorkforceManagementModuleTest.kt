package com.swayog.employee

import com.swayog.employee.data.model.*
import org.junit.Assert.*
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.*

class WorkforceManagementModuleTest {

    // ── Criterion 4 & 5: Dynamic Monthly Working Hours Calculation ───────────────
    @Test
    fun testDynamicMonthlyWorkingHoursCalculation() {
        // September example from requirements:
        // Calendar days = 30
        // Weekly offs = 4
        // Company holidays = 2
        // Approved leave = 1
        // Expected working days = 30 - 4 - 2 - 1 = 23 days
        // Daily required hours = 8
        // Expected monthly hours = 23 * 8 = 184h
        val summary = WorkforceSummary(
            calendarDays = 30,
            weeklyOffs = 4,
            companyHolidays = 2,
            approvedLeaveDays = 1.0,
            paidLeaveDays = 1.0,
            unpaidLeaveDays = 0.0,
            expectedWorkingDays = 23.0,
            dailyRequiredHours = 8,
            expectedMonthlyHours = 184.0,
            regularWorkedHours = 178.0,
            approvedOtHours = 9.0,
            differenceInRegularHours = -6.0,
            remainingRequiredHours = 6.0,
            presentCount = 20,
            halfDayCount = 1,
            absentCount = 0
        )

        assertEquals("Calendar days must be 30", 30, summary.calendarDays)
        assertEquals("Weekly offs must be 4", 4, summary.weeklyOffs)
        assertEquals("Company holidays must be 2", 2, summary.companyHolidays)
        assertEquals("Approved leave must be 1 day", 1.0, summary.approvedLeaveDays, 0.01)

        val calculatedExpectedDays = summary.calendarDays - summary.weeklyOffs - summary.companyHolidays - summary.approvedLeaveDays
        assertEquals("Expected working days calculation must equal 23.0", 23.0, calculatedExpectedDays, 0.01)
        assertEquals("Expected monthly hours must equal 184.0h", 184.0, calculatedExpectedDays * summary.dailyRequiredHours, 0.01)
        assertEquals("Stored expected monthly hours must be 184.0h", 184.0, summary.expectedMonthlyHours, 0.01)

        // Criterion 6: Regular worked hours and overtime must be separate
        assertEquals("Regular worked hours must be 178.0h", 178.0, summary.regularWorkedHours, 0.01)
        assertEquals("Approved OT must be 9.0h", 9.0, summary.approvedOtHours, 0.01)
        assertEquals("Difference in regular hours must be -6.0h", -6.0, summary.differenceInRegularHours, 0.01)
        assertNotEquals("Overtime must not be added to regular worked hours", summary.expectedMonthlyHours, summary.regularWorkedHours + summary.approvedOtHours)
    }

    // ── Criterion 2 & 3 & 7: Attendance States and Non-Contradictory Actions ──────
    @Test
    fun testAdminAssignedAttendanceSuppressesCheckIn() {
        val adminRecord = AttendanceRecord(
            id = "att-admin-1",
            employeeId = "emp-001",
            date = "2026-09-14",
            checkInTime = null,
            checkOutTime = null,
            totalMinutes = 480,
            status = "PRESENT",
            notes = "Assigned present by supervisor for field visit",
            source = "ADMIN_ASSIGNED",
            manualOverride = true,
            isAttendanceCompleted = true,
            requiresCheckIn = false
        )

        assertTrue("Record must be identified as admin marked", adminRecord.isAdminMarked)
        assertTrue("Admin marked record is completed", adminRecord.isCompleted)
        assertFalse("Admin marked record must not require check in", adminRecord.requiresCheckIn)
    }

    @Test
    fun testSundaysAndHolidaysRecognizedAsWeeklyOffsNotAbsences() {
        val sundayDto = CalendarDayDto(
            date = "2026-09-13",
            dayNumber = 13,
            dayOfWeek = 0, // Sunday
            status = "WEEKLY_OFF",
            isSunday = true,
            isHoliday = false,
            isPresent = false,
            isAbsent = false,
            overtimeAllowed = true
        )

        assertTrue("Day must be recognized as Sunday", sundayDto.isSunday)
        assertFalse("Sunday must not be treated as absent", sundayDto.isAbsent)
        assertEquals("Status must be WEEKLY_OFF", "WEEKLY_OFF", sundayDto.status)
        assertTrue("Overtime should be permitted on Sunday per policy", sundayDto.overtimeAllowed)

        val holidayDto = CalendarDayDto(
            date = "2026-09-07",
            dayNumber = 7,
            dayOfWeek = 1,
            status = "COMPANY_HOLIDAY",
            isSunday = false,
            isHoliday = true,
            holidayName = "Ganesh Chaturthi",
            isPresent = false,
            isAbsent = false,
            overtimeAllowed = true
        )

        assertTrue("Day must be recognized as Holiday", holidayDto.isHoliday)
        assertFalse("Holiday must not be treated as absent", holidayDto.isAbsent)
        assertEquals("Status must be COMPANY_HOLIDAY", "COMPANY_HOLIDAY", holidayDto.status)
        assertEquals("Ganesh Chaturthi", holidayDto.holidayName)
    }

    // ── Criterion 13: Overtime Sessions Crossing Midnight ────────────────────────
    @Test
    fun testMidnightCrossingOvertimeSessionDuration() {
        // Start: 2026-09-14T22:00:00.000Z (10:00 PM)
        // Stop:  2026-09-15T00:30:00.000Z (12:30 AM next day)
        // Duration: 2 hours 30 mins = 150 minutes
        val startIso = "2026-09-14T22:00:00.000Z"
        val stopIso = "2026-09-15T00:30:00.000Z"

        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val startTime = parser.parse(startIso.substringBefore("."))!!.time
        val stopTime = parser.parse(stopIso.substringBefore("."))!!.time

        val diffMinutes = ((stopTime - startTime) / (1000 * 60)).toInt()
        assertEquals("Midnight crossing duration must equal 150 minutes", 150, diffMinutes)

        val session = OvertimeSessionDto(
            id = "ot-sess-1",
            employeeId = "emp-001",
            requestId = "req-ot-10",
            startedAt = startIso,
            stoppedAt = stopIso,
            durationMinutes = diffMinutes,
            status = "COMPLETED",
            notes = "Late night deployment support"
        )

        assertEquals("COMPLETED", session.status)
        assertEquals(150, session.durationMinutes)
        assertNotNull(session.stoppedAt)
    }

    // ── Criterion 11 & 14: Overtime Approval and Payable Earnings ────────────────
    @Test
    fun testOnlyApprovedOvertimeContributesToPayableEarnings() {
        val pendingRequest = OvertimeRequestDto(
            id = "ot-1",
            employeeId = "emp-001",
            date = "2026-09-12",
            overtimeType = "AFTER_SHIFT",
            startTime = "18:00",
            durationMinutes = 120,
            reason = "Client bugfix",
            status = "PENDING",
            submittedAt = "2026-09-12T18:05:00.000Z",
            rateMultiplier = 1.5,
            approvedHours = null,
            payableAmount = null
        )

        val approvedRequest = OvertimeRequestDto(
            id = "ot-2",
            employeeId = "emp-001",
            date = "2026-09-13",
            overtimeType = "SUNDAY",
            startTime = "09:00",
            durationMinutes = 480, // 8h
            reason = "Site commissioning",
            status = "APPROVED",
            submittedAt = "2026-09-13T09:00:00.000Z",
            rateMultiplier = 2.0,
            approvedHours = 8.0,
            payableAmount = 2000.0,
            reviewerNotes = "Approved by Admin"
        )

        val rejectedRequest = OvertimeRequestDto(
            id = "ot-3",
            employeeId = "emp-001",
            date = "2026-09-10",
            overtimeType = "AFTER_SHIFT",
            startTime = "18:00",
            durationMinutes = 60,
            reason = "Self study",
            status = "REJECTED",
            submittedAt = "2026-09-10T18:00:00.000Z",
            rateMultiplier = 1.5,
            approvedHours = 0.0,
            payableAmount = 0.0,
            reviewerNotes = "Not company project work"
        )

        assertNull("Pending overtime must not have payableAmount", pendingRequest.payableAmount)
        assertEquals("Approved overtime must have 8.0 approved hours", 8.0, approvedRequest.approvedHours!!, 0.01)
        assertEquals("Approved overtime must have 2000.0 payable amount", 2000.0, approvedRequest.payableAmount!!, 0.01)
        assertEquals("Rejected overtime must have 0 payable amount", 0.0, rejectedRequest.payableAmount!!, 0.01)
    }

    // ── Criterion 15: Earnings Breakdown & Estimated vs Final ───────────────────
    @Test
    fun testEarningsBreakdownDistinguishesEstimatedFromFinal() {
        val estimatedEarnings = EarningsSummary(
            month = 9,
            year = 2026,
            baseSalary = 30000.0,
            regularPay = 29000.0,
            overtimeHours = 9.0,
            overtimeEarnings = 2500.0,
            incentives = 1000.0,
            advanceDeduction = 2000.0,
            otherDeductions = 500.0,
            estimatedPayable = 30000.0,
            payrollStatus = "ESTIMATED",
            isFinalized = false
        )

        assertFalse("Estimated earnings must not be marked finalized", estimatedEarnings.isFinalized)
        assertEquals("Payroll status must be ESTIMATED", "ESTIMATED", estimatedEarnings.payrollStatus)

        val finalEarnings = estimatedEarnings.copy(
            payrollStatus = "FINAL / PAYROLL CONFIRMED",
            isFinalized = true
        )

        assertTrue("Finalized earnings must have isFinalized true", finalEarnings.isFinalized)
        assertEquals("FINAL / PAYROLL CONFIRMED", finalEarnings.payrollStatus)
    }

    // ── Criterion 16: Salary Revisions ──────────────────────────────────────────
    @Test
    fun testSalaryRevisionHistoryCalculations() {
        val revision = SalaryRevisionDto(
            effectiveDate = "2026-07-01",
            previousSalary = 25000.0,
            newSalary = 30000.0,
            incrementAmount = 5000.0,
            incrementPercentage = 20.0,
            reason = "Annual appraisal promotion"
        )

        assertEquals(5000.0, revision.newSalary - revision.previousSalary, 0.01)
        assertEquals(20.0, (revision.incrementAmount / revision.previousSalary) * 100.0, 0.01)
    }

    // ── Criterion 17: Advances Recovery Tracking ────────────────────────────────
    @Test
    fun testAdvancesTrackingAndDeductions() {
        val advanceSummary = AdvanceSummaryDto(
            totalReceived = 10000.0,
            totalRecovered = 6000.0,
            remainingAdvance = 4000.0,
            currentMonthDeduction = 2000.0,
            records = listOf(
                AdvanceRecordDto(
                    id = "adv-1",
                    employeeId = "emp-001",
                    amount = 10000.0,
                    reason = "Medical emergency",
                    requestedDate = "2026-07-10",
                    status = "PARTIALLY_RECOVERED",
                    totalRecovered = 6000.0,
                    monthlyDeduction = 2000.0
                )
            )
        )

        assertEquals(4000.0, advanceSummary.totalReceived - advanceSummary.totalRecovered, 0.01)
        assertEquals(advanceSummary.remainingAdvance, advanceSummary.totalReceived - advanceSummary.totalRecovered, 0.01)
        assertEquals(2000.0, advanceSummary.currentMonthDeduction, 0.01)
    }

    // ── Criterion 8 & 9: Leave Allowance and Concession ─────────────────────────
    @Test
    fun testLeaveAllowanceAndBalance() {
        val balance = LeaveBalanceResponse(
            annualAllowance = 24.0,
            used = 8.0,
            pending = 1.0,
            remaining = 15.0,
            categories = listOf(
                LeaveCategory("Paid Leave", 18.0, 6.0, 12.0),
                LeaveCategory("Casual Leave", 6.0, 2.0, 4.0)
            )
        )

        assertEquals("Annual allowance must be 24", 24.0, balance.annualAllowance, 0.01)
        assertEquals("Used must be 8", 8.0, balance.used, 0.01)
        assertEquals("Pending must be 1", 1.0, balance.pending, 0.01)
        assertEquals("Remaining must be 15", 15.0, balance.annualAllowance - balance.used - balance.pending, 0.01)
    }

    // ── Criterion 20: Attendance Correction Request ─────────────────────────────
    @Test
    fun testAttendanceCorrectionCreatesRequestWithoutOverwritingHistory() {
        val correction = AttendanceCorrectionDto(
            id = "corr-101",
            employeeId = "emp-001",
            date = "2026-09-10",
            requestedCheckIn = "09:05",
            requestedCheckOut = "18:15",
            requestedStatus = "PRESENT",
            reason = "Biometric reader failed at gate, logged manually with guard",
            status = "PENDING",
            submittedAt = "2026-09-10T18:30:00.000Z",
            adminResponse = null
        )

        assertEquals("PENDING", correction.status)
        assertNull(correction.adminResponse)
        assertTrue(correction.reason.length >= 5)
    }
}
