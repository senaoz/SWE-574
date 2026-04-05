package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.NotificationListResponse
import com.hive.hive_app.data.api.dto.NotificationResponse
import com.hive.hive_app.data.api.dto.UnreadCountResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationsApi {
    @GET("notifications/")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<NotificationListResponse>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): Response<UnreadCountResponse>

    @PUT("notifications/{id}/read")
    suspend fun markRead(@Path("id") id: String): Response<NotificationResponse>

    @PUT("notifications/read-all")
    suspend fun markAllRead(): Response<Unit>
}
