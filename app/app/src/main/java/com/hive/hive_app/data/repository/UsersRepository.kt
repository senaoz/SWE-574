package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.UsersApi
import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsersRepository @Inject constructor(
    private val api: UsersApi
) {
    suspend fun getProfile(): Result<UserResponse> {
        return try {
            val r = api.getProfile()
            if (r.isSuccessful && r.body() != null) Result.success(r.body()!!)
            else Result.failure(retrofit2.HttpException(r))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTimeBank(): Result<TimeBankResponse> {
        return try {
            val r = api.getTimeBank()
            if (r.isSuccessful && r.body() != null) Result.success(r.body()!!)
            else Result.failure(retrofit2.HttpException(r))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUser(userId: String): Result<UserResponse> {
        return try {
            val r = api.getUser(userId)
            if (r.isSuccessful && r.body() != null) Result.success(r.body()!!)
            else Result.failure(retrofit2.HttpException(r))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
