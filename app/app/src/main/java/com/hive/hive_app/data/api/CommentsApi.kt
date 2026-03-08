package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.CommentCreate
import com.hive.hive_app.data.api.dto.CommentListResponse
import com.hive.hive_app.data.api.dto.CommentResponse
import com.hive.hive_app.data.api.dto.CommentUpdate
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface CommentsApi {

    @GET("comments/service/{service_id}")
    suspend fun getServiceComments(
        @Path("service_id") serviceId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<CommentListResponse>

    @POST("comments/")
    suspend fun createComment(
        @Body body: CommentCreate
    ): Response<CommentResponse>

    @GET("comments/{comment_id}")
    suspend fun getComment(
        @Path("comment_id") commentId: String
    ): Response<CommentResponse>

    @PUT("comments/{comment_id}")
    suspend fun updateComment(
        @Path("comment_id") commentId: String,
        @Body body: CommentUpdate
    ): Response<CommentResponse>

    @DELETE("comments/{comment_id}")
    suspend fun deleteComment(
        @Path("comment_id") commentId: String
    ): Response<Unit>
}

