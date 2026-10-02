package com.swayog.employee.presentation.attendance.face

import com.swayog.employee.data.local.preferences.DataStoreManager
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Thread-safe singleton holding the active in-memory face embeddings index.
 * Face verification readers access the current immutable list snapshot without locking or blocking.
 * When sync or new enrollment updates the descriptors, the entire list is atomically swapped.
 */
@Singleton
class FaceIndexManager @Inject constructor(
    private val dataStoreManager: DataStoreManager
) {
    @Volatile
    private var _index: List<List<Float>> = emptyList()

    @Volatile
    private var _indexVersion: Int = -1

    @Volatile
    private var _indexUserId: String? = null

    val index: List<List<Float>>
        get() = _index

    fun getIndexSnapshot(): List<List<Float>> {
        return _index
    }

    val activeIndexVersion: Int
        get() = _indexVersion

    val activeIndexUserId: String?
        get() = _indexUserId

    /**
     * Atomically swap the in-memory face index.
     */
    fun atomicUpdate(newDescriptors: List<List<Float>>) {
        atomicUpdate(newDescriptors, _indexVersion, _indexUserId)
    }

    fun atomicUpdate(newDescriptors: List<List<Float>>, version: Int, userId: String?) {
        synchronized(this) {
            _index = newDescriptors.map { it.toList() }
            _indexVersion = version
            _indexUserId = userId
        }
    }

    /**
     * Clear the in-memory index (e.g. when enrollment is deleted or logged out).
     */
    fun clear() {
        synchronized(this) {
            _index = emptyList()
            _indexVersion = -1
            _indexUserId = null
        }
    }

    /**
     * Warm up the in-memory index from local DataStore cache.
     */
    suspend fun loadFromDataStore(expectedDimension: Int = FaceEmbeddingHelper.EMBEDDING_DIMENSION): List<List<Float>> {
        val descriptors = dataStoreManager.faceDescriptors.first()
        val storedVersion = dataStoreManager.faceEnrollmentVersion.first()
        val storedUserId = dataStoreManager.userId.first()
        val valid = descriptors.size == 3 && descriptors.all {
            DataStoreManager.isValidFaceDescriptor(it, expectedDimension)
        }
        val current = if (valid) descriptors.map { it.toList() } else emptyList()
        val rebuilt = _index != current || _indexVersion != storedVersion || _indexUserId != storedUserId
        if (rebuilt) atomicUpdate(current, storedVersion, storedUserId)

        android.util.Log.d(
            "FACE_DEBUG",
            "[FACE_UPDATE_2] storedExists=${descriptors.isNotEmpty()} [FACE_UPDATE_3] storedCount=${descriptors.size} " +
                "[FACE_UPDATE_4] descriptorDimensions=${descriptors.map { it.size }} [FACE_UPDATE_5] enrollmentVersion=$storedVersion " +
                "[FACE_UPDATE_6] indexCount=${_index.size} [FACE_UPDATE_7] indexVersion=$_indexVersion rebuilt=$rebuilt valid=$valid"
        )
        return _index
    }
}
