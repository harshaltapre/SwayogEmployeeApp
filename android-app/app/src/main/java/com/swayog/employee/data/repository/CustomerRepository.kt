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

    

    suspend fun refreshCustomers(limit: Int?, city: String?): Result<List<Customer>> {

        return try {

            val response = apiService.getCustomers(limit, city)

            if (response.isSuccessful && response.body()?.data != null) {

                val customers = response.body()!!.data!!

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

    

    suspend fun getCustomerSummary(customerId: Int): Result<CustomerSummary> {

        return try {

            val response = apiService.getCustomerSummary(customerId)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch customer summary"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }

    

    suspend fun getCustomerInverterGeneration(customerId: Int): Result<InverterGeneration> {

        return try {

            val response = apiService.getCustomerInverterGeneration(customerId)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch inverter generation"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }

    

    suspend fun updateCustomerCredentials(

        customerId: Int,

        request: UpdateCredentialsRequest

    ): Result<Customer> {

        return try {

            val response = apiService.updateCustomerCredentials(customerId, request)

            if (response.isSuccessful && response.body()?.data != null) {

                val customer = response.body()!!.data!!

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



    suspend fun getCustomerInverterGenerationHistory(

        customerId: Int,

        period: String

    ): Result<List<GenerationHistory>> {

        return try {

            val response = apiService.getCustomerInverterGenerationHistory(customerId, period)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch generation history: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun getComplaints(): Result<List<ServiceRequest>> {

        return try {

            val response = apiService.getComplaints()

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch complaints: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun getSubAdminAmcVisits(customerId: Int?): Result<List<AmcVisit>> {

        return try {

            val response = apiService.getSubAdminAmcVisits(customerId, null, null, null)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch AMC visits: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun getSubAdminEmployees(): Result<List<User>> {

        return try {

            val response = apiService.getSubAdminEmployees()

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch employees: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun updateServiceRequest(

        requestId: Int,

        request: UpdateServiceRequestRequest

    ): Result<ServiceRequest> {

        return try {

            val response = apiService.updateServiceRequest(requestId, request)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to update service request: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun getAmcVisits(): Result<List<AmcVisit>> {

        return try {

            val response = apiService.getAmcVisits(null)

            if (response.isSuccessful && response.body()?.data != null) {

                Result.success(response.body()!!.data!!)

            } else {

                Result.failure(Exception("Failed to fetch AMC visits: ${response.message()}"))

            }

        } catch (e: Exception) {

            Result.failure(e)

        }

    }

    suspend fun createAmcVisit(request: CreateAmcVisitRequest): Result<AmcVisit> {
        return try {
            val response = apiService.createAmcVisit(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to create AMC visit: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateAmcVisit(visitId: String, request: UpdateAmcVisitRequest): Result<AmcVisit> {
        return try {
            val response = apiService.updateAmcVisit(visitId, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to update AMC visit: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

}

