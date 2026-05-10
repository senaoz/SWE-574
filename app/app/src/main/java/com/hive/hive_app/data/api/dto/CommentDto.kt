package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CommentCreate(
    val content: String,
    @Json(name = "service_id") val serviceId: String
)

@JsonClass(generateAdapter = true)
data class CommentUpdate(
    val content: String
)

@JsonClass(generateAdapter = true)
data class CommentUserEmbed(
    @Json(name = "_id") val id: String? = null,
    // Some endpoints may return `id` instead of `_id`.
    @Json(name = "id") val idAlt: String? = null,
    val username: String? = null,
    @Json(name = "full_name") val fullName: String? = null,
    @Json(name = "profile_picture") val profilePicture: String? = null
) {
    val resolvedId: String?
        get() = id ?: idAlt
}

@JsonClass(generateAdapter = true)
data class CommentResponse(
    val content: String,
    @Json(name = "service_id") val serviceId: String,
    @Json(name = "_id") val id: String,
    @Json(name = "user_id") val userId: String,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: CommentUserEmbed? = null
)

@JsonClass(generateAdapter = true)
data class CommentListResponse(
    val comments: List<CommentResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

