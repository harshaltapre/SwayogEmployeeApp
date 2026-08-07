package com.swayog.employee.presentation.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.Task
import com.swayog.employee.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.swayog.employee.data.repository.EmployeeRepository

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val taskRepository: TaskRepository,
    private val employeeRepository: EmployeeRepository
) : ViewModel() {

    private val _tasksState = MutableStateFlow<TasksState>(TasksState.Initial)
    val tasksState: StateFlow<TasksState> = _tasksState.asStateFlow()

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    val pendingSyncCount: StateFlow<Int> = taskRepository.pendingSyncCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val userId: StateFlow<String?> = dataStoreManager.userId.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val canCreateTask: StateFlow<Boolean> = combine(
        dataStoreManager.userRole,
        userId
    ) { role, id ->
        Pair(role, id)
    }.flatMapLatest { (role, id) ->
        val upperRole = role?.uppercase() ?: ""
        if (upperRole == "SUPER_ADMIN" || upperRole == "ADMIN" || upperRole == "SUB_ADMIN") {
            flowOf(true)
        } else if (!id.isNullOrEmpty()) {
            employeeRepository.getSubordinatesFlow(id).map { subordinates ->
                subordinates.isNotEmpty()
            }
        } else {
            flowOf(false)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val serverUrl: StateFlow<String?> = dataStoreManager.serverUrl.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    init {
        viewModelScope.launch {
            userId.filterNotNull().collect { id ->
                // Observe local database tasks flow
                taskRepository.getTasksByEmployeeId(id).collect { localTasks ->
                    _tasks.value = localTasks
                }
            }
        }
        viewModelScope.launch {
            try { employeeRepository.getInternalUsers() } catch (_: Exception) {}
        }
        refresh()
    }

    fun syncPending(onResult: (com.swayog.employee.data.repository.SyncResultSummary) -> Unit) {
        viewModelScope.launch {
            val id = userId.value
            val summary = taskRepository.syncPendingActions()
            if (id != null && summary.synced > 0) {
                taskRepository.refreshTasks(id)
            }
            onResult(summary)
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val id = userId.value ?: return@launch
            _tasksState.value = TasksState.Loading
            taskRepository.refreshTasks(id)
                .onSuccess {
                    _tasksState.value = TasksState.Success
                }
                .onFailure { error ->
                    _tasksState.value = TasksState.Error(error.message ?: "Failed to refresh tasks")
                }
        }
    }

    fun updateTaskStatus(taskId: String, status: String, onResult: (Result<Task>) -> Unit) {
        viewModelScope.launch {
            val res = taskRepository.updateTaskStatus(taskId, status)
            onResult(res)
        }
    }

    fun completeTask(
        taskId: String, 
        message: String, 
        documentUrl: String?, 
        beforeImageUrl: String? = null,
        afterImageUrl: String? = null,
        beforeLatitude: Double? = null,
        beforeLongitude: Double? = null,
        afterLatitude: Double? = null,
        afterLongitude: Double? = null,
        taskType: String? = null,
        images: List<String>? = null,
        beforeImages: List<String>? = null,
        afterImages: List<String>? = null,
        sitePhotos: List<String>? = null,
        onResult: (Result<Task>) -> Unit
    ) {
        viewModelScope.launch {
            val res = taskRepository.completeTask(
                taskId = taskId, 
                completionMessage = message, 
                completionDocumentUrl = documentUrl,
                beforeImageUrl = beforeImageUrl,
                afterImageUrl = afterImageUrl,
                beforeLatitude = beforeLatitude,
                beforeLongitude = beforeLongitude,
                afterLatitude = afterLatitude,
                afterLongitude = afterLongitude,
                taskType = taskType,
                images = images,
                beforeImages = beforeImages,
                afterImages = afterImages,
                sitePhotos = sitePhotos
            )
            onResult(res)
        }
    }

    fun createTask(
        jobType: String,
        description: String,
        customerName: String,
        customerPhone: String,
        address: String,
        latitude: Double?,
        longitude: Double?,
        scheduledTime: String,
        employeeUserId: String,
        onResult: (Result<Task>) -> Unit
    ) {
        viewModelScope.launch {
            _tasksState.value = TasksState.Loading
            val res = taskRepository.createTask(
                jobType = jobType,
                description = description,
                customerName = customerName,
                customerPhone = customerPhone,
                address = address,
                latitude = latitude,
                longitude = longitude,
                scheduledTime = scheduledTime,
                employeeUserId = employeeUserId
            )
            if (res.isSuccess) {
                refresh()
            }
            _tasksState.value = if (res.isSuccess) TasksState.Success else TasksState.Error(res.exceptionOrNull()?.message ?: "Failed to create task")
            onResult(res)
        }
    }

    fun rateTask(
        taskId: String,
        rating: Int,
        feedback: String?,
        fixCharges: Double?,
        onResult: (Result<Task>) -> Unit
    ) {
        viewModelScope.launch {
            val res = taskRepository.rateTask(
                taskId = taskId,
                rating = rating,
                feedback = feedback,
                fixCharges = fixCharges
            )
            if (res.isSuccess) {
                refresh()
            }
            onResult(res)
        }
    }
}

sealed class TasksState {
    object Initial : TasksState()
    object Loading : TasksState()
    object Success : TasksState()
    data class Error(val message: String) : TasksState()
}
