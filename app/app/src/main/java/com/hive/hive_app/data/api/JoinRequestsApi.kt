package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.JoinRequestCreate
import com.hive.hive_app.data.api.dto.JoinRequestListResponse
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.JoinRequestUpdate
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface JoinRequestsApi {
    @POST("join-requests/")
    suspend fun create(@Body body: JoinRequestCreate): Response<JoinRequestResponse>

    @GET("join-requests/my-requests")
    suspend fun getMyRequests(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null
    ): Response<JoinRequestListResponse>

    @GET("join-requests/service/{service_id}")
    suspend fun getServiceRequests(
        @Path("service_id") serviceId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<JoinRequestListResponse>

    @GET("join-requests/{request_id}")
    suspend fun getRequest(@Path("request_id") requestId: String): Response<JoinRequestResponse>

    @PUT("join-requests/{request_id}")
    suspend fun updateStatus(
        @Path("request_id") requestId: String,
        @Body body: JoinRequestUpdate
    ): Response<JoinRequestResponse>

    @POST("join-requests/{request_id}/cancel")
    suspend fun cancel(@Path("request_id") requestId: String): Response<JoinRequestResponse>
}
