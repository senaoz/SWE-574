package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.NotificationsApi
import com.hive.hive_app.data.api.dto.NotificationListResponse
import com.hive.hive_app.data.api.dto.NotificationResponse
import com.hive.hive_app.data.api.dto.UnreadCountResponse
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationsRepository @Inject constructor(
    private val api: NotificationsApi
) {
    suspend fun getNotifications(page: Int = 1, limit: Int = 20): Result<NotificationListResponse> {
        return try {
            val response = api.getNotifications(page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUnreadCount(): Result<UnreadCountResponse> {
        return try {
            val response = api.getUnreadCount()
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markRead(id: String): Result<NotificationResponse> {
        return try {
            val response = api.markRead(id)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllRead(): Result<Unit> {
        return try {
            val response = api.markAllRead()
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
