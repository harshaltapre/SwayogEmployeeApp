package com.swayog.employee.core.util

import android.content.Context
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object LocalFileHelper {
    private const val OFFLINE_SYNC_DIR = "offline_sync_images"

    /**
     * Saves a Base64 encoded string to the internal storage and returns the absolute file path.
     * Use this to prevent CursorWindowAllocationException in Room by storing large strings in files instead of DB.
     */
    fun saveBase64ToFile(context: Context, base64String: String, typePrefix: String = "img"): String {
        val directory = File(context.filesDir, OFFLINE_SYNC_DIR)
        if (!directory.exists()) {
            directory.mkdirs()
        }

        val fileName = "${typePrefix}_${UUID.randomUUID()}.txt"
        val file = File(directory, fileName)

        FileOutputStream(file).use { outputStream ->
            outputStream.write(base64String.toByteArray())
        }

        return file.absolutePath
    }

    /**
     * Reads a saved Base64 string from the internal storage.
     */
    fun readFileToBase64(filePath: String): String? {
        val file = File(filePath)
        if (!file.exists() || !file.canRead()) {
            return null
        }
        return file.readText()
    }

    /**
     * Deletes the local file once it has been successfully synced to the backend.
     */
    fun deleteFile(filePath: String): Boolean {
        val file = File(filePath)
        if (file.exists()) {
            return file.delete()
        }
        return false
    }
}
