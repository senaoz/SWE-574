package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.api.dto.UserUpdate
import com.hive.hive_app.data.api.dto.UserSettingsUpdate
import com.hive.hive_app.data.api.dto.PasswordChange
import com.hive.hive_app.data.api.dto.AccountDeletion
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.POST
import retrofit2.http.Path

interface UsersApi {
    @GET("users/profile")
    suspend fun getProfile(): Response<UserResponse>

    @PUT("users/profile")
    suspend fun updateProfile(@Body body: UserUpdate): Response<UserResponse>

    @GET("users/timebank")
    suspend fun getTimeBank(): Response<TimeBankResponse>

    @GET("users/badges")
    suspend fun getMyBadges(): Response<BadgesResponse>

    @GET("users/available-interests")
    suspend fun getAvailableInterests(): Response<List<String>>

    @GET("users/settings")
    suspend fun getSettings(): Response<UserResponse>

    @PUT("users/settings")
    suspend fun updateSettings(@Body body: UserSettingsUpdate): Response<UserResponse>

    @POST("users/change-password")
    suspend fun changePassword(@Body body: PasswordChange): Response<Unit>

    @POST("users/account/delete")
    suspend fun deleteAccount(@Body body: AccountDeletion): Response<Unit>

    @GET("users/{user_id}")
    suspend fun getUser(@Path("user_id") userId: String): Response<UserResponse>
}
