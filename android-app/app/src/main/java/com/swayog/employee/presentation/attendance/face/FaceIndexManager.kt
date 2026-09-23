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

    val index: List<List<Float>>
        get() = _index

    fun getIndexSnapshot(): List<List<Float>> {
        return _index
    }

    /**
     * Atomically swap the in-memory face index.
     */
    fun atomicUpdate(newDescriptors: List<List<Float>>) {
        synchronized(this) {
            _index = newDescriptors.map { it.toList() }
        }
    }

    /**
     * Clear the in-memory index (e.g. when enrollment is deleted or logged out).
     */
    fun clear() {
        synchronized(this) {
            _index = emptyList()
        }
    }

    /**
     * Warm up the in-memory index from local DataStore cache.
     */
    suspend fun loadFromDataStore(): List<List<Float>> {
        val descriptors = dataStoreManager.faceDescriptors.first()
        atomicUpdate(descriptors)
        return _index
    }
}
