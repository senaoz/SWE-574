package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class TransactionResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "service_id") val serviceId: String,
    @Json(name = "provider_id") val providerId: String,
    @Json(name = "requester_id") val requesterId: String,
    @Json(name = "timebank_hours") val timebankHours: Double,
    val status: String? = null,
    val description: String? = null,
    @Json(name = "completion_notes") val completionNotes: String? = null,
    @Json(name = "dispute_reason") val disputeReason: String? = null,
    @Json(name = "created_at") val createdAt: String? = null,
    @Json(name = "updated_at") val updatedAt: String? = null,
    @Json(name = "completed_at") val completedAt: String? = null,
    @Json(name = "provider_confirmed") val providerConfirmed: Boolean? = null,
    @Json(name = "requester_confirmed") val requesterConfirmed: Boolean? = null,
    val service: Any? = null,
    val provider: Any? = null,
    val requester: Any? = null
)

@JsonClass(generateAdapter = true)
data class TransactionListResponse(
    val transactions: List<TransactionResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)
