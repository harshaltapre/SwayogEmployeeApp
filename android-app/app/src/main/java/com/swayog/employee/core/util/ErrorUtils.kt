package com.swayog.employee.core.util

import retrofit2.HttpException
import retrofit2.Response
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLException

class OfflinePendingException(message: String = "Saved locally. Will sync automatically when online.") : Exception(message)

object ErrorUtils {
    /**
     * Formats an exception into a guaranteed non-empty string,
     * including class names, and avoiding null messages.
     * Extracts HTTP bodies for HttpException.
     */
    fun formatException(e: Throwable): String {
        val msg = e.message ?: ""
        if (e is UnknownHostException ||
            e is ConnectException ||
            e is SocketTimeoutException ||
            e is NoRouteToHostException ||
            e is SSLException ||
            msg.contains("Unable to resolve host", ignoreCase = true) ||
            msg.contains("Failed to connect", ignoreCase = true) ||
            msg.contains("Connection refused", ignoreCase = true) ||
            msg.contains("Network is unreachable", ignoreCase = true) ||
            msg.contains("No address associated with hostname", ignoreCase = true)
        ) {
            return "Unable to connect to server. Please check your internet connection and try again."
        }

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
        
        return if (msg.isBlank()) {
            "An unexpected error occurred (${e.javaClass.simpleName})"
        } else {
            msg
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
