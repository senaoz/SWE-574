package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class UserLogin(
    val email: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class UserCreate(
    val username: String,
    val email: String,
    val password: String,
    @Json(name = "confirm_password") val confirmPassword: String,
    @Json(name = "full_name") val fullName: String? = null,
    val bio: String? = null,
    val location: String? = null
)

@JsonClass(generateAdapter = true)
data class AuthResponse(
    @Json(name = "access_token") val accessToken: String,
    @Json(name = "token_type") val tokenType: String = "bearer"
)

@JsonClass(generateAdapter = true)
data class UserResponse(
    val _id: String,
    val username: String,
    val email: String,
    @Json(name = "full_name") val fullName: String? = null,
    val bio: String? = null,
    val location: String? = null,
    @Json(name = "is_active") val isActive: Boolean = true,
    @Json(name = "is_verified") val isVerified: Boolean = false,
    val role: String = "user",
    @Json(name = "profile_visible") val profileVisible: Boolean = true,
    @Json(name = "show_email") val showEmail: Boolean = false,
    @Json(name = "show_location") val showLocation: Boolean = true,
    @Json(name = "timebank_balance") val timebankBalance: Double = 0.0,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String
)
