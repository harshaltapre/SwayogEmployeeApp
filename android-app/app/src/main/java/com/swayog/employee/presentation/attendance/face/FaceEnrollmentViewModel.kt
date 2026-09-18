package com.swayog.employee.presentation.attendance.face

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.face.Face
import com.swayog.employee.core.util.ErrorUtils
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
    val step1Done: Boolean = false,
    val step2Done: Boolean = false,
    val step3Done: Boolean = false,
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

    private var latestEmbedding: List<Float>? = null
    private var lastCaptureTime = 0L
    private var step2Direction = 0f

    fun processFace(face: Face?, embedding: List<Float>?) {
        if (uiState.value.isLoading || uiState.value.enrollmentComplete) return
        
        _uiState.update { it.copy(isFaceDetected = face != null) }
        
        if (face == null || embedding == null) return

        latestEmbedding = embedding

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastCaptureTime < 1200) return

        val eulerY = face.headEulerAngleY

        when (_uiState.value.currentStep) {
            1 -> {
                // Center: Looking straight
                if (abs(eulerY) <= 10f) {
                    descriptor1 = embedding
                    lastCaptureTime = currentTime
                    _uiState.update { 
                        it.copy(
                            currentStep = 2,
                            step1Done = true,
                            instruction = "Turn head slightly to the left"
                        )
                    }
                }
            }
            2 -> {
                // Left angle turn (Euler Y typically negative when turned left, or positive on some mirrored sensors)
                if (eulerY < -7f || eulerY > 7f) {
                    descriptor2 = embedding
                    step2Direction = eulerY
                    lastCaptureTime = currentTime
                    _uiState.update { 
                        it.copy(
                            currentStep = 3,
                            step2Done = true,
                            instruction = "Turn head slightly to the right"
                        )
                    }
                }
            }
            3 -> {
                // Right angle turn (opposite direction of step 2)
                val oppositeDirection = if (step2Direction > 0) eulerY < -7f else eulerY > 7f
                if (oppositeDirection) {
                    descriptor3 = embedding
                    lastCaptureTime = currentTime
                    _uiState.update { it.copy(step3Done = true) }
                    submitEnrollment()
                }
            }
        }
    }

    /**
     * Manual capture trigger allowing the user to capture the current step
     * when a face is detected, ensuring they are never stuck by strict angle math.
     */
    fun captureCurrentStep() {
        val embedding = latestEmbedding ?: return
        if (uiState.value.isLoading || uiState.value.enrollmentComplete) return

        when (_uiState.value.currentStep) {
            1 -> {
                descriptor1 = embedding
                lastCaptureTime = System.currentTimeMillis()
                _uiState.update {
                    it.copy(
                        currentStep = 2,
                        step1Done = true,
                        instruction = "Turn head slightly to the left"
                    )
                }
            }
            2 -> {
                descriptor2 = embedding
                step2Direction = -10f
                lastCaptureTime = System.currentTimeMillis()
                _uiState.update {
                    it.copy(
                        currentStep = 3,
                        step2Done = true,
                        instruction = "Turn head slightly to the right"
                    )
                }
            }
            3 -> {
                descriptor3 = embedding
                lastCaptureTime = System.currentTimeMillis()
                _uiState.update { it.copy(step3Done = true) }
                submitEnrollment()
            }
        }
    }

    fun submitEnrollment() {
        if (descriptor1 == null || descriptor2 == null || descriptor3 == null) {
            _uiState.update { it.copy(error = "Please complete all 3 face captures first.") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, instruction = "Saving Face ID...") }
            
            try {
                // Save locally first
                dataStoreManager.saveFaceEnrollment(descriptor1!!, descriptor2!!, descriptor3!!)
                
                val request = FaceEnrollRequest(descriptor1!!, descriptor2!!, descriptor3!!)
                val response = apiService.enrollFace(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isLoading = false, enrollmentComplete = true) }
                } else {
                    val errorMsg = ErrorUtils.formatResponseError(response)
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "Enrollment saved locally, but server returned: $errorMsg"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Saved locally. Server sync failed: ${e.localizedMessage ?: e.message}"
                    )
                }
            }
        }
    }

    fun resetEnrollment() {
        descriptor1 = null
        descriptor2 = null
        descriptor3 = null
        latestEmbedding = null
        lastCaptureTime = 0L
        _uiState.value = FaceEnrollmentUiState()
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    override fun onCleared() {
        super.onCleared()
        faceEmbeddingHelper.close()
    }
}
