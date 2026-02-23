package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.ServiceCreate
import com.hive.hive_app.data.api.dto.ServiceListResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ServicesApi {
    @GET("services/")
    suspend fun getServices(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("service_type") serviceType: String? = null,
        @Query("category") category: String? = null,
        @Query("tags") tags: String? = null,
        @Query("service_status") serviceStatus: String? = null,
        @Query("latitude") latitude: Double? = null,
        @Query("longitude") longitude: Double? = null,
        @Query("radius") radius: Double? = null,
        @Query("user_id") userId: String? = null
    ): Response<ServiceListResponse>

    @GET("services/{service_id}")
    suspend fun getService(@Path("service_id") serviceId: String): Response<ServiceResponse>

    @POST("services/")
    suspend fun createService(@Body body: ServiceCreate): Response<ServiceResponse>

    @PUT("services/{service_id}")
    suspend fun updateService(
        @Path("service_id") serviceId: String,
        @Body body: com.hive.hive_app.data.api.dto.ServiceUpdate
    ): Response<ServiceResponse>

    @DELETE("services/{service_id}")
    suspend fun deleteService(@Path("service_id") serviceId: String): Response<Unit>
}
