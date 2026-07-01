package com.example.swayogemployeeapp.data.sync

import android.app.Application
import android.content.Context
import androidx.work.*
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.remote.NetworkClient
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.TimeUnit

/**
 * Enhanced Sync Manager with polling, cache invalidation, and role-based sync strategies
 * Mirrors the web dashboard's usePollWithVisibility and useCacheInvalidation hooks
 */
class EnhancedSyncManager private constructor(private val application: Application) {
    
    private val db = AppDatabase.getDatabase(application)
    private val apiService = NetworkClient.getApiService(application)
    
    // Sync status tracking
    private val _syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()
    
    // Last sync timestamps for each data type
    private val lastSyncTimes = mutableMapOf<DataType, Long>()
    
    // Polling jobs
    private val pollingJobs = mutableMapOf<DataType, Job>()
    
    // App visibility state
    private var isAppVisible = true
    
    /**
     * Sync data based on user role
     */
    suspend fun syncForRole(role: String, forceRefresh: Boolean = false): SyncResult {
        _syncStatus.value = SyncStatus.Syncing
        
        return try {
            val results = mutableListOf<DataType>()
            
            when (role.lowercase()) {
                "admin", "service coordinator", "sub-admin" -> {
                    // Admin/Sub-Admin sync
                    syncCustomers(forceRefresh)
                    syncTasks(forceRefresh)
                    syncEmployees(forceRefresh)
                    syncInvoices(forceRefresh)
                    syncPayments(forceRefresh)
                    syncAmcVisits(forceRefresh)
                    syncServiceRequests(forceRefresh)
                    results.addAll(listOf(
                        DataType.CUSTOMERS, DataType.TASKS, DataType.EMPLOYEES,
                        DataType.INVOICES, DataType.PAYMENTS, DataType.AMC_VISITS,
                        DataType.SERVICE_REQUESTS
                    ))
                }
                "super admin" -> {
                    // Super Admin sync - all data
                    syncCustomers(forceRefresh)
                    syncEmployees(forceRefresh)
                    syncInternalUsers(forceRefresh)
                    syncInventory(forceRefresh)
                    syncInvoices(forceRefresh)
                    syncPayments(forceRefresh)
                    syncPartners(forceRefresh)
                    syncSystemStats(forceRefresh)
                    results.addAll(listOf(
                        DataType.CUSTOMERS, DataType.EMPLOYEES, DataType.INTERNAL_USERS,
                        DataType.INVENTORY, DataType.INVOICES, DataType.PAYMENTS,
                        DataType.PARTNERS, DataType.SYSTEM_STATS
                    ))
                }
                "customer" -> {
                    // Customer sync
                    syncCustomerInstallation(forceRefresh)
                    syncCustomerDispatches(forceRefresh)
                    syncCustomerTasks(forceRefresh)
                    syncCustomerNotifications(forceRefresh)
                    results.addAll(listOf(
                        DataType.CUSTOMER_INSTALLATION, DataType.CUSTOMER_DISPATCHES,
                        DataType.CUSTOMER_TASKS, DataType.CUSTOMER_NOTIFICATIONS
                    ))
                }
                "employee", "field technician", "intern" -> {
                    // Employee sync
                    syncTasks(forceRefresh)
                    syncSurveys(forceRefresh)
                    syncDesigns(forceRefresh)
                    syncAttendance(forceRefresh)
                    syncDailyCommits(forceRefresh)
                    results.addAll(listOf(
                        DataType.TASKS, DataType.SURVEYS, DataType.DESIGNS,
                        DataType.ATTENDANCE, DataType.DAILY_COMMITS
                    ))
                }
                else -> {
                    // Default sync
                    syncTasks(forceRefresh)
                    syncCustomers(forceRefresh)
                    results.addAll(listOf(DataType.TASKS, DataType.CUSTOMERS))
                }
            }
            
            _syncStatus.value = SyncStatus.Success(results)
            SyncResult.Success(results)
        } catch (e: Exception) {
            _syncStatus.value = SyncStatus.Error(e.message ?: "Unknown error")
            SyncResult.Error(e.message ?: "Unknown error")
        }
    }
    
    /**
     * Start polling for specific data type
     */
    fun startPolling(dataType: DataType, intervalMs: Long = 30000L) {
        stopPolling(dataType)
        
        pollingJobs[dataType] = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                if (isAppVisible) {
                    try {
                        syncDataType(dataType, forceRefresh = false)
                    } catch (e: Exception) {
                        // Log error but continue polling
                    }
                }
                delay(intervalMs)
            }
        }
        
        lastSyncTimes[dataType] = System.currentTimeMillis()
    }
    
    /**
     * Stop polling for specific data type
     */
    fun stopPolling(dataType: DataType) {
        pollingJobs[dataType]?.cancel()
        pollingJobs.remove(dataType)
    }
    
    /**
     * Resume all polling jobs
     */
    private fun resumePolling() {
        pollingJobs.forEach { (dataType, job) ->
            if (job.isCancelled) {
                // Restart polling with default interval
                startPolling(dataType, 30000L)
            }
        }
    }
    
    /**
     * Pause all polling jobs
     */
    private fun pausePolling() {
        pollingJobs.forEach { (_, job) ->
            job.cancel()
        }
    }
    
    /**
     * Invalidate cache for specific data type and trigger sync
     */
    suspend fun invalidateCache(dataType: DataType) {
        lastSyncTimes.remove(dataType)
        syncDataType(dataType, forceRefresh = true)
    }
    
    /**
     * Sync specific data type
     */
    private suspend fun syncDataType(dataType: DataType, forceRefresh: Boolean) {
        when (dataType) {
            DataType.CUSTOMERS -> syncCustomers(forceRefresh)
            DataType.TASKS -> syncTasks(forceRefresh)
            DataType.EMPLOYEES -> syncEmployees(forceRefresh)
            DataType.INVENTORY -> syncInventory(forceRefresh)
            DataType.INVOICES -> syncInvoices(forceRefresh)
            DataType.PAYMENTS -> syncPayments(forceRefresh)
            DataType.AMC_VISITS -> syncAmcVisits(forceRefresh)
            DataType.SERVICE_REQUESTS -> syncServiceRequests(forceRefresh)
            DataType.INTERNAL_USERS -> syncInternalUsers(forceRefresh)
            DataType.PARTNERS -> syncPartners(forceRefresh)
            DataType.SYSTEM_STATS -> syncSystemStats(forceRefresh)
            DataType.CUSTOMER_INSTALLATION -> syncCustomerInstallation(forceRefresh)
            DataType.CUSTOMER_DISPATCHES -> syncCustomerDispatches(forceRefresh)
            DataType.CUSTOMER_TASKS -> syncCustomerTasks(forceRefresh)
            DataType.CUSTOMER_NOTIFICATIONS -> syncCustomerNotifications(forceRefresh)
            DataType.SURVEYS -> syncSurveys(forceRefresh)
            DataType.DESIGNS -> syncDesigns(forceRefresh)
            DataType.ATTENDANCE -> syncAttendance(forceRefresh)
            DataType.DAILY_COMMITS -> syncDailyCommits(forceRefresh)
        }
        lastSyncTimes[dataType] = System.currentTimeMillis()
    }
    
    // Individual sync methods
    
    private suspend fun syncCustomers(forceRefresh: Boolean) {
        if (!shouldSync(DataType.CUSTOMERS, forceRefresh)) return
        
        val response = apiService.listCustomers(limit = 500)
        if (response.isSuccessful) {
            val customers = response.body() ?: emptyList()
            val entities = customers.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.CustomerEntity(
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
            db.customerDao().insertCustomers(entities)
        }
    }
    
    private suspend fun syncTasks(forceRefresh: Boolean) {
        if (!shouldSync(DataType.TASKS, forceRefresh)) return
        
        val response = apiService.getMyTasks()
        if (response.isSuccessful) {
            val tasks = response.body()?.data?.tasks ?: emptyList()
            val entities = tasks.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.EmployeeTaskEntity(
                    id = dto.id,
                    jobType = dto.jobType,
                    description = dto.description,
                    customerName = dto.customerName,
                    customerPhone = dto.customerPhone,
                    address = dto.address,
                    latitude = dto.latitude,
                    longitude = dto.longitude,
                    status = dto.status,
                    scheduledTime = dto.scheduledTime ?: "",
                    employeeUserId = null,
                    completionMessage = null,
                    completionDocumentUrl = null,
                    completedAt = null,
                    isSynced = true
                )
            }
            db.employeeTaskDao().insertAll(entities)
        }
    }
    
    private suspend fun syncEmployees(forceRefresh: Boolean) {
        if (!shouldSync(DataType.EMPLOYEES, forceRefresh)) return
        
        val response = apiService.getInternalUsers(limit = 300)
        if (response.isSuccessful) {
            val users = response.body() ?: emptyList()
            // Store as internal users - would need EmployeeEntity mapping
        }
    }
    
    private suspend fun syncInventory(forceRefresh: Boolean) {
        if (!shouldSync(DataType.INVENTORY, forceRefresh)) return
        
        val response = apiService.getInventory()
        if (response.isSuccessful) {
            val items = response.body() ?: emptyList()
            val entities = items.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.InventoryItemEntity(
                    id = dto.id.toString(),
                    itemName = dto.name,
                    category = dto.category,
                    quantityInStock = dto.inStock,
                    unit = "pcs",
                    qrCodeHash = dto.sku,
                    isSynced = true
                )
            }
            db.inventoryItemDao().insertAll(entities)
        }
    }
    
    private suspend fun syncInvoices(forceRefresh: Boolean) {
        if (!shouldSync(DataType.INVOICES, forceRefresh)) return
        
        val response = apiService.getInvoices()
        if (response.isSuccessful) {
            val invoices = response.body() ?: emptyList()
            val entities = invoices.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.InvoiceEntity(
                    id = dto.id,
                    invoiceNumber = dto.invoiceNumber,
                    customerId = dto.customerId,
                    invoiceType = dto.invoiceType,
                    amount = dto.amount,
                    paymentStatus = dto.paymentStatus,
                    amountPaid = dto.amountPaid,
                    invoiceDate = dto.invoiceDate,
                    paymentDate = dto.paymentDate,
                    zone = dto.zone,
                    state = dto.state,
                    partnerId = dto.partnerId,
                    createdAt = dto.createdAt,
                    updatedAt = dto.updatedAt,
                    description = dto.description,
                    paymentMethod = dto.paymentMethod,
                    proofUrl = dto.proofUrl,
                    isSynced = true
                )
            }
            db.invoiceDao().insertInvoices(entities)
        }
    }
    
    private suspend fun syncPayments(forceRefresh: Boolean) {
        if (!shouldSync(DataType.PAYMENTS, forceRefresh)) return
        
        val response = apiService.getPayments()
        if (response.isSuccessful) {
            val payments = response.body() ?: emptyList()
            val entities = payments.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.PaymentEntity(
                    id = dto.id,
                    taskId = dto.taskId,
                    customerId = dto.customerId,
                    amount = dto.amount,
                    paymentMethod = dto.paymentMethod,
                    paymentStatus = dto.paymentStatus,
                    transactionId = dto.transactionId,
                    paidBy = dto.paidBy,
                    paidAt = dto.paidAt,
                    processedBy = dto.processedBy,
                    notes = dto.notes,
                    createdAt = dto.createdAt,
                    updatedAt = dto.updatedAt,
                    isSynced = true
                )
            }
            db.paymentDao().insertPayments(entities)
        }
    }
    
    private suspend fun syncAmcVisits(forceRefresh: Boolean) {
        if (!shouldSync(DataType.AMC_VISITS, forceRefresh)) return
        // Implement AMC visits sync
    }
    
    private suspend fun syncServiceRequests(forceRefresh: Boolean) {
        if (!shouldSync(DataType.SERVICE_REQUESTS, forceRefresh)) return
        // Implement service requests sync
    }
    
    private suspend fun syncInternalUsers(forceRefresh: Boolean) {
        if (!shouldSync(DataType.INTERNAL_USERS, forceRefresh)) return
        syncEmployees(forceRefresh)
    }
    
    private suspend fun syncPartners(forceRefresh: Boolean) {
        if (!shouldSync(DataType.PARTNERS, forceRefresh)) return
        // Implement partners sync
    }
    
    private suspend fun syncSystemStats(forceRefresh: Boolean) {
        if (!shouldSync(DataType.SYSTEM_STATS, forceRefresh)) return
        // Implement system stats sync
    }
    
    private suspend fun syncCustomerInstallation(forceRefresh: Boolean) {
        if (!shouldSync(DataType.CUSTOMER_INSTALLATION, forceRefresh)) return
        // Implement customer installation sync
    }
    
    private suspend fun syncCustomerDispatches(forceRefresh: Boolean) {
        if (!shouldSync(DataType.CUSTOMER_DISPATCHES, forceRefresh)) return
        
        val response = apiService.getDispatchRecords()
        if (response.isSuccessful) {
            val records = response.body() ?: emptyList()
            val entities = records.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.DispatchRecordEntity(
                    id = dto.id,
                    customerId = dto.customerId,
                    itemId = dto.itemId,
                    quantity = dto.quantity,
                    dispatchedAt = dto.dispatchedAt,
                    notes = dto.notes,
                    isSynced = true
                )
            }
            db.dispatchRecordDao().insertDispatchRecords(entities)
        }
    }
    
    private suspend fun syncCustomerTasks(forceRefresh: Boolean) {
        syncTasks(forceRefresh)
    }
    
    private suspend fun syncCustomerNotifications(forceRefresh: Boolean) {
        if (!shouldSync(DataType.CUSTOMER_NOTIFICATIONS, forceRefresh)) return
        
        val response = apiService.getCustomerNotifications()
        if (response.isSuccessful) {
            val notifications = response.body() ?: emptyList()
            val entities = notifications.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.CustomerNotificationEntity(
                    id = dto.id,
                    customerId = dto.customerId,
                    type = dto.type,
                    message = dto.message,
                    taskId = dto.taskId,
                    imageUrl = dto.imageUrl,
                    isRead = dto.isRead,
                    createdAt = dto.createdAt,
                    isSynced = true
                )
            }
            db.customerNotificationDao().insertCustomerNotifications(entities)
        }
    }
    
    private suspend fun syncSurveys(forceRefresh: Boolean) {
        if (!shouldSync(DataType.SURVEYS, forceRefresh)) return
        // Implement surveys sync
    }
    
    private suspend fun syncDesigns(forceRefresh: Boolean) {
        if (!shouldSync(DataType.DESIGNS, forceRefresh)) return
        
        val solarResponse = apiService.getSolarDesigns()
        if (solarResponse.isSuccessful) {
            val designs = solarResponse.body() ?: emptyList()
            val entities = designs.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.SolarDesignEntity(
                    id = dto.id,
                    customerId = dto.customerId,
                    engineerId = dto.engineerId,
                    panelCount = dto.panelCount,
                    inverterModel = dto.inverterModel,
                    systemCapacityKw = dto.systemCapacityKw,
                    tiltAngle = dto.tiltAngle,
                    cadLayoutPath = dto.cadLayoutPath,
                    sldDiagramPath = dto.sldDiagramPath,
                    designStatus = dto.designStatus,
                    submittedAt = dto.submittedAt,
                    reviewedAt = dto.reviewedAt,
                    reviewedBy = dto.reviewedBy,
                    reviewNotes = dto.reviewNotes,
                    isSynced = true
                )
            }
            db.solarDesignDao().insertSolarDesigns(entities)
        }
    }
    
    private suspend fun syncAttendance(forceRefresh: Boolean) {
        if (!shouldSync(DataType.ATTENDANCE, forceRefresh)) return
        // Attendance is synced via check-in/out, not polling
    }
    
    private suspend fun syncDailyCommits(forceRefresh: Boolean) {
        if (!shouldSync(DataType.DAILY_COMMITS, forceRefresh)) return
        
        val response = apiService.getMyDailyCommits()
        if (response.isSuccessful) {
            val commits = response.body() ?: emptyList()
            val entities = commits.map { dto ->
                com.example.swayogemployeeapp.data.local.entity.DailyCommitEntity(
                    localId = 0,
                    remoteId = dto.id,
                    date = dto.commitDate,
                    taskDescription = dto.taskWorkedOn,
                    hoursSpent = dto.hoursSpent,
                    isSynced = true
                )
            }
            db.dailyCommitDao().insertAll(entities)
        }
    }
    
    /**
     * Check if data should be synced based on last sync time
     */
    private fun shouldSync(dataType: DataType, forceRefresh: Boolean): Boolean {
        if (forceRefresh) return true
        val lastSync = lastSyncTimes[dataType] ?: 0
        val now = System.currentTimeMillis()
        val syncInterval = when (dataType) {
            DataType.TASKS, DataType.ATTENDANCE -> 15000L // 15 seconds for real-time data
            DataType.CUSTOMER_NOTIFICATIONS -> 20000L // 20 seconds
            DataType.INVENTORY -> 60000L // 1 minute
            else -> 30000L // 30 seconds default
        }
        return (now - lastSync) > syncInterval
    }
    
    /**
     * Cleanup polling jobs
     */
    fun cleanup() {
        pollingJobs.values.forEach { it.cancel() }
        pollingJobs.clear()
    }
    
    companion object {
        @Volatile
        private var INSTANCE: EnhancedSyncManager? = null
        
        fun getInstance(application: Application): EnhancedSyncManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: EnhancedSyncManager(application).also { INSTANCE = it }
            }
        }
    }
}

/**
 * Data types that can be synced
 */
enum class DataType {
    CUSTOMERS,
    TASKS,
    EMPLOYEES,
    INVENTORY,
    INVOICES,
    PAYMENTS,
    AMC_VISITS,
    SERVICE_REQUESTS,
    INTERNAL_USERS,
    PARTNERS,
    SYSTEM_STATS,
    CUSTOMER_INSTALLATION,
    CUSTOMER_DISPATCHES,
    CUSTOMER_TASKS,
    CUSTOMER_NOTIFICATIONS,
    SURVEYS,
    DESIGNS,
    ATTENDANCE,
    DAILY_COMMITS
}

/**
 * Sync status
 */
sealed class SyncStatus {
    object Idle : SyncStatus()
    object Syncing : SyncStatus()
    data class Success(val syncedTypes: List<DataType>) : SyncStatus()
    data class Error(val message: String) : SyncStatus()
}

/**
 * Sync result
 */
sealed class SyncResult {
    data class Success(val syncedTypes: List<DataType>) : SyncResult()
    data class Error(val message: String) : SyncResult()
}
