package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Body

interface UsersApi {
    @GET("users/profile")
    suspend fun getProfile(): Response<UserResponse>

    @GET("users/timebank")
    suspend fun getTimeBank(): Response<TimeBankResponse>

    @GET("users/{user_id}")
    suspend fun getUser(@Path("user_id") userId: String): Response<UserResponse>

    @PUT("users/profile")
    suspend fun updateProfile(@Body body: Map<String, Any?>): Response<UserResponse>
}
