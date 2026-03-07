package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.RatingCreate
import com.hive.hive_app.data.api.dto.RatingListResponse
import com.hive.hive_app.data.api.dto.RatingResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface RatingsApi {
    @GET("ratings/user/{user_id}")
    suspend fun getUserRatings(
        @Path("user_id") userId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<RatingListResponse>

    @POST("ratings/")
    suspend fun createRating(@Body body: RatingCreate): Response<RatingResponse>

    @GET("ratings/transaction/{transaction_id}")
    suspend fun getTransactionRatings(@Path("transaction_id") transactionId: String): Response<List<RatingResponse>>
}
