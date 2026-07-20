package com.swayog.employee.presentation.dailycommit

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.repository.DailyCommitRepository
import com.swayog.employee.data.model.DailyCommit
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import com.swayog.employee.core.util.OfflinePendingException

@HiltViewModel
class DailyCommitViewModel @Inject constructor(
    private val dailyCommitRepository: DailyCommitRepository,
    private val dataStoreManager: DataStoreManager
) : ViewModel() {
    
    private val _dailyCommitState = MutableStateFlow<DailyCommitState>(DailyCommitState.Initial)
    val dailyCommitState: StateFlow<DailyCommitState> = _dailyCommitState.asStateFlow()
    
    private val _commitsHistory = MutableStateFlow<List<DailyCommit>>(emptyList())
    val commitsHistory: StateFlow<List<DailyCommit>> = _commitsHistory.asStateFlow()
    
    val pendingSyncCount: StateFlow<Int> = dailyCommitRepository.pendingSyncCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    
    private val _employeeId = MutableStateFlow<String?>(null)
    
    init {
        viewModelScope.launch {
            dataStoreManager.userId.filterNotNull().collect { id ->
                _employeeId.value = id
                loadCommitsHistory(id)
                refreshCommitsHistory()
            }
        }
    }
    
    private fun loadCommitsHistory(employeeId: String) {
        viewModelScope.launch {
            dailyCommitRepository.getDailyCommitsByEmployeeId(employeeId).collect { list ->
                _commitsHistory.value = list
            }
        }
    }
    
    fun refreshCommitsHistory() {
        viewModelScope.launch {
            dailyCommitRepository.refreshDailyCommits()
        }
    }
    
    fun submitDailyCommit(
        commitDate: String,
        taskWorkedOn: String,
        workSummary: String,
        hoursSpent: Double,
        issuesBlockers: String?,
        tomorrowPlan: String?
    ) {
        val empId = _employeeId.value
        if (empId == null) {
            _dailyCommitState.value = DailyCommitState.Error("User session not found")
            return
        }
        
        _dailyCommitState.value = DailyCommitState.Loading
        viewModelScope.launch {
            dailyCommitRepository.createDailyCommit(
                employeeId = empId,
                commitDate = commitDate,
                taskWorkedOn = taskWorkedOn,
                workSummary = workSummary,
                hoursSpent = hoursSpent,
                issuesBlockers = if (issuesBlockers.isNull_or_empty()) null else issuesBlockers,
                tomorrowPlan = if (tomorrowPlan.isNull_or_empty()) null else tomorrowPlan,
                attachmentUrl = null
            ).onSuccess {
                _dailyCommitState.value = DailyCommitState.Success("Daily commit submitted successfully!")
                loadCommitsHistory(empId)
            }.onFailure { error ->
                if (error is OfflinePendingException) {
                    _dailyCommitState.value = DailyCommitState.Success(error.message ?: "Saved locally. Will sync automatically when online.")
                    loadCommitsHistory(empId)
                } else {
                    _dailyCommitState.value = DailyCommitState.Error(error.message ?: "Failed to submit daily commit")
                }
            }
        }
    }
    
    private fun String?.isNull_or_empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }
    
    fun resetState() {
        _dailyCommitState.value = DailyCommitState.Initial
    }
}

sealed class DailyCommitState {
    object Initial : DailyCommitState()
    object Loading : DailyCommitState()
    data class Success(val message: String) : DailyCommitState()
    data class Error(val message: String) : DailyCommitState()
}
