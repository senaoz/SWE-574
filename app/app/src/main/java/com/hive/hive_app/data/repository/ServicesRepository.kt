package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.ServicesApi
import com.hive.hive_app.data.api.dto.LocationDto
import com.hive.hive_app.data.api.dto.ServiceCreate
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.ServiceUpdate
import com.hive.hive_app.data.api.dto.TagDto
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ServicesRepository @Inject constructor(
    private val servicesApi: ServicesApi
) {
    suspend fun getServices(
        page: Int = 1,
        limit: Int = 20,
        serviceType: String? = null,
        category: String? = null,
        tags: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        radius: Double? = null,
        userId: String? = null,
        serviceStatus: String? = null
    ): Result<com.hive.hive_app.data.api.dto.ServiceListResponse> {
        return try {
            val response = servicesApi.getServices(
                page = page,
                limit = limit,
                serviceType = serviceType,
                category = category,
                tags = tags,
                latitude = latitude,
                longitude = longitude,
                radius = radius,
                userId = userId,
                serviceStatus = serviceStatus
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getService(serviceId: String): Result<ServiceResponse> {
        return try {
            val response = servicesApi.getService(serviceId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createService(
        title: String,
        description: String,
        category: String? = null,
        tags: List<TagDto>,
        estimatedDuration: Double,
        location: LocationDto,
        serviceType: String,
        maxParticipants: Int = 1,
        deadline: String? = null
    ): Result<ServiceResponse> {
        return try {
            val body = ServiceCreate(
                title = title,
                description = description,
                category = category,
                tags = tags,
                estimatedDuration = estimatedDuration,
                location = location,
                deadline = deadline,
                serviceType = serviceType,
                maxParticipants = maxParticipants
            )
            val response = servicesApi.createService(body)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateService(
        serviceId: String,
        update: ServiceUpdate
    ): Result<ServiceResponse> {
        return try {
            val response = servicesApi.updateService(serviceId, update)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteService(serviceId: String): Result<Unit> {
        return try {
            val response = servicesApi.deleteService(serviceId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
