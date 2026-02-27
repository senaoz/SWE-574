package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.UsersApi
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.PasswordChange
import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.api.dto.UserSettingsUpdate
import com.hive.hive_app.data.api.dto.UserUpdate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsersRepository @Inject constructor(
    private val api: UsersApi
) {
    suspend fun getProfile(): Result<UserResponse> = runCatching {
        val r = api.getProfile()
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun updateProfile(update: UserUpdate): Result<UserResponse> = runCatching {
        val r = api.updateProfile(update)
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun getTimeBank(): Result<TimeBankResponse> = runCatching {
        val r = api.getTimeBank()
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun getMyBadges(): Result<BadgesResponse?> = runCatching {
        val r = api.getMyBadges()
        if (r.isSuccessful) r.body() else throw retrofit2.HttpException(r)
    }

    suspend fun getAvailableInterests(): Result<List<String>> = runCatching {
        val r = api.getAvailableInterests()
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun getSettings(): Result<UserResponse> = runCatching {
        val r = api.getSettings()
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun updateSettings(update: UserSettingsUpdate): Result<UserResponse> = runCatching {
        val r = api.updateSettings(update)
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }

    suspend fun changePassword(currentPassword: String, newPassword: String, confirmPassword: String): Result<Unit> = runCatching {
        val r = api.changePassword(PasswordChange(currentPassword, newPassword, confirmPassword))
        if (r.isSuccessful) Unit else throw retrofit2.HttpException(r)
    }

    suspend fun deleteAccount(password: String): Result<Unit> = runCatching {
        val r = api.deleteAccount(com.hive.hive_app.data.api.dto.AccountDeletion(password))
        if (r.isSuccessful) Unit else throw retrofit2.HttpException(r)
    }

    suspend fun getUser(userId: String): Result<UserResponse> = runCatching {
        val r = api.getUser(userId)
        if (r.isSuccessful && r.body() != null) r.body()!! else throw retrofit2.HttpException(r)
    }
}
