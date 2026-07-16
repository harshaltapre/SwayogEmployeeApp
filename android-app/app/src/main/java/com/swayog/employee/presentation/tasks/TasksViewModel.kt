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

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _tasksState = MutableStateFlow<TasksState>(TasksState.Initial)
    val tasksState: StateFlow<TasksState> = _tasksState.asStateFlow()

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    val userId: StateFlow<String?> = dataStoreManager.userId.stateIn(
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
        refresh()
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
                afterLongitude = afterLongitude
            )
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
