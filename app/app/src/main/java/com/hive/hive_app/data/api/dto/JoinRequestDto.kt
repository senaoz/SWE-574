package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class JoinRequestCreate(
    @Json(name = "service_id") val serviceId: String,
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class JoinRequestUpdate(
    val status: String,
    @Json(name = "admin_message") val adminMessage: String? = null
)

@JsonClass(generateAdapter = true)
data class JoinRequestResponse(
    @Json(name = "service_id") val serviceId: String,
    val message: String? = null,
    val _id: String,
    @Json(name = "user_id") val userId: String,
    val status: String,
    @Json(name = "admin_message") val adminMessage: String? = null,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: Any? = null
)

@JsonClass(generateAdapter = true)
data class JoinRequestListResponse(
    val requests: List<JoinRequestResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)
