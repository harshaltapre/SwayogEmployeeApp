package com.swayog.employee.data.repository

import com.swayog.employee.data.api.ApiService

import com.swayog.employee.data.local.dao.CustomerDao
import com.swayog.employee.data.local.entity.CustomerEntity
import com.swayog.employee.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerRepository @Inject constructor(
    private val customerDao: CustomerDao,
    private val apiService: ApiService
) {
    
    fun getAllCustomers(): Flow<List<Customer>> {
        return customerDao.getAllCustomers().map { entities ->
            entities.map { entity ->
                Customer(
                    id = entity.id,
                    customerCode = entity.customerCode,
                    fullName = entity.fullName,
                    email = entity.email,
                    phoneNumber = entity.phoneNumber,
                    city = entity.city,
                    address = entity.address,
                    systemSizeKw = entity.systemSizeKw,
                    installationDate = entity.installationDate,
                    warrantyExpiry = entity.warrantyExpiry,
                    panelBrand = entity.panelBrand,
                    inverterBrand = entity.inverterBrand,
                    inverterModel = entity.inverterModel,
                    amcStatus = entity.amcStatus,
                    amcExpiryDate = entity.amcExpiryDate,
                    status = entity.status,
                    projectStage = entity.projectStage,
                    latitude = entity.latitude,
                    longitude = entity.longitude,
                    inverterLoginId = entity.inverterLoginId,
                    inverterPassword = entity.inverterPassword,
                    inverterApiKey = entity.inverterApiKey,
                    inverterDeviceSn = entity.inverterDeviceSn
                )
            }
        }
    }
    
    fun getCustomersByCity(city: String): Flow<List<Customer>> {
        return customerDao.getCustomersByCity(city).map { entities ->
            entities.map { entity ->
                Customer(
                    id = entity.id,
                    customerCode = entity.customerCode,
                    fullName = entity.fullName,
                    email = entity.email,
                    phoneNumber = entity.phoneNumber,
                    city = entity.city,
                    address = entity.address,
                    systemSizeKw = entity.systemSizeKw,
                    installationDate = entity.installationDate,
                    warrantyExpiry = entity.warrantyExpiry,
                    panelBrand = entity.panelBrand,
                    inverterBrand = entity.inverterBrand,
                    inverterModel = entity.inverterModel,
                    amcStatus = entity.amcStatus,
                    amcExpiryDate = entity.amcExpiryDate,
                    status = entity.status,
                    projectStage = entity.projectStage,
                    latitude = entity.latitude,
                    longitude = entity.longitude,
                    inverterLoginId = entity.inverterLoginId,
                    inverterPassword = entity.inverterPassword,
                    inverterApiKey = entity.inverterApiKey,
                    inverterDeviceSn = entity.inverterDeviceSn
                )
            }
        }
    }
    
    suspend fun refreshCustomers(limit: Int?, city: String?, token: String): Result<List<Customer>> {
        return try {
            val response = apiService.getCustomers("Bearer $token", limit, city)
            if (response.isSuccessful && response.body() != null) {
                val customers = response.body()!!
                val entities = customers.map { customer ->
                    CustomerEntity(
                        id = customer.id,
                        customerCode = customer.customerCode,
                        fullName = customer.fullName,
                        email = customer.email,
                        phoneNumber = customer.phoneNumber,
                        city = customer.city,
                        address = customer.address,
                        systemSizeKw = customer.systemSizeKw,
                        installationDate = customer.installationDate,
                        warrantyExpiry = customer.warrantyExpiry,
                        panelBrand = customer.panelBrand,
                        inverterBrand = customer.inverterBrand,
                        inverterModel = customer.inverterModel,
                        amcStatus = customer.amcStatus,
                        amcExpiryDate = customer.amcExpiryDate,
                        status = customer.status,
                        projectStage = customer.projectStage,
                        latitude = customer.latitude,
                        longitude = customer.longitude,
                        inverterLoginId = customer.inverterLoginId,
                        inverterPassword = customer.inverterPassword,
                        inverterApiKey = customer.inverterApiKey,
                        inverterDeviceSn = customer.inverterDeviceSn
                    )
                }
                customerDao.insertCustomers(entities)
                Result.success(customers)
            } else {
                Result.failure(Exception("Failed to fetch customers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCustomerSummary(customerId: Int, token: String): Result<CustomerSummary> {
        return try {
            val response = apiService.getCustomerSummary("Bearer $token", customerId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch customer summary"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCustomerInverterGeneration(customerId: Int, token: String): Result<InverterGeneration> {
        return try {
            val response = apiService.getCustomerInverterGeneration("Bearer $token", customerId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch inverter generation"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateCustomerCredentials(
        customerId: Int,
        request: UpdateCredentialsRequest,
        token: String
    ): Result<Customer> {
        return try {
            val response = apiService.updateCustomerCredentials("Bearer $token", customerId, request)
            if (response.isSuccessful && response.body() != null) {
                val customer = response.body()!!
                val entity = CustomerEntity(
                    id = customer.id,
                    customerCode = customer.customerCode,
                    fullName = customer.fullName,
                    email = customer.email,
                    phoneNumber = customer.phoneNumber,
                    city = customer.city,
                    address = customer.address,
                    systemSizeKw = customer.systemSizeKw,
                    installationDate = customer.installationDate,
                    warrantyExpiry = customer.warrantyExpiry,
                    panelBrand = customer.panelBrand,
                    inverterBrand = customer.inverterBrand,
                    inverterModel = customer.inverterModel,
                    amcStatus = customer.amcStatus,
                    amcExpiryDate = customer.amcExpiryDate,
                    status = customer.status,
                    projectStage = customer.projectStage,
                    latitude = customer.latitude,
                    longitude = customer.longitude,
                    inverterLoginId = customer.inverterLoginId,
                    inverterPassword = customer.inverterPassword,
                    inverterApiKey = customer.inverterApiKey,
                    inverterDeviceSn = customer.inverterDeviceSn
                )
                customerDao.updateCustomer(entity)
                Result.success(customer)
            } else {
                Result.failure(Exception("Failed to update credentials"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
