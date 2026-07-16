package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService
import com.swayog.employee.data.local.dao.UserDao
import com.swayog.employee.data.local.entity.UserEntity
import com.swayog.employee.data.model.Employee
import com.swayog.employee.data.model.EmployeeProfile
import com.swayog.employee.core.util.ErrorUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmployeeRepository @Inject constructor(
    private val apiService: ApiService,
    private val userDao: UserDao
) {
    fun getInternalUsersFlow(role: String? = null): Flow<List<Employee>> {
        val flow = if (role != null) {
            userDao.getUsersByRole(role)
        } else {
            userDao.getAllUsers()
        }
        
        return flow.map { entities ->
            entities.map { entity ->
                Employee(
                    id = entity.id,
                    loginId = entity.loginId,
                    fullName = entity.fullName,
                    email = entity.email,
                    phoneNumber = entity.phoneNumber,
                    role = entity.role,
                    isActive = entity.isActive,
                    createdAt = entity.createdAt,
                    department = null,
                    reportingManagerId = entity.reportingManagerId,
                    employeeProfile = EmployeeProfile(
                        id = null,
                        userId = entity.id,
                        jobRole = entity.jobRole,
                        zone = entity.zone,
                        monthlySalaryInr = entity.monthlySalaryInr,
                        isActive = entity.isActive
                    ),
                    partnerProfile = null,
                    rating = entity.rating ?: 0.0,
                    activeTasksCount = 0,
                    status = if (entity.isActive) "active" else "inactive"
                )
            }
        }
    }

    suspend fun getInternalUsers(role: String? = null): Result<List<Employee>> {
        return try {
            val response = apiService.getInternalUsers(role)
            if (response.isSuccessful && response.body()?.data != null) {
                val employees = response.body()!!.data!!
                
                withContext(Dispatchers.IO) {
                    val entities = employees.map { emp ->
                        UserEntity(
                            id = emp.id,
                            loginId = emp.loginId,
                            employeeCode = null,
                            email = emp.email,
                            phoneNumber = emp.phoneNumber,
                            fullName = emp.fullName,
                            role = emp.role,
                            designationTitle = null,
                            departmentId = emp.department?.id,
                            reportingManagerId = emp.reportingManagerId,
                            isActive = emp.isActive,
                            createdAt = emp.createdAt,
                            jobRole = emp.employeeProfile?.jobRole,
                            zone = emp.zone,
                            monthlySalaryInr = emp.employeeProfile?.monthlySalaryInr,
                            profilePhotoUrl = null,
                            rating = emp.rating
                        )
                    }
                    userDao.insertUsers(entities)
                }
                
                Result.success(employees)
            } else {
                Result.failure(Exception("Failed to fetch employees: ${ErrorUtils.formatResponseError(response)}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Failed to fetch employees: ${ErrorUtils.formatException(e)}"))
        }
    }
}
