package com.swayog.employee.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.AttendanceRecord
import com.swayog.employee.data.model.PerformanceSnapshot
import com.swayog.employee.data.repository.AttendanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository
) : ViewModel() {

    private val _attendanceState = MutableStateFlow<AttendanceState>(AttendanceState.Initial)
    val attendanceState: StateFlow<AttendanceState> = _attendanceState.asStateFlow()

    private val _todayAttendance = MutableStateFlow<AttendanceRecord?>(null)
    val todayAttendance: StateFlow<AttendanceRecord?> = _todayAttendance.asStateFlow()

    private val _performance = MutableStateFlow<PerformanceSnapshot?>(null)
    val performance: StateFlow<PerformanceSnapshot?> = _performance.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            
            // 1. Fetch today's record
            attendanceRepository.getTodayAttendance()
                .onSuccess { record ->
                    _todayAttendance.value = record
                }
                .onFailure {
                    // Fallback
                    _todayAttendance.value = null
                }
                
            // 2. Fetch monthly performance details
            val calendar = Calendar.getInstance()
            val month = calendar.get(Calendar.MONTH) + 1
            val year = calendar.get(Calendar.YEAR)
            attendanceRepository.getPerformance(month, year)
                .onSuccess { snapshot ->
                    _performance.value = snapshot
                    _attendanceState.value = AttendanceState.Success
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Error(error.message ?: "Failed to load performance stats")
                }
        }
    }

    fun checkIn(selfie: String?, latitude: Double?, longitude: Double?, onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            attendanceRepository.checkIn(selfie, latitude, longitude)
                .onSuccess { response ->
                    _todayAttendance.value = response.attendanceRecord
                    loadData()
                    onResult(Result.success(Unit))
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(error))
                }
        }
    }

    fun checkOut(onResult: (Result<Unit>) -> Unit) {
        viewModelScope.launch {
            _attendanceState.value = AttendanceState.Loading
            attendanceRepository.checkOut()
                .onSuccess {
                    loadData()
                    onResult(Result.success(Unit))
                }
                .onFailure { error ->
                    _attendanceState.value = AttendanceState.Success
                    onResult(Result.failure(error))
                }
        }
    }
}

sealed class AttendanceState {
    object Initial : AttendanceState()
    object Loading : AttendanceState()
    object Success : AttendanceState()
    data class Error(val message: String) : AttendanceState()
}
