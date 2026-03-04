package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class RatingListResponse(
    val ratings: List<RatingResponse>? = null,
    val total: Int = 0,
    @Json(name = "average_score") val averageScore: Double? = null
)

@JsonClass(generateAdapter = true)
data class RatingResponse(
    val _id: String? = null,
    @Json(name = "transaction_id") val transactionId: String? = null,
    @Json(name = "rater_id") val raterId: String? = null,
    @Json(name = "rated_user_id") val ratedUserId: String? = null,
    val score: Int = 0,
    val comment: String? = null,
    @Json(name = "created_at") val createdAt: String? = null
)
