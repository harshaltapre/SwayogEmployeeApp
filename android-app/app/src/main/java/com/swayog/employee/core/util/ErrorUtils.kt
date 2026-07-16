package com.swayog.employee.core.util

import retrofit2.HttpException
import retrofit2.Response

object ErrorUtils {
    /**
     * Formats an exception into a guaranteed non-empty string,
     * including class names, and avoiding null messages.
     * Extracts HTTP bodies for HttpException.
     */
    fun formatException(e: Throwable): String {
        if (e is HttpException) {
            val code = e.code()
            val defaultMessage = e.message()
            val errorBody = try {
                e.response()?.errorBody()?.string()
            } catch (ex: Exception) {
                null
            }
            val snippet = if (!errorBody.isNullOrBlank()) errorBody.take(100) else "No error body"
            return "HttpException $code $defaultMessage: $snippet"
        }
        
        val message = e.message
        return if (message.isNullOrBlank()) {
            "Error: ${e.javaClass.simpleName} (${e.toString()})"
        } else {
            "Error: ${e.javaClass.simpleName} - $message"
        }
    }

    /**
     * Checks if the exception is a 401 Unauthorized.
     */
    fun isUnauthorized(e: Throwable?): Boolean {
        if (e == null) return false
        if (e is retrofit2.HttpException && e.code() == 401) return true
        val message = e.message ?: ""
        return message.contains("401") || message.contains("Unauthorized", ignoreCase = true)
    }

    /**
     * Formats an unsuccessful Retrofit response.
     */
    fun <T> formatResponseError(response: Response<T>): String {
        val errorBody = try {
            response.errorBody()?.string()?.take(100)
        } catch (e: Exception) {
            "Could not read error body"
        }
        val message = if (response.message().isNullOrBlank()) "No Message" else response.message()
        return "HTTP ${response.code()} $message: ${errorBody ?: "Empty body"}"
    }
}
