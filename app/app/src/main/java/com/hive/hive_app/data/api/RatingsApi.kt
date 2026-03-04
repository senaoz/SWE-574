package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.RatingListResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface RatingsApi {
    @GET("ratings/user/{user_id}")
    suspend fun getUserRatings(
        @Path("user_id") userId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<RatingListResponse>
}
