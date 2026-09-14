package com.swayog.employee.data.model

import com.google.gson.annotations.SerializedName

// ── 1. Dashboard & Working Hours ──────────────────────────────────────────

data class WorkforceSummary(
    val calendarDays: Int = 0,
    val weeklyOffs: Int = 0,
    val companyHolidays: Int = 0,
    val approvedLeaveDays: Double = 0.0,
    val paidLeaveDays: Double = 0.0,
    val unpaidLeaveDays: Double = 0.0,
    val expectedWorkingDays: Double = 0.0,
    val dailyRequiredHours: Int = 8,
    val expectedMonthlyHours: Double = 0.0,
    val regularWorkedHours: Double = 0.0,
    val approvedOtHours: Double = 0.0,
    val differenceInRegularHours: Double = 0.0,
    val remainingRequiredHours: Double = 0.0,
    val presentCount: Int = 0,
    val halfDayCount: Int = 0,
    val absentCount: Int = 0
)

data class WorkforceDashboardResponse(
    val success: Boolean = false,
    val month: Int = 0,
    val year: Int = 0,
    val summary: WorkforceSummary = WorkforceSummary(),
    val today: AttendanceRecord? = null,
    val todayCalendarDay: CalendarDayDto? = null,
    val leaveBalance: LeaveBalanceResponse? = null,
    val earnings: EarningsSummary? = null,
    val activeOvertimeSession: OvertimeSessionDto? = null
)

// ── 2. Authoritative Calendar ───────────────────────────────────────────────

data class CalendarDayDto(
    val date: String,
    val dayNumber: Int,
    val dayOfWeek: Int, // 0 = Sunday, 1 = Monday, ...
    val status: String, // WORKING_DAY, WEEKLY_OFF, COMPANY_HOLIDAY, PRESENT, HALF_DAY, ABSENT, PAID_LEAVE, UNPAID_LEAVE
    val isSunday: Boolean = false,
    val isHoliday: Boolean = false,
    val holidayName: String? = null,
    val isPresent: Boolean = false,
    val isHalfDay: Boolean = false,
    val isAbsent: Boolean = false,
    val isPaidLeave: Boolean = false,
    val isUnpaidLeave: Boolean = false,
    val isAdminAssigned: Boolean = false,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val regularHours: Double = 0.0,
    val overtimeHours: Double = 0.0,
    val totalHours: Double = 0.0,
    val overtimeAllowed: Boolean = false,
    val hasPendingCorrection: Boolean = false,
    val correctionStatus: String? = null,
    val notes: String? = null
)

data class AuthoritativeCalendarResponse(
    val success: Boolean = false,
    val month: Int = 0,
    val year: Int = 0,
    val days: List<CalendarDayDto> = emptyList()
)

// ── 3. Leave Module ─────────────────────────────────────────────────────────

data class LeaveCategory(
    val name: String,
    val allowance: Double,
    val used: Double,
    val remaining: Double
)

data class LeaveBalanceResponse(
    val annualAllowance: Double = 24.0,
    val used: Double = 0.0,
    val pending: Double = 0.0,
    val remaining: Double = 24.0,
    val categories: List<LeaveCategory> = emptyList()
)

data class LeaveBalanceApiResponse(
    val success: Boolean = false,
    val balance: LeaveBalanceResponse? = null
)

data class LeaveRequestDto(
    val id: String,
    val employeeId: String,
    val leaveType: String, // PAID, UNPAID, SICK, CASUAL, EMERGENCY, OTHER
    val startDate: String,
    val endDate: String,
    val isHalfDay: Boolean = false,
    val halfDayPeriod: String? = null,
    val reason: String,
    val status: String, // PENDING, APPROVED, REJECTED, CANCELLED
    val submittedAt: String,
    val reviewedAt: String? = null,
    val reviewedBy: String? = null,
    val reviewerNotes: String? = null
)

data class LeaveHistoryResponse(
    val success: Boolean = false,
    val leaves: List<LeaveRequestDto> = emptyList()
)

data class SubmitLeaveRequest(
    val leaveType: String,
    val startDate: String,
    val endDate: String,
    val isHalfDay: Boolean = false,
    val halfDayPeriod: String? = null,
    val reason: String
)

data class SubmitLeaveResponse(
    val success: Boolean = false,
    val request: LeaveRequestDto? = null
)

// ── 4. Overtime Module ──────────────────────────────────────────────────────

data class OvertimeRequestDto(
    val id: String,
    val employeeId: String,
    val date: String,
    val overtimeType: String, // AFTER_SHIFT, SUNDAY, WEEKLY_OFF, HOLIDAY, NIGHT
    val startTime: String,
    val endTime: String? = null,
    val durationMinutes: Int = 0,
    val reason: String,
    val status: String, // PENDING, APPROVED, REJECTED, CANCELLED
    val submittedAt: String,
    val rateMultiplier: Double = 1.5,
    val approvedHours: Double? = null,
    val payableAmount: Double? = null,
    val reviewerNotes: String? = null
)

data class OvertimeSessionDto(
    val id: String,
    val employeeId: String,
    val requestId: String? = null,
    val startedAt: String, // Complete ISO timestamp
    val stoppedAt: String? = null,
    val durationMinutes: Int? = null,
    val status: String, // ACTIVE, COMPLETED, CANCELLED
    val notes: String? = null
)

data class OvertimeSummaryResponse(
    val success: Boolean = false,
    val approvedOvertimeHours: Double = 0.0,
    val activeSession: OvertimeSessionDto? = null,
    val requests: List<OvertimeRequestDto> = emptyList()
)

data class OvertimeHistoryResponse(
    val success: Boolean = false,
    val history: List<OvertimeRequestDto> = emptyList()
)

data class SubmitOvertimeRequest(
    val date: String,
    val overtimeType: String,
    val startTime: String,
    val endTime: String? = null,
    val durationMinutes: Int,
    val reason: String
)

data class SubmitOvertimeResponse(
    val success: Boolean = false,
    val request: OvertimeRequestDto? = null
)

data class OvertimeSessionResponse(
    val success: Boolean = false,
    val session: OvertimeSessionDto? = null
)

data class StartOvertimeSessionRequest(
    val requestId: String? = null
)

data class StopOvertimeSessionRequest(
    val notes: String? = null
)

// ── 5. Earnings / Salary Module ─────────────────────────────────────────────

data class EarningsSummary(
    val month: Int = 0,
    val year: Int = 0,
    val baseSalary: Double = 0.0,
    val regularPay: Double = 0.0,
    val overtimeHours: Double = 0.0,
    val overtimeEarnings: Double = 0.0,
    val incentives: Double = 0.0,
    val advanceDeduction: Double = 0.0,
    val otherDeductions: Double = 0.0,
    val estimatedPayable: Double = 0.0,
    val payrollStatus: String = "ESTIMATED", // "ESTIMATED" or "FINAL / PAYROLL CONFIRMED"
    val hourlyRate: Double = 0.0,
    val isFinalized: Boolean = false
)

data class EarningsResponse(
    val success: Boolean = false,
    val earnings: EarningsSummary? = null
)

data class SalaryRevisionDto(
    val effectiveDate: String,
    val previousSalary: Double,
    val newSalary: Double,
    val incrementAmount: Double,
    val incrementPercentage: Double,
    val reason: String? = null
)

data class SalaryHistoryResponse(
    val success: Boolean = false,
    val history: List<SalaryRevisionDto> = emptyList()
)

// ── 6. Advances Module ──────────────────────────────────────────────────────

data class AdvanceRecordDto(
    val id: String,
    val employeeId: String,
    val amount: Double,
    val reason: String,
    val requestedDate: String,
    val status: String, // PENDING, APPROVED, REJECTED, PAID, PARTIALLY_RECOVERED, FULLY_RECOVERED
    val totalRecovered: Double = 0.0,
    val monthlyDeduction: Double = 0.0
)

data class AdvanceSummaryDto(
    val totalReceived: Double = 0.0,
    val totalRecovered: Double = 0.0,
    val remainingAdvance: Double = 0.0,
    val currentMonthDeduction: Double = 0.0,
    val records: List<AdvanceRecordDto> = emptyList()
)

data class AdvancesResponse(
    val success: Boolean = false,
    val summary: AdvanceSummaryDto = AdvanceSummaryDto()
)

data class SubmitAdvanceRequest(
    val amount: Double,
    val reason: String
)

data class SubmitAdvanceResponse(
    val success: Boolean = false,
    val request: AdvanceRecordDto? = null
)

// ── 7. Incentives Module ────────────────────────────────────────────────────

data class IncentiveDto(
    val id: String,
    val name: String,
    val category: String, // PERFORMANCE, ATTENDANCE, PROJECT, OTHER
    val amount: Double,
    val month: Int,
    val year: Int,
    val reason: String,
    val status: String // PENDING, APPROVED, PAID
)

data class IncentivesResponse(
    val success: Boolean = false,
    val incentives: List<IncentiveDto> = emptyList()
)

// ── 8. Attendance Correction Module ─────────────────────────────────────────

data class AttendanceCorrectionDto(
    val id: String,
    val employeeId: String,
    val date: String,
    val requestedCheckIn: String? = null,
    val requestedCheckOut: String? = null,
    val requestedStatus: String? = null,
    val reason: String,
    val status: String, // PENDING, APPROVED, REJECTED
    val submittedAt: String,
    val adminResponse: String? = null
)

data class AttendanceCorrectionsResponse(
    val success: Boolean = false,
    val history: List<AttendanceCorrectionDto> = emptyList()
)

data class SubmitAttendanceCorrectionRequest(
    val date: String,
    val requestedCheckIn: String? = null,
    val requestedCheckOut: String? = null,
    val requestedStatus: String? = null,
    val reason: String
)

data class SubmitAttendanceCorrectionResponse(
    val success: Boolean = false,
    val correction: AttendanceCorrectionDto? = null
)

// ── 9. Unified Requests Center ─────────────────────────────────────────────

data class UnifiedRequestDto(
    val id: String,
    val type: String, // LEAVE, OVERTIME, CORRECTION, ADVANCE
    val title: String,
    val date: String,
    val submittedAt: String,
    val status: String, // PENDING, APPROVED, REJECTED, CANCELLED, PAID
    val reason: String,
    val details: String,
    val adminResponse: String? = null
)

data class UnifiedRequestsResponse(
    val success: Boolean = false,
    val requests: List<UnifiedRequestDto> = emptyList()
)
