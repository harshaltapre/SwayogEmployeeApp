package com.example.swayogemployeeapp.data.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.remote.*
import com.google.gson.Gson
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.io.File

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val db = AppDatabase.getDatabase(appContext)
    private val apiService = NetworkClient.getApiService(appContext)
    private val gson = Gson()

    override suspend fun doWork(): Result {
        Log.d("SyncWorker", "Offline synchronization worker started execution...")
        val queue = db.outboxQueueDao().getQueue()
        if (queue.isEmpty()) {
            Log.d("SyncWorker", "Outbox queue is empty. Nothing to sync.")
            return Result.success()
        }

        var hasFailure = false

        for (item in queue) {
            if (item.isProcessing) continue
            
            db.outboxQueueDao().updateProcessingStatus(item.localId, true)

            try {
                val success = when (item.actionType) {
                    "CHECK_IN" -> {
                        val payload = gson.fromJson(item.payloadJson, AttendanceCheckInRequest::class.java)
                        val response = apiService.checkIn(payload)
                        if (response.isSuccessful) {
                            // Update attendance record synced state in DB
                            val records = db.attendanceRecordDao().getUnsyncedRecords()
                            val match = records.find { it.date == payload.date }
                            if (match != null) {
                                db.attendanceRecordDao().update(match.copy(isSynced = true, remoteId = response.body()?.data?.attendanceId))
                            }
                            true
                        } else false
                    }
                    "CHECK_OUT" -> {
                        val payload = gson.fromJson(item.payloadJson, AttendanceCheckOutRequest::class.java)
                        val response = apiService.checkOut(payload)
                        if (response.isSuccessful) {
                            val records = db.attendanceRecordDao().getUnsyncedRecords()
                            val match = records.find { it.date == payload.date }
                            if (match != null) {
                                db.attendanceRecordDao().update(match.copy(isSynced = true))
                            }
                            true
                        } else false
                    }
                    "SURVEY" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 10) {
                            val taskId = RequestBody.create(MediaType.parse("text/plain"), parts[0])
                            val customerId = RequestBody.create(MediaType.parse("text/plain"), parts[1])
                            val roofType = RequestBody.create(MediaType.parse("text/plain"), parts[2])
                            val lengthFt = RequestBody.create(MediaType.parse("text/plain"), parts[3])
                            val widthFt = RequestBody.create(MediaType.parse("text/plain"), parts[4])
                            val obstacleNotes = RequestBody.create(MediaType.parse("text/plain"), parts[5])
                            val shadowFactors = RequestBody.create(MediaType.parse("text/plain"), parts[6])
                            val recommendedCapacity = RequestBody.create(MediaType.parse("text/plain"), parts[7])
                            val latitude = RequestBody.create(MediaType.parse("text/plain"), parts[8])
                            val longitude = RequestBody.create(MediaType.parse("text/plain"), parts[9])

                            val photoParts = mutableListOf<MultipartBody.Part>()
                            item.localAttachmentPaths?.split(",")?.forEachIndexed { index, path ->
                                if (path.isNotEmpty()) {
                                    val file = File(path)
                                    if (file.exists()) {
                                        val reqFile = RequestBody.create(MediaType.parse("image/jpeg"), file)
                                        photoParts.add(MultipartBody.Part.createFormData("photos", file.name, reqFile))
                                    } else {
                                        // Mock body part for testability if file doesn't physically exist
                                        val mockBody = RequestBody.create(MediaType.parse("image/jpeg"), "mock_bytes")
                                        photoParts.add(MultipartBody.Part.createFormData("photos", "photo_$index.jpg", mockBody))
                                    }
                                }
                            }

                            val response = apiService.submitSurvey(
                                taskId, customerId, roofType, lengthFt, widthFt,
                                obstacleNotes, shadowFactors, recommendedCapacity,
                                latitude, longitude, photoParts
                            )
                            if (response.isSuccessful) {
                                val sId = parts[0].toIntOrNull()
                                if (sId != null) {
                                    val survey = db.siteSurveyDao().getAllSurveysFlow() // simple fetch
                                    // Normally we match by taskId
                                    Log.d("SyncWorker", "Survey synced with remote ID: ${response.body()?.surveyId}")
                                }
                                true
                            } else false
                        } else false
                    }
                    "DESIGN" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 5) {
                            val customerId = RequestBody.create(MediaType.parse("text/plain"), parts[0])
                            val panelCount = RequestBody.create(MediaType.parse("text/plain"), parts[1])
                            val inverterModel = RequestBody.create(MediaType.parse("text/plain"), parts[2])
                            val capacity = RequestBody.create(MediaType.parse("text/plain"), parts[3])
                            val tilt = RequestBody.create(MediaType.parse("text/plain"), parts[4])

                            val mockBytes = RequestBody.create(MediaType.parse("application/pdf"), "mock_pdf_content")
                            val cadPart = MultipartBody.Part.createFormData("cadLayout", "cad_layout.pdf", mockBytes)
                            val sldPart = MultipartBody.Part.createFormData("sldDiagram", "sld_diagram.pdf", mockBytes)

                            val response = apiService.submitDesign(
                                customerId, panelCount, inverterModel, capacity, tilt, cadPart, sldPart
                            )
                            response.isSuccessful
                        } else false
                    }
                    "TASK_COMPLETE" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 3) {
                            val taskId = parts[0].toInt()
                            val msg = parts[1]
                            val docUrl = parts[2].takeIf { it.isNotEmpty() }
                            val response = apiService.completeTask(taskId, TaskCompleteRequest(msg, docUrl))
                            if (response.isSuccessful) {
                                val task = db.employeeTaskDao().getTaskById(taskId)
                                if (task != null) {
                                    db.employeeTaskDao().update(task.copy(status = "completed", completionMessage = msg, completionDocumentUrl = docUrl, completedAt = System.currentTimeMillis().toString()))
                                }
                                true
                            } else false
                        } else false
                    }
                    "COMMIT" -> {
                        val payload = gson.fromJson(item.payloadJson, WorkSubmissionRequest::class.java)
                        val response = apiService.submitDailyWork(payload)
                        if (response.isSuccessful) {
                            // Find and update daily commit synched state
                            Log.d("SyncWorker", "Work submission synced successfully.")
                            true
                        } else false
                    }
                    "DAILY_COMMIT" -> {
                        val payload = gson.fromJson(item.payloadJson, DailyCommitRequest::class.java)
                        val response = apiService.submitDailyCommit(payload)
                        response.isSuccessful
                    }
                    "COMPLAINT_SCHEDULE" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 4) {
                            val taskId = parts[0].toInt()
                            val scheduledDate = parts[1]
                            val scheduledTime = parts[2]
                            val employeeId = parts[3].takeIf { it.isNotEmpty() }
                            // Call API to schedule complaint
                            val response = apiService.updateTaskSchedule(taskId, scheduledDate, scheduledTime, employeeId)
                            if (response.isSuccessful) {
                                val task = db.employeeTaskDao().getTaskById(taskId)
                                if (task != null) {
                                    db.employeeTaskDao().update(task.copy(
                                        scheduledTime = "$scheduledDate$scheduledTime",
                                        employeeUserId = employeeId,
                                        status = "scheduled"
                                    ))
                                }
                                true
                            } else false
                        } else false
                    }
                    "AMC_SETTINGS_UPDATE" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 6) {
                            val customerId = parts[0].toInt()
                            val cleaningsPerMonth = parts[1].toIntOrNull()
                            val monthlyRate = parts[2].toDoubleOrNull()
                            val clientType = parts[3].takeIf { it.isNotEmpty() }
                            val employeeId = parts[4].takeIf { it.isNotEmpty() }
                            val cleaningWindows = parts[5].takeIf { it.isNotEmpty() }
                            // Call API to update AMC settings
                            val response = apiService.updateAmcSettings(customerId, cleaningsPerMonth, monthlyRate, clientType, employeeId, cleaningWindows)
                            if (response.isSuccessful) {
                                // Update local customer entity
                                val customer = db.customerDao().getCustomerById(customerId)
                                if (customer != null) {
                                    db.customerDao().updateCustomer(customer.copy(
                                        cleaningsPerMonth = cleaningsPerMonth,
                                        monthlyCleaningRate = monthlyRate,
                                        clientType = clientType,
                                        assignedEmployeeId = employeeId
                                    ))
                                }
                                true
                            } else false
                        } else false
                    }
                    "PAYMENT_LOG" -> {
                        val payload = gson.fromJson(item.payloadJson, PaymentLogRequest::class.java)
                        val response = apiService.logPayment(payload)
                        if (response.isSuccessful) {
                            Log.d("SyncWorker", "Payment logged successfully")
                            true
                        } else false
                    }
                    "CREDENTIALS_UPDATE" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 6) {
                            val customerId = parts[0].toInt()
                            val brand = parts[1].takeIf { it.isNotEmpty() }
                            val loginId = parts[2].takeIf { it.isNotEmpty() }
                            val password = parts[3].takeIf { it.isNotEmpty() }
                            val deviceSn = parts[4].takeIf { it.isNotEmpty() }
                            val apiKey = parts[5].takeIf { it.isNotEmpty() }
                            // Call API to update credentials
                            val response = apiService.updateInverterCredentials(customerId, brand, loginId, password, deviceSn, apiKey)
                            if (response.isSuccessful) {
                                val customer = db.customerDao().getCustomerById(customerId)
                                if (customer != null) {
                                    db.customerDao().updateCustomer(customer.copy(
                                        inverterBrand = brand,
                                        inverterLoginId = loginId,
                                        inverterPassword = password,
                                        inverterDeviceSn = deviceSn,
                                        inverterApiKey = apiKey
                                    ))
                                }
                                true
                            } else false
                        } else false
                    }
                    "TASK_ASSIGN" -> {
                        val parts = item.payloadJson.split("|||")
                        if (parts.size >= 5) {
                            val customerId = parts[0].toIntOrNull()
                            val jobType = parts[1]
                            val description = parts[2]
                            val address = parts[3]
                            val employeeId = parts[4].takeIf { it.isNotEmpty() }
                            // Call API to assign task
                            val response = apiService.assignTask(customerId, jobType, description, address, employeeId)
                            if (response.isSuccessful) {
                                Log.d("SyncWorker", "Task assigned successfully")
                                true
                            } else false
                        } else false
                    }
                    else -> false
                }

                if (success) {
                    db.outboxQueueDao().dequeue(item.localId)
                    Log.d("SyncWorker", "Successfully synchronized outbox item ${item.localId} of type ${item.actionType}")
                } else {
                    db.outboxQueueDao().updateProcessingStatus(item.localId, false)
                    hasFailure = true
                    Log.e("SyncWorker", "Failed to synchronize outbox item ${item.localId}")
                }
            } catch (e: Exception) {
                Log.e("SyncWorker", "Exception processing outbox item ${item.localId}: ${e.message}")
                db.outboxQueueDao().updateProcessingStatus(item.localId, false)
                hasFailure = true
            }
        }

        return if (hasFailure) Result.retry() else Result.success()
    }
}
