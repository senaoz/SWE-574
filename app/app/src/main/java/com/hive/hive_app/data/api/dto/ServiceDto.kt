package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class TagDto(
    val id: String? = null,
    val label: String? = null,
    val name: String? = null
)

@JsonClass(generateAdapter = true)
data class LocationDto(
    val latitude: Double,
    val longitude: Double,
    val address: String? = null
)

@JsonClass(generateAdapter = true)
data class ServiceCreate(
    val title: String,
    val description: String,
    val category: String? = null,
    val tags: List<TagDto>,
    @Json(name = "estimated_duration") val estimatedDuration: Double,
    val location: LocationDto,
    val deadline: String? = null,
    @Json(name = "service_type") val serviceType: String,
    @Json(name = "max_participants") val maxParticipants: Int? = 1,
    @Json(name = "scheduling_type") val schedulingType: String? = "open",
    @Json(name = "specific_date") val specificDate: String? = null,
    @Json(name = "specific_time") val specificTime: String? = null,
    @Json(name = "open_availability") val openAvailability: String? = null
)

@JsonClass(generateAdapter = true)
data class ServiceResponse(
    val _id: String,
    val title: String,
    val description: String,
    val category: String? = null,
    val tags: List<TagDto>,
    @Json(name = "estimated_duration") val estimatedDuration: Double,
    val location: LocationDto,
    val deadline: String? = null,
    @Json(name = "service_type") val serviceType: String,
    @Json(name = "max_participants") val maxParticipants: Int? = 1,
    @Json(name = "user_id") val userId: String,
    val status: String = "active",
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    @Json(name = "completed_at") val completedAt: String? = null,
    @Json(name = "matched_user_ids") val matchedUserIds: List<String>? = null,
    @Json(name = "provider_confirmed") val providerConfirmed: Boolean? = null,
    @Json(name = "receiver_confirmed_ids") val receiverConfirmedIds: List<String>? = null,
    @Json(name = "scheduling_type") val schedulingType: String? = null,
    @Json(name = "specific_date") val specificDate: String? = null,
    @Json(name = "specific_time") val specificTime: String? = null,
    @Json(name = "open_availability") val openAvailability: String? = null
)

@JsonClass(generateAdapter = true)
data class ServiceUpdate(
    val title: String? = null,
    val description: String? = null,
    val category: String? = null,
    val tags: List<TagDto>? = null,
    @Json(name = "estimated_duration") val estimatedDuration: Double? = null,
    val location: LocationDto? = null,
    val deadline: String? = null,
    val status: String? = null,
    @Json(name = "scheduling_type") val schedulingType: String? = null,
    @Json(name = "specific_date") val specificDate: String? = null,
    @Json(name = "specific_time") val specificTime: String? = null,
    @Json(name = "open_availability") val openAvailability: String? = null
)

@JsonClass(generateAdapter = true)
data class ServiceListResponse(
    val services: List<ServiceResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)
