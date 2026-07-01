package com.example.swayogemployeeapp.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import com.example.swayogemployeeapp.data.local.entity.ApartmentEntity
import com.example.swayogemployeeapp.data.local.entity.AttendanceRecordEntity
import com.example.swayogemployeeapp.data.local.entity.CustomerEntity
import com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity
import com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity
import com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity
import com.example.swayogemployeeapp.data.local.entity.ElectricalDesignEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeSessionEntity
import com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity
import com.example.swayogemployeeapp.data.local.entity.InvoiceEntity
import com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.local.entity.PaymentEntity
import com.example.swayogemployeeapp.data.local.entity.PerformanceSnapshotEntity
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity
import com.example.swayogemployeeapp.data.local.entity.TaskAssignmentEntity
import com.example.swayogemployeeapp.data.local.entity.TaskImageEntity
import com.example.swayogemployeeapp.data.repository.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
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

    fun fetchSupervisorFeedback(employeeId: String? = null) {
        viewModelScope.launch {
            val list = attendanceRepo.getWorkSubmissions(employeeId)
            _supervisorFeedback.value = list
        }
    }

    private val _internalUsers = MutableStateFlow<List<com.example.swayogemployeeapp.data.remote.InternalUserDto>>(emptyList())
    val internalUsers = _internalUsers.asStateFlow()

    private val _internalUsersLoading = MutableStateFlow(false)
    val internalUsersLoading = _internalUsersLoading.asStateFlow()

    fun fetchInternalUsers() {
        viewModelScope.launch {
            _internalUsersLoading.value = true
            val result = userRepo.getInternalUsers()
            result.onSuccess {
                _internalUsers.value = it
            }.onFailure {
                it.printStackTrace()
            }
            _internalUsersLoading.value = false
        }
    }

    private val _teamSubmissions = MutableStateFlow<List<com.example.swayogemployeeapp.data.remote.WorkSubmissionDto>>(emptyList())
    val teamSubmissions = _teamSubmissions.asStateFlow()

    fun fetchTeamSubmissions() {
        viewModelScope.launch {
            val list = attendanceRepo.getPendingSubmissions()
            _teamSubmissions.value = list
        }
    }

    fun reviewSubmission(
        id: String,
        status: String,
        score: Int?,
        notes: String?,
        onResult: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            val result = attendanceRepo.reviewWorkSubmission(id, status, score, notes)
            if (result.isSuccess) {
                fetchTeamSubmissions()
            }
            onResult(result)
        }
    }

    fun submitDailyCommit(
        date: String,
        taskWorkedOn: String,
        workSummary: String,
        hoursSpent: Double,
        issuesBlockers: String?,
        tomorrowPlan: String?,
        onResult: (Result<Unit>) -> Unit
    ) {
        viewModelScope.launch {
            val result = attendanceRepo.submitDailyCommit(date, taskWorkedOn, workSummary, hoursSpent, issuesBlockers, tomorrowPlan)
            onResult(result)
        }
    }

    private val userRepo = UserRepository(application)
    private val attendanceRepo = AttendanceRepository(application)
    private val taskRepo = TaskRepository(application)
    private val surveyRepo = SurveyRepository(application)
    private val inventoryRepo = InventoryRepository(application)
    private val designRepo = DesignRepository(application)

    private val customerDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).customerDao()
    private val dispatchRecordDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).dispatchRecordDao()
    private val solarDesignDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).solarDesignDao()
    private val electricalDesignDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).electricalDesignDao()
    private val apartmentDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).apartmentDao()
    private val invoiceDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).invoiceDao()
    private val paymentDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).paymentDao()
    private val taskAssignmentDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).taskAssignmentDao()
    private val taskImageDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).taskImageDao()
    private val customerNotificationDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).customerNotificationDao()
    private val performanceSnapshotDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).performanceSnapshotDao()

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

    val localCustomers: StateFlow<List<CustomerEntity>> = customerDao.getAllCustomers()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val dispatchRecords: StateFlow<List<DispatchRecordEntity>> = dispatchRecordDao.getAllDispatchRecords()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val solarDesigns: StateFlow<List<SolarDesignEntity>> = solarDesignDao.getAllSolarDesigns()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val electricalDesigns: StateFlow<List<ElectricalDesignEntity>> = electricalDesignDao.getAllElectricalDesigns()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val apartments: StateFlow<List<ApartmentEntity>> = apartmentDao.getAllApartments()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val invoices: StateFlow<List<InvoiceEntity>> = invoiceDao.getAllInvoices()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val payments: StateFlow<List<PaymentEntity>> = paymentDao.getAllPayments()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val taskAssignments: StateFlow<List<TaskAssignmentEntity>> = taskAssignmentDao.getAllTaskAssignments()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val taskImages: StateFlow<List<TaskImageEntity>> = taskImageDao.getAllTaskImages()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val customerNotifications: StateFlow<List<CustomerNotificationEntity>> = customerNotificationDao.getAllCustomerNotifications()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val performanceSnapshots: StateFlow<List<PerformanceSnapshotEntity>> = performanceSnapshotDao.getAllPerformanceSnapshots()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Outbox queue count for sync health monitoring
    private val outboxDao = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(application).outboxQueueDao()
    val outboxCount: StateFlow<Int> = outboxDao.getQueueFlow()
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.Lazily, 0)

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

    val isSyncing = MutableStateFlow(false)
    
    private val enhancedSyncManager = com.example.swayogemployeeapp.data.sync.EnhancedSyncManager.getInstance(application)
    val syncStatus = enhancedSyncManager.syncStatus

    fun syncAllDataFromServer(onComplete: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            isSyncing.value = true
            try {
                taskRepo.syncTasksFromServer()
                inventoryRepo.syncInventoryFromServer()
                syncCustomersFromServer()
                fetchInternalUsers()
                com.example.swayogemployeeapp.data.sync.SyncManager.enqueueSync(getApplication())
                onComplete(true)
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete(false)
            } finally {
                isSyncing.value = false
            }
        }
    }
    
    /**
     * Enhanced sync based on user role
     */
    fun syncForRole(role: String, forceRefresh: Boolean = false, onComplete: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            isSyncing.value = true
            try {
                val result = enhancedSyncManager.syncForRole(role, forceRefresh)
                onComplete(result is com.example.swayogemployeeapp.data.sync.SyncResult.Success)
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete(false)
            } finally {
                isSyncing.value = false
            }
        }
    }
    
    /**
     * Start polling for specific data types
     */
    fun startPolling(vararg dataTypes: com.example.swayogemployeeapp.data.sync.DataType) {
        dataTypes.forEach { dataType ->
            enhancedSyncManager.startPolling(dataType, 30000L)
        }
    }
    
    /**
     * Stop polling for specific data types
     */
    fun stopPolling(vararg dataTypes: com.example.swayogemployeeapp.data.sync.DataType) {
        dataTypes.forEach { dataType ->
            enhancedSyncManager.stopPolling(dataType)
        }
    }
    
    /**
     * Invalidate cache and trigger sync
     */
    fun invalidateCache(dataType: com.example.swayogemployeeapp.data.sync.DataType) {
        viewModelScope.launch {
            enhancedSyncManager.invalidateCache(dataType)
        }
    }

    private suspend fun syncCustomersFromServer() {
        try {
            val apiService = com.example.swayogemployeeapp.data.remote.NetworkClient.getApiService(getApplication())
            val response = apiService.listCustomers()
            if (response.isSuccessful) {
                val customerList = response.body() ?: emptyList()
                val db = com.example.swayogemployeeapp.data.local.AppDatabase.getDatabase(getApplication())
                val entities = customerList.map { dto ->
                    CustomerEntity(
                        id = dto.id,
                        customerCode = dto.customerCode ?: "CUST-${dto.id}",
                        fullName = dto.displayName(),
                        email = dto.email ?: "",
                        phoneNumber = dto.displayPhone(),
                        city = dto.city ?: "",
                        address = dto.address ?: "",
                        systemSizeKw = dto.systemSizeKw ?: 0.0,
                        installationDate = dto.installationDate ?: "",
                        warrantyExpiry = null,
                        panelBrand = null,
                        inverterBrand = dto.inverterBrand,
                        inverterModel = null,
                        amcStatus = dto.amcStatus ?: "none",
                        amcExpiryDate = null,
                        status = dto.status ?: "active",
                        partnerId = null,
                        userId = null,
                        projectStage = dto.projectStage ?: 0,
                        assignedEmployeeId = null,
                        commissionAmount = null,
                        commissionStatus = "pending",
                        inverterLoginId = dto.inverterLoginId,
                        inverterPassword = dto.inverterPassword,
                        inverterApiKey = dto.inverterApiKey,
                        inverterDeviceSn = dto.inverterDeviceSn,
                        portalPassword = null,
                        latitude = null,
                        longitude = null,
                        cleaningWindow1 = null,
                        cleaningWindow2 = null,
                        cleaningWindow3 = null,
                        cleaningsPerMonth = dto.cleaningsPerMonth,
                        clientType = null,
                        consumerNumber = null,
                        contractEndDate = null,
                        contractStartDate = null,
                        monthlyCleaningRate = null,
                        paymentTerms = null,
                        remarks = null,
                        cleaningWindow4 = null,
                        cleaningWindow5 = null,
                        cleaningWindow6 = null,
                        cleaningWindow7 = null,
                        cleaningWindow8 = null,
                        commissionProofUrl = null,
                        commissionPaidAt = null,
                        apartmentId = null,
                        isSynced = true
                    )
                }
                if (entities.isNotEmpty()) {
                    db.customerDao().insertCustomers(entities)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun login(emailOrPhone: String, code: String, isOtpMode: Boolean, onResult: (Result<EmployeeSessionEntity>) -> Unit) {
        viewModelScope.launch {
            val mode = if (isOtpMode) "OTP" else "PASSCODE"
            val result = userRepo.login(emailOrPhone, code, mode)
            result.onSuccess { session ->
                // Use role-based sync instead of generic sync
                syncForRole(session.jobRole ?: "employee", forceRefresh = true)
            }
            onResult(result)
        }
    }

    fun lookupEmployee(identifier: String, onResult: (Result<com.example.swayogemployeeapp.data.remote.LookupEmployeeResponse>) -> Unit) {
        viewModelScope.launch {
            val result = userRepo.lookupEmployee(identifier)
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

    fun forceSync() {
        viewModelScope.launch {
            com.example.swayogemployeeapp.data.sync.SyncManager.enqueueSync(getApplication())
        }
    }

    // ── Customer Operations ──

    fun insertCustomer(customer: CustomerEntity) {
        viewModelScope.launch {
            customerDao.insertCustomer(customer)
        }
    }

    fun insertCustomers(customers: List<CustomerEntity>) {
        viewModelScope.launch {
            customerDao.insertCustomers(customers)
        }
    }

    // ── Dispatch Record Operations ──

    fun createDispatchRecord(record: DispatchRecordEntity) {
        viewModelScope.launch {
            dispatchRecordDao.insertDispatchRecord(record)
        }
    }

    // ── Solar Design Operations ──

    fun createSolarDesign(design: SolarDesignEntity) {
        viewModelScope.launch {
            solarDesignDao.insertSolarDesign(design)
        }
    }

    fun updateSolarDesign(design: SolarDesignEntity) {
        viewModelScope.launch {
            solarDesignDao.updateSolarDesign(design)
        }
    }

    // ── Electrical Design Operations ──

    fun createElectricalDesign(design: ElectricalDesignEntity) {
        viewModelScope.launch {
            electricalDesignDao.insertElectricalDesign(design)
        }
    }

    fun updateElectricalDesign(design: ElectricalDesignEntity) {
        viewModelScope.launch {
            electricalDesignDao.updateElectricalDesign(design)
        }
    }

    private fun getCurrentDateString(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }

    // ── Apartment Operations ──

    fun insertApartment(apartment: ApartmentEntity) {
        viewModelScope.launch {
            apartmentDao.insertApartment(apartment)
        }
    }

    // ── Invoice Operations ──

    fun insertInvoice(invoice: InvoiceEntity) {
        viewModelScope.launch {
            invoiceDao.insertInvoice(invoice)
        }
    }

    // ── Payment Operations ──

    fun insertPayment(payment: PaymentEntity) {
        viewModelScope.launch {
            paymentDao.insertPayment(payment)
        }
    }

    // ── Task Assignment Operations ──

    fun insertTaskAssignment(assignment: TaskAssignmentEntity) {
        viewModelScope.launch {
            taskAssignmentDao.insertTaskAssignment(assignment)
        }
    }

    // ── Task Image Operations ──

    fun insertTaskImage(image: TaskImageEntity) {
        viewModelScope.launch {
            taskImageDao.insertTaskImage(image)
        }
    }

    // ── Customer Notification Operations ──

    fun insertCustomerNotification(notification: CustomerNotificationEntity) {
        viewModelScope.launch {
            customerNotificationDao.insertCustomerNotification(notification)
        }
    }

    fun markNotificationAsRead(notification: CustomerNotificationEntity) {
        viewModelScope.launch {
            customerNotificationDao.updateCustomerNotification(notification.copy(isRead = true))
        }
    }

    // ── Performance Snapshot Operations ──

    fun insertPerformanceSnapshot(snapshot: PerformanceSnapshotEntity) {
        viewModelScope.launch {
            performanceSnapshotDao.insertPerformanceSnapshot(snapshot)
        }
    }
}
