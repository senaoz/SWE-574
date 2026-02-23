package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class TimeBankTransaction(
    val _id: String,
    @Json(name = "user_id") val userId: String,
    val amount: Double,
    val description: String,
    @Json(name = "service_id") val serviceId: String? = null,
    @Json(name = "created_at") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class TimeBankResponse(
    val balance: Double,
    val transactions: List<TimeBankTransaction>,
    @Json(name = "max_balance") val maxBalance: Double? = 10.0,
    @Json(name = "can_earn") val canEarn: Boolean? = true
)
