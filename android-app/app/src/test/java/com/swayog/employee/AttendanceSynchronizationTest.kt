package com.swayog.employee

import com.swayog.employee.data.local.entity.AttendanceEntity
import com.swayog.employee.data.model.AttendanceRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AttendanceSynchronizationTest {

    @Test
    fun test1_adminMarksPresent_employeeDoesNotNeedCheckIn() {
        val record = AttendanceRecord(
            id = "att-1",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = null,
            checkOutTime = null,
            totalMinutes = null,
            status = "PRESENT",
            notes = "Marked by admin for field task",
            latitude = null,
            longitude = null,
            source = "ADMIN_MARKED",
            manualOverride = true,
            reviewedBy = "admin-1",
            reviewerName = "Super Admin",
            isAttendanceCompleted = true,
            requiresCheckIn = false
        )

        assertTrue("Admin-marked attendance must be recognized as admin marked", record.isAdminMarked)
        assertTrue("Admin-marked attendance must be recognized as completed", record.isCompleted)
        assertFalse("Admin-marked attendance must not require check-in", record.requiresCheckIn)
        assertNull("Admin-marked attendance should not fabricate GPS latitude", record.latitude)
        assertNull("Admin-marked attendance should not fabricate GPS longitude", record.longitude)
    }

    @Test
    fun test2_employeeCheckInNormally_requiresGpsAndTracksWork() {
        val record = AttendanceRecord(
            id = "att-2",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = "2026-09-12T09:15:00.000Z",
            checkOutTime = null,
            totalMinutes = null,
            status = "PRESENT",
            notes = null,
            latitude = 18.5204,
            longitude = 73.8567,
            source = "EMPLOYEE_CHECK_IN",
            manualOverride = false,
            reviewedBy = null,
            reviewerName = null,
            isAttendanceCompleted = false,
            requiresCheckIn = false
        )

        assertFalse("Employee self check-in is not admin marked", record.isAdminMarked)
        assertFalse("Active check-in before checkout is not yet completed shift", record.isCompleted)
        assertEquals("Source must be EMPLOYEE_CHECK_IN", "EMPLOYEE_CHECK_IN", record.source)
        assertEquals(18.5204, record.latitude!!, 0.0001)
        assertEquals(73.8567, record.longitude!!, 0.0001)
    }

    @Test
    fun test3_employeeCheckOut_shiftCompleted() {
        val record = AttendanceRecord(
            id = "att-3",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = "2026-09-12T09:15:00.000Z",
            checkOutTime = "2026-09-12T18:15:00.000Z",
            totalMinutes = 540,
            status = "PRESENT",
            notes = null,
            latitude = 18.5204,
            longitude = 73.8567,
            source = "EMPLOYEE_CHECK_IN",
            manualOverride = false,
            reviewedBy = null,
            reviewerName = null,
            isAttendanceCompleted = true,
            requiresCheckIn = false
        )

        assertTrue("After checkout, attendance is completed", record.isCompleted)
        assertEquals(540, record.totalMinutes)
    }

    @Test
    fun test4_adminCorrection_preservesAuditTrail() {
        val record = AttendanceRecord(
            id = "att-4",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = "2026-09-12T09:30:00.000Z",
            checkOutTime = "2026-09-12T18:00:00.000Z",
            totalMinutes = 510,
            status = "PRESENT",
            notes = "Adjusted check-in time due to field client visit",
            latitude = 18.5204,
            longitude = 73.8567,
            source = "ADMIN_CORRECTION",
            manualOverride = true,
            reviewedBy = "admin-42",
            reviewerName = "Branch Manager",
            isAttendanceCompleted = true,
            requiresCheckIn = false
        )

        assertTrue("Admin correction is flagged as admin marked", record.isAdminMarked)
        assertEquals("ADMIN_CORRECTION", record.source)
        assertEquals("admin-42", record.reviewedBy)
        assertEquals("Branch Manager", record.reviewerName)
        assertEquals("Adjusted check-in time due to field client visit", record.notes)
    }

    @Test
    fun test5_leaveAndHoliday_completedWithoutGps() {
        val leaveRecord = AttendanceRecord(
            id = "att-5",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = null,
            checkOutTime = null,
            totalMinutes = null,
            status = "LEAVE",
            notes = "Approved Sick Leave",
            latitude = null,
            longitude = null,
            source = "LEAVE",
            manualOverride = false,
            reviewedBy = null,
            reviewerName = null,
            isAttendanceCompleted = true,
            requiresCheckIn = false
        )

        assertTrue("Leave is recognized as completed attendance", leaveRecord.isCompleted)
        assertFalse("Leave does not require GPS check-in", leaveRecord.requiresCheckIn)
    }

    @Test
    fun test6_roomEntityMapping_preservesAllEnrichedProperties() {
        val entity = AttendanceEntity(
            id = "room-1",
            employeeId = "emp-101",
            date = "2026-09-12",
            checkInTime = null,
            checkOutTime = null,
            totalMinutes = null,
            status = "PRESENT",
            notes = "Offline/Local Admin sync",
            checkInSelfieUrl = null,
            checkInLocation = null,
            isSynced = true,
            source = "ADMIN_MARKED",
            manualOverride = true,
            reviewedBy = "admin-99",
            reviewerName = "Operations Lead",
            isAttendanceCompleted = true
        )

        val record = entity.toAttendanceRecord()
        assertEquals("room-1", record.id)
        assertEquals("ADMIN_MARKED", record.source)
        assertTrue(record.manualOverride)
        assertEquals("admin-99", record.reviewedBy)
        assertEquals("Operations Lead", record.reviewerName)
        assertTrue(record.isAttendanceCompleted)
        assertTrue(record.isAdminMarked)
        assertTrue(record.isCompleted)
    }
}
