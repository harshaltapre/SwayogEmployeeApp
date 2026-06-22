package com.example.swayogemployeeapp

import com.example.swayogemployeeapp.data.remote.AttendanceCheckInRequest
import com.example.swayogemployeeapp.data.remote.AttendanceCheckOutRequest
import com.example.swayogemployeeapp.data.remote.WorkSubmissionRequest
import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Test

class SyncUnitTest {
    private val gson = Gson()

    @Test
    fun testAttendanceCheckInRequestSerialization() {
        val request = AttendanceCheckInRequest(
            date = "2026-06-19",
            checkInTime = "2026-06-19T09:30:00Z",
            latitude = 19.12,
            longitude = 72.89
        )
        val json = gson.toJson(request)
        val deserialized = gson.fromJson(json, AttendanceCheckInRequest::class.java)

        assertEquals("2026-06-19", deserialized.date)
        assertEquals("2026-06-19T09:30:00Z", deserialized.checkInTime)
        assertEquals(19.12, deserialized.latitude, 0.0001)
        assertEquals(72.89, deserialized.longitude, 0.0001)
    }

    @Test
    fun testAttendanceCheckOutRequestSerialization() {
        val request = AttendanceCheckOutRequest(
            date = "2026-06-19",
            checkOutTime = "2026-06-19T17:30:00Z",
            latitude = 19.12,
            longitude = 72.89
        )
        val json = gson.toJson(request)
        val deserialized = gson.fromJson(json, AttendanceCheckOutRequest::class.java)

        assertEquals("2026-06-19", deserialized.date)
        assertEquals("2026-06-19T17:30:00Z", deserialized.checkOutTime)
        assertEquals(19.12, deserialized.latitude, 0.0001)
        assertEquals(72.89, deserialized.longitude, 0.0001)
    }

    @Test
    fun testWorkSubmissionRequestSerialization() {
        val request = WorkSubmissionRequest(
            title = "Completed Cleaning",
            description = "Washed and aligned structure clamps",
            hoursSpent = 2.5,
            taskId = "task_301"
        )
        val json = gson.toJson(request)
        val deserialized = gson.fromJson(json, WorkSubmissionRequest::class.java)

        assertEquals("Completed Cleaning", deserialized.title)
        assertEquals("Washed and aligned structure clamps", deserialized.description)
        assertEquals(2.5, deserialized.hoursSpent, 0.01)
        assertEquals("task_301", deserialized.taskId)
    }

    @Test
    fun testSurveyPayloadSplitting() {
        val payload = "srv_123|||cust_456|||Concrete|||50.0|||30.0|||Obstacles: none|||0.15|||15.5|||19.12|||72.89"
        val parts = payload.split("|||")

        assertEquals(10, parts.size)
        assertEquals("srv_123", parts[0])
        assertEquals("cust_456", parts[1])
        assertEquals("Concrete", parts[2])
        assertEquals("50.0", parts[3])
        assertEquals("30.0", parts[4])
        assertEquals("Obstacles: none", parts[5])
        assertEquals("0.15", parts[6])
        assertEquals("15.5", parts[7])
        assertEquals("19.12", parts[8])
        assertEquals("72.89", parts[9])
    }

    @Test
    fun testDesignPayloadSplitting() {
        val payload = "cust_789|||42|||Growatt 5000|||15.0|||15"
        val parts = payload.split("|||")

        assertEquals(5, parts.size)
        assertEquals("cust_789", parts[0])
        assertEquals("42", parts[1])
        assertEquals("Growatt 5000", parts[2])
        assertEquals("15.0", parts[3])
        assertEquals("15", parts[4])
    }

    @Test
    fun testTaskCompletePayloadSplitting() {
        val payload = "999|||Task description complete|||https://example.com/receipt.pdf"
        val parts = payload.split("|||")

        assertEquals(3, parts.size)
        assertEquals("999", parts[0])
        assertEquals("Task description complete", parts[1])
        assertEquals("https://example.com/receipt.pdf", parts[2])
    }
}
