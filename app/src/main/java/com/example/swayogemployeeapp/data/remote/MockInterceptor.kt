package com.example.swayogemployeeapp.data.remote

import android.util.Log
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody

import okio.Buffer

class MockInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val url = request.url().toString()
        val method = request.method()
        
        Log.d("MockInterceptor", "Intercepted: $method -> $url")

        val jsonResponse = when {
            url.contains("api/v1/employee/login") -> {
                val buffer = Buffer()
                request.body()?.writeTo(buffer)
                val bodyStr = buffer.readUtf8()
                
                val (jobRole, name, email) = when {
                    bodyStr.contains("survey", ignoreCase = true) -> Triple("Site Survey Engineer", "Arjun Survey", "survey@swayog.com")
                    bodyStr.contains("design", ignoreCase = true) -> Triple("Solar Design Engineer", "Priya Design", "design@swayog.com")
                    bodyStr.contains("electrical", ignoreCase = true) -> Triple("Electrical Engineer", "Vikram Electrical", "electrical@swayog.com")
                    bodyStr.contains("coordinator", ignoreCase = true) -> Triple("Service Coordinator", "Neha Coordinator", "coordinator@swayog.com")
                    bodyStr.contains("lead", ignoreCase = true) -> Triple("Team Lead", "Karan Lead", "lead@swayog.com")
                    bodyStr.contains("head", ignoreCase = true) -> Triple("Department Head", "Sanjay Head", "head@swayog.com")
                    bodyStr.contains("analyst", ignoreCase = true) -> Triple("Monitoring Analyst", "Rohan Analyst", "analyst@swayog.com")
                    bodyStr.contains("tech", ignoreCase = true) -> Triple("O&M Technician", "Vijay Tech", "tech@swayog.com")
                    bodyStr.contains("service", ignoreCase = true) -> Triple("Service Engineer", "Suresh Service", "service@swayog.com")
                    bodyStr.contains("intern", ignoreCase = true) -> Triple("Intern", "Amit Intern", "intern@swayog.com")
                    bodyStr.contains("other", ignoreCase = true) -> Triple("Other Position", "Rahul Other", "other@swayog.com")
                    else -> Triple("Site Survey Engineer", "Alex Carter", "employee@swayog.com")
                }

                """
                {
                    "success": true,
                    "id": "emp_101",
                    "loginId": "${email.substringBefore("@")}",
                    "email": "$email",
                    "name": "$name",
                    "role": "EMPLOYEE",
                    "jobRole": "$jobRole",
                    "employeeCode": "SW-EMP-402",
                    "reportingManagerId": "mgr_202",
                    "accessToken": "mock_access_token_12345",
                    "refreshToken": "mock_refresh_token_abcde"
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/attendance/check-in") -> {
                """
                {
                    "success": true,
                    "data": {
                        "attendanceId": "att-${System.currentTimeMillis()}",
                        "status": "active"
                    }
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/attendance/check-out") -> {
                """
                {
                    "success": true,
                    "message": "Checked out successfully"
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/submissions") -> {
                """
                {
                    "success": true,
                    "message": "Daily work submission successfully recorded."
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/surveys") -> {
                """
                {
                    "success": true,
                    "surveyId": "srv-${System.currentTimeMillis()}",
                    "message": "Site survey submitted for engineering draft review."
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/designs") -> {
                """
                {
                    "success": true,
                    "designId": "dsg-${System.currentTimeMillis()}",
                    "message": "System design files successfully uploaded."
                }
                """.trimIndent()
            }
            url.contains("tasks") && url.contains("complete") -> {
                """
                {
                    "success": true,
                    "message": "Task marked as completed."
                }
                """.trimIndent()
            }
            url.contains("api/v1/employee/token/refresh") -> {
                """
                {
                    "accessToken": "new_mock_access_token_${System.currentTimeMillis()}",
                    "refreshToken": "new_mock_refresh_token_${System.currentTimeMillis()}"
                }
                """.trimIndent()
            }
            else -> {
                """
                {
                    "success": true,
                    "message": "Mock response for $url"
                }
                """.trimIndent()
            }
        }

        // Delay to simulate network latency
        Thread.sleep(500)

        return Response.Builder()
            .code(200)
            .message("OK")
            .protocol(Protocol.HTTP_1_1)
            .request(request)
            .body(ResponseBody.create(MediaType.parse("application/json"), jsonResponse))
            .addHeader("content-type", "application/json")
            .build()
    }
}
