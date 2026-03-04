package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.RatingsApi
import com.hive.hive_app.data.api.dto.RatingListResponse
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RatingsRepository @Inject constructor(
    private val api: RatingsApi
) {
    suspend fun getUserRatings(userId: String, page: Int = 1, limit: Int = 20): Result<RatingListResponse> {
        return try {
            val response = api.getUserRatings(userId, page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
