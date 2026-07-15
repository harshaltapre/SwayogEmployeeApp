package com.swayog.employee.presentation.attendance.face

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.face.Face
import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.preferences.DataStoreManager
import com.swayog.employee.data.model.FaceEnrollRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.abs

data class FaceEnrollmentUiState(
    val currentStep: Int = 1,
    val instruction: String = "Look straight at the camera",
    val isFaceDetected: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val enrollmentComplete: Boolean = false
)

@HiltViewModel
class FaceEnrollmentViewModel @Inject constructor(
    @ApplicationContext context: Context,
    private val apiService: ApiService,
    private val dataStoreManager: DataStoreManager
) : ViewModel() {

    val faceEmbeddingHelper = FaceEmbeddingHelper(context)
    
    private val _uiState = MutableStateFlow(FaceEnrollmentUiState())
    val uiState: StateFlow<FaceEnrollmentUiState> = _uiState.asStateFlow()

    private var descriptor1: List<Float>? = null
    private var descriptor2: List<Float>? = null
    private var descriptor3: List<Float>? = null

    private var lastCaptureTime = 0L
    private var step2Direction = 0f

    fun processFace(face: Face?, embedding: List<Float>?) {
        if (uiState.value.isLoading || uiState.value.enrollmentComplete) return
        
        _uiState.update { it.copy(isFaceDetected = face != null) }
        
        if (face == null || embedding == null) return

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastCaptureTime < 1500) return

        val eulerY = face.headEulerAngleY

        when (_uiState.value.currentStep) {
            1 -> {
                if (eulerY in -12f..12f) {
                    descriptor1 = embedding
                    lastCaptureTime = currentTime
                    _uiState.update { 
                        it.copy(currentStep = 2, instruction = "Turn head slightly left")
                    }
                }
            }
            2 -> {
                if (eulerY > 15f || eulerY < -15f) {
                    descriptor2 = embedding
                    step2Direction = eulerY
                    lastCaptureTime = currentTime
                    val nextInstruction = if (eulerY > 0) "Turn head slightly right" else "Turn head slightly left"
                    _uiState.update { 
                        it.copy(currentStep = 3, instruction = nextInstruction)
                    }
                }
            }
            3 -> {
                val oppositeDirection = if (step2Direction > 0) eulerY < -15f else eulerY > 15f
                if (oppositeDirection) {
                    descriptor3 = embedding
                    lastCaptureTime = currentTime
                    submitEnrollment()
                }
            }
        }
    }

    private fun submitEnrollment() {
        if (descriptor1 == null || descriptor2 == null || descriptor3 == null) return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, instruction = "Syncing...") }
            
            try {
                dataStoreManager.saveFaceEnrollment(descriptor1!!, descriptor2!!, descriptor3!!)
                
                val request = FaceEnrollRequest(descriptor1!!, descriptor2!!, descriptor3!!)
                val response = apiService.enrollFace(request)
                
                if (response.isSuccessful) {
                    _uiState.update { it.copy(isLoading = false, enrollmentComplete = true) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "Failed to sync: ${response.message()}") }
                }
            } catch (e: Exception) {
                // If it fails to sync, we still saved it locally, but we should inform the user
                _uiState.update { it.copy(isLoading = false, error = "Saved locally, but failed to sync: ${e.localizedMessage}") }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    override fun onCleared() {
        super.onCleared()
        faceEmbeddingHelper.close()
    }
}
