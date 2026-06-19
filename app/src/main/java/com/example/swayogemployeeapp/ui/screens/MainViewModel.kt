package com.example.swayogemployeeapp.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import com.example.swayogemployeeapp.data.repository.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val userRepo = UserRepository(application)
    private val attendanceRepo = AttendanceRepository(application)
    private val taskRepo = TaskRepository(application)
    private val surveyRepo = SurveyRepository(application)
    private val inventoryRepo = InventoryRepository(application)
    private val designRepo = DesignRepository(application)

    val session: StateFlow<EmployeeSessionEntity?> = userRepo.getSessionFlow()
        .stateIn(viewModelScope, SharingStarted.Lazily, null)

    val tasks: StateFlow<List<EmployeeTaskEntity>> = taskRepo.getAllTasks()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val inventory: StateFlow<List<InventoryItemEntity>> = inventoryRepo.getAllItems()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val commits: StateFlow<List<DailyCommitEntity>> = attendanceRepo.getAllCommits()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val surveys: StateFlow<List<SiteSurveyEntity>> = surveyRepo.getAllSurveys()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Tracks breaks
    private val _isBreakActive = MutableStateFlow(false)
    val isBreakActive = _isBreakActive.asStateFlow()

    private var breakStartTimeMillis: Long = 0

    // Observes today's attendance record
    val todayAttendance: StateFlow<AttendanceRecordEntity?> = session.flatMapLatest { s ->
        if (s != null) {
            attendanceRepo.getTodayRecord(getCurrentDateString())
        } else {
            flowOf(null)
        }
    }.stateIn(viewModelScope, SharingStarted.Lazily, null)

    fun login(emailOrPhone: String, code: String, isOtpMode: Boolean, onResult: (Result<EmployeeSessionEntity>) -> Unit) {
        viewModelScope.launch {
            val mode = if (isOtpMode) "OTP" else "PASSCODE"
            val result = userRepo.login(emailOrPhone, code, mode)
            onResult(result)
        }
    }

    fun logout() {
        viewModelScope.launch {
            userRepo.logout()
        }
    }

    fun checkIn(latitude: Double, longitude: Double, onResult: (Long) -> Unit) {
        viewModelScope.launch {
            val localId = attendanceRepo.checkIn(latitude, longitude)
            onResult(localId)
        }
    }

    fun checkOut(latitude: Double, longitude: Double) {
        viewModelScope.launch {
            attendanceRepo.checkOut(latitude, longitude)
        }
    }

    fun startBreak() {
        _isBreakActive.value = true
        breakStartTimeMillis = System.currentTimeMillis()
    }

    fun endBreak() {
        if (_isBreakActive.value) {
            _isBreakActive.value = false
            val elapsedSeconds = (System.currentTimeMillis() - breakStartTimeMillis) / 1000
            viewModelScope.launch {
                attendanceRepo.updateBreakDuration(elapsedSeconds)
            }
        }
    }

    fun submitDailyWork(title: String, description: String, hours: Double, taskId: String, onResult: (Long) -> Unit) {
        viewModelScope.launch {
            val localId = attendanceRepo.submitDailyWorkCommit(title, description, hours, taskId)
            onResult(localId)
        }
    }

    fun updateTaskStatus(taskId: Int, status: String) {
        viewModelScope.launch {
            taskRepo.updateTaskStatus(taskId, status)
        }
    }

    fun completeTask(taskId: Int, completionMessage: String, documentUrl: String?) {
        viewModelScope.launch {
            taskRepo.completeTask(taskId, completionMessage, documentUrl)
        }
    }

    fun submitSurvey(
        taskId: Int,
        customerId: String,
        roofType: String,
        lengthFt: Double,
        widthFt: Double,
        obstacleNotes: String,
        shadowFactorsJson: String,
        recommendedCapacity: Double,
        latitude: Double,
        longitude: Double,
        localPhotoPaths: List<String>
    ) {
        viewModelScope.launch {
            surveyRepo.submitSurvey(
                taskId, customerId, roofType, lengthFt, widthFt,
                obstacleNotes, shadowFactorsJson, recommendedCapacity,
                latitude, longitude, localPhotoPaths
            )
        }
    }

    fun submitDesign(
        customerId: String,
        panelCount: Int,
        inverterModel: String,
        systemCapacityKw: Double,
        tiltAngle: Double,
        cadLayoutPath: String?,
        sldDiagramPath: String?
    ) {
        viewModelScope.launch {
            designRepo.submitDesign(
                customerId, panelCount, inverterModel, systemCapacityKw, tiltAngle,
                cadLayoutPath, sldDiagramPath
            )
        }
    }

    fun issueInventory(itemId: String, quantity: Double, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = inventoryRepo.issueStock(itemId, quantity)
            onResult(success)
        }
    }

    fun adjustStock(itemId: String, quantity: Double) {
        viewModelScope.launch {
            inventoryRepo.adjustStockOffline(itemId, quantity)
        }
    }

    fun assignTaskLocally(task: EmployeeTaskEntity) {
        viewModelScope.launch {
            taskRepo.assignTaskLocally(task)
        }
    }

    fun addInventoryItem(item: InventoryItemEntity) {
        viewModelScope.launch {
            inventoryRepo.insertItem(item)
        }
    }

    private fun getCurrentDateString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }
}
