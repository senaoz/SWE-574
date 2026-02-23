package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.JoinRequestsApi
import com.hive.hive_app.data.api.dto.JoinRequestCreate
import com.hive.hive_app.data.api.dto.JoinRequestListResponse
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.JoinRequestUpdate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class JoinRequestsRepository @Inject constructor(
    private val api: JoinRequestsApi
) {
    suspend fun create(serviceId: String, message: String? = null): Result<JoinRequestResponse> {
        return try {
            val response = api.create(JoinRequestCreate(serviceId = serviceId, message = message))
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(retrofit2.HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyRequests(page: Int = 1, limit: Int = 20, status: String? = null): Result<JoinRequestListResponse> {
        return try {
            val response = api.getMyRequests(page = page, limit = limit, status = status)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(retrofit2.HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getServiceRequests(serviceId: String, page: Int = 1, limit: Int = 20): Result<JoinRequestListResponse> {
        return try {
            val response = api.getServiceRequests(serviceId, page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(retrofit2.HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateStatus(requestId: String, status: String, adminMessage: String? = null): Result<JoinRequestResponse> {
        return try {
            val response = api.updateStatus(requestId, JoinRequestUpdate(status = status, adminMessage = adminMessage))
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(retrofit2.HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancel(requestId: String): Result<JoinRequestResponse> {
        return try {
            val response = api.cancel(requestId)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(retrofit2.HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
