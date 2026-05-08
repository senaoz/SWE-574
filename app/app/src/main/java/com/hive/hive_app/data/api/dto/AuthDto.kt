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
data class SocialLinks(
    val linkedin: String? = null,
    val github: String? = null,
    val twitter: String? = null,
    val instagram: String? = null,
    val website: String? = null,
    val portfolio: String? = null
)

@JsonClass(generateAdapter = true)
data class UserResponse(
    val _id: String,
    val username: String,
    val email: String,
    @Json(name = "full_name") val fullName: String? = null,
    val bio: String? = null,
    val location: String? = null,
    @Json(name = "profile_picture") val profilePicture: String? = null,
    @Json(name = "social_links") val socialLinks: SocialLinks? = null,
    val interests: List<String>? = null,
    @Json(name = "is_active") val isActive: Boolean = true,
    @Json(name = "is_verified") val isVerified: Boolean = false,
    val role: String = "user",
    @Json(name = "profile_visible") val profileVisible: Boolean = true,
    @Json(name = "show_email") val showEmail: Boolean = false,
    @Json(name = "show_location") val showLocation: Boolean = true,
    @Json(name = "email_notifications") val emailNotifications: Boolean = true,
    @Json(name = "service_matches_notifications") val serviceMatchesNotifications: Boolean = true,
    @Json(name = "messages_notifications") val messagesNotifications: Boolean = true,
    @Json(name = "timebank_balance") val timebankBalance: Double = 0.0,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class UserUpdate(
    val username: String? = null,
    @Json(name = "full_name") val fullName: String? = null,
    val bio: String? = null,
    val location: String? = null,
    @Json(name = "profile_picture") val profilePicture: String? = null,
    @Json(name = "social_links") val socialLinks: SocialLinks? = null,
    val interests: List<String>? = null
)

@JsonClass(generateAdapter = true)
data class UserSettingsUpdate(
    @Json(name = "profile_visible") val profileVisible: Boolean? = null,
    @Json(name = "show_email") val showEmail: Boolean? = null,
    @Json(name = "show_location") val showLocation: Boolean? = null,
    @Json(name = "email_notifications") val emailNotifications: Boolean? = null,
    @Json(name = "service_matches_notifications") val serviceMatchesNotifications: Boolean? = null,
    @Json(name = "messages_notifications") val messagesNotifications: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class PasswordChange(
    @Json(name = "current_password") val currentPassword: String,
    @Json(name = "new_password") val newPassword: String,
    @Json(name = "confirm_password") val confirmPassword: String
)

@JsonClass(generateAdapter = true)
data class AccountDeletion(
    val password: String
)
