package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// --------------- Discussions ---------------

@JsonClass(generateAdapter = true)
data class ForumDiscussionCreate(
    val title: String,
    val body: String,
    val tags: List<TagDto>? = null
)

@JsonClass(generateAdapter = true)
data class ForumDiscussionUpdate(
    val title: String? = null,
    val body: String? = null,
    val tags: List<TagDto>? = null
)

@JsonClass(generateAdapter = true)
data class ForumDiscussionResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "user_id") val userId: String,
    val title: String,
    val body: String,
    val tags: List<TagDto>? = null,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: ForumUserEmbed? = null,
    @Json(name = "comment_count") val commentCount: Int = 0
)

@JsonClass(generateAdapter = true)
data class ForumDiscussionListResponse(
    val discussions: List<ForumDiscussionResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

// --------------- Comments ---------------

@JsonClass(generateAdapter = true)
data class ForumCommentCreate(
    @Json(name = "target_type") val targetType: String, // "discussion" | "event"
    @Json(name = "target_id") val targetId: String,
    val content: String
)

@JsonClass(generateAdapter = true)
data class ForumCommentUpdate(
    val content: String
)

@JsonClass(generateAdapter = true)
data class ForumCommentResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "user_id") val userId: String,
    @Json(name = "target_type") val targetType: String,
    @Json(name = "target_id") val targetId: String,
    val content: String,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: ForumUserEmbed? = null
)

@JsonClass(generateAdapter = true)
data class ForumCommentListResponse(
    val comments: List<ForumCommentResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

// --------------- Events ---------------

@JsonClass(generateAdapter = true)
data class ForumEventCreate(
    val title: String,
    val description: String,
    @Json(name = "event_at") val eventAt: String,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @Json(name = "is_remote") val isRemote: Boolean = false,
    val tags: List<TagDto>? = null,
    @Json(name = "service_id") val serviceId: String? = null
)

@JsonClass(generateAdapter = true)
data class ForumEventUpdate(
    val title: String? = null,
    val description: String? = null,
    @Json(name = "event_at") val eventAt: String? = null,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @Json(name = "is_remote") val isRemote: Boolean? = null,
    val tags: List<TagDto>? = null,
    @Json(name = "service_id") val serviceId: String? = null
)

@JsonClass(generateAdapter = true)
data class ForumEventResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "user_id") val userId: String,
    val title: String,
    val description: String,
    @Json(name = "event_at") val eventAt: String,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @Json(name = "is_remote") val isRemote: Boolean = false,
    val tags: List<TagDto>? = null,
    @Json(name = "service_id") val serviceId: String? = null,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: ForumUserEmbed? = null,
    val service: Any? = null,
    @Json(name = "comment_count") val commentCount: Int = 0
)

@JsonClass(generateAdapter = true)
data class ForumEventListResponse(
    val events: List<ForumEventResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

// --------------- Embedded user (forum responses) ---------------

@JsonClass(generateAdapter = true)
data class ForumUserEmbed(
    @Json(name = "_id") val id: String? = null,
    val username: String? = null,
    @Json(name = "full_name") val fullName: String? = null
)
