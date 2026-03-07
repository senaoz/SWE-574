package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.AuthResponse
import com.hive.hive_app.data.api.dto.UserCreate
import com.hive.hive_app.data.api.dto.UserLogin
import com.hive.hive_app.data.api.dto.UserResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body body: UserLogin): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body body: UserCreate): Response<AuthResponse>

    @GET("auth/me")
    suspend fun me(): Response<UserResponse>
}
