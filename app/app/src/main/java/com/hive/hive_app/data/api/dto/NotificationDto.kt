package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class NotificationResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "user_id") val userId: String,
    val type: String,
    val title: String,
    val body: String,
    @Json(name = "related_id") val relatedId: String? = null,
    @Json(name = "related_type") val relatedType: String? = null,
    @Json(name = "is_read") val isRead: Boolean = false,
    @Json(name = "created_at") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class NotificationListResponse(
    val notifications: List<NotificationResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

@JsonClass(generateAdapter = true)
data class UnreadCountResponse(
    val count: Int
)
