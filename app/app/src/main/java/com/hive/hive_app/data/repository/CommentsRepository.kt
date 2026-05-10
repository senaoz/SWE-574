package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.CommentsApi
import com.hive.hive_app.data.api.dto.CommentListResponse
import com.hive.hive_app.data.api.dto.CommentResponse
import com.hive.hive_app.data.api.dto.CommentCreate
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CommentsRepository @Inject constructor(
    private val commentsApi: CommentsApi
) {

    suspend fun getServiceComments(
        serviceId: String,
        page: Int = 1,
        limit: Int = 20
    ): Result<CommentListResponse> {
        return try {
            val response = commentsApi.getServiceComments(serviceId, page, limit)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createComment(
        serviceId: String,
        content: String
    ): Result<CommentResponse> {
        return try {
            val body = CommentCreate(
                content = content,
                serviceId = serviceId
            )
            val response = commentsApi.createComment(body)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

