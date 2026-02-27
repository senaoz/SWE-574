package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class BadgesResponse(
    val badges: List<BadgeEntry>? = null,
    @Json(name = "earned_count") val earnedCount: Int? = null,
    @Json(name = "total_count") val totalCount: Int? = null
)

@JsonClass(generateAdapter = true)
data class BadgeEntry(
    val key: String? = null,
    val name: String? = null,
    val description: String? = null,
    val icon: String? = null,
    val earned: Boolean = false,
    val progress: BadgeProgress? = null
)

@JsonClass(generateAdapter = true)
data class BadgeProgress(
    val current: Double = 0.0,
    val target: Double = 1.0
)
