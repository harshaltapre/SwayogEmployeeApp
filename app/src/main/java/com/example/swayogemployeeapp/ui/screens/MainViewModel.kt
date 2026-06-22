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
import com.example.swayogemployeeapp.data.remote.WorkSubmissionDto

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val _supervisorFeedback = MutableStateFlow<List<WorkSubmissionDto>>(emptyList())
    val supervisorFeedback = _supervisorFeedback.asStateFlow()

    fun fetchSupervisorFeedback() {
        viewModelScope.launch {
            val list = attendanceRepo.getWorkSubmissions()
            _supervisorFeedback.value = list
        }
    }

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

    // ── Service Coordinator (Sub-Admin) state ──

    private val _customers = MutableStateFlow<List<com.example.swayogemployeeapp.data.remote.CustomerDto>>(emptyList())
    val customers = _customers.asStateFlow()

    private val _customersLoading = MutableStateFlow(false)
    val customersLoading = _customersLoading.asStateFlow()

    private val _selectedCustomerSummary = MutableStateFlow<com.example.swayogemployeeapp.data.remote.CustomerSummaryResponse?>(null)
    val selectedCustomerSummary = _selectedCustomerSummary.asStateFlow()

    private val _inverterGeneration = MutableStateFlow<com.example.swayogemployeeapp.data.remote.InverterGenerationResponse?>(null)
    val inverterGeneration = _inverterGeneration.asStateFlow()

    private val _inverterError = MutableStateFlow<String?>(null)
    val inverterError = _inverterError.asStateFlow()

    private val apiService = com.example.swayogemployeeapp.data.remote.NetworkClient.getApiService(application)

    fun fetchCustomers(city: String? = null) {
        viewModelScope.launch {
            _customersLoading.value = true
            try {
                val response = apiService.listCustomers(limit = 200, city = city)
                if (response.isSuccessful) {
                    _customers.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // Keep existing list on error
            } finally {
                _customersLoading.value = false
            }
        }
    }

    fun fetchCustomerSummary(customerId: Int) {
        viewModelScope.launch {
            try {
                val response = apiService.getCustomerSummary(customerId)
                if (response.isSuccessful) {
                    _selectedCustomerSummary.value = response.body()
                }
            } catch (_: Exception) {}
        }
    }

    fun fetchInverterGeneration(customerId: Int) {
        viewModelScope.launch {
            _inverterError.value = null
            try {
                val response = apiService.getCustomerInverterGeneration(customerId)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.dataUnavailable == true) {
                        _inverterError.value = body.unavailableReason ?: "Inverter data unavailable"
                        _inverterGeneration.value = null
                    } else {
                        _inverterGeneration.value = body
                    }
                } else {
                    _inverterError.value = "Failed to fetch inverter data (${response.code()})"
                    _inverterGeneration.value = null
                }
            } catch (e: Exception) {
                _inverterError.value = "Network error: ${e.message}"
                _inverterGeneration.value = null
            }
        }
    }

    fun updateCustomerCredentials(
        customerId: Int,
        brand: String?,
        loginId: String?,
        password: String?,
        apiKey: String?,
        deviceSn: String?,
        onResult: (Boolean, String?) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val request = com.example.swayogemployeeapp.data.remote.UpdateCredentialsRequest(
                    inverterBrand = brand,
                    inverterLoginId = loginId,
                    inverterPassword = password,
                    inverterApiKey = apiKey,
                    inverterDeviceSn = deviceSn
                )
                val response = apiService.updateCustomerCredentials(customerId, request)
                if (response.isSuccessful) {
                    onResult(true, null)
                    // Refresh data
                    fetchCustomerSummary(customerId)
                    fetchInverterGeneration(customerId)
                    fetchCustomers()
                } else {
                    onResult(false, "Failed to update credentials (${response.code()})")
                }
            } catch (e: Exception) {
                onResult(false, "Network error: ${e.message}")
            }
        }
    }

    private fun getCurrentDateString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }
}
