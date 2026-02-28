package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.ForumApi
import com.hive.hive_app.data.api.dto.ForumCommentCreate
import com.hive.hive_app.data.api.dto.ForumCommentListResponse
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionCreate
import com.hive.hive_app.data.api.dto.ForumDiscussionListResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionUpdate
import com.hive.hive_app.data.api.dto.ForumEventCreate
import com.hive.hive_app.data.api.dto.ForumEventListResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ForumEventUpdate
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ForumRepository @Inject constructor(
    private val forumApi: ForumApi
) {

    suspend fun listDiscussions(
        page: Int = 1,
        limit: Int = 20,
        tag: String? = null,
        q: String? = null
    ): Result<ForumDiscussionListResponse> {
        return try {
            val response = forumApi.listDiscussions(page = page, limit = limit, tag = tag, q = q)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDiscussion(discussionId: String): Result<ForumDiscussionResponse> {
        return try {
            val response = forumApi.getDiscussion(discussionId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createDiscussion(
        title: String,
        body: String,
        tags: List<com.hive.hive_app.data.api.dto.TagDto>? = null
    ): Result<ForumDiscussionResponse> {
        return try {
            val bodyReq = ForumDiscussionCreate(title = title, body = body, tags = tags)
            val response = forumApi.createDiscussion(bodyReq)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateDiscussion(
        discussionId: String,
        update: ForumDiscussionUpdate
    ): Result<ForumDiscussionResponse> {
        return try {
            val response = forumApi.updateDiscussion(discussionId, update)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteDiscussion(discussionId: String): Result<Unit> {
        return try {
            val response = forumApi.deleteDiscussion(discussionId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listEvents(
        page: Int = 1,
        limit: Int = 100,
        tag: String? = null,
        q: String? = null,
        hasLocation: Boolean? = null
    ): Result<ForumEventListResponse> {
        return try {
            val response = forumApi.listEvents(page = page, limit = limit, tag = tag, q = q, hasLocation = hasLocation)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEvent(eventId: String): Result<ForumEventResponse> {
        return try {
            val response = forumApi.getEvent(eventId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createEvent(
        title: String,
        description: String,
        eventAt: String,
        location: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        isRemote: Boolean = false,
        tags: List<com.hive.hive_app.data.api.dto.TagDto>? = null,
        serviceId: String? = null
    ): Result<ForumEventResponse> {
        return try {
            val body = ForumEventCreate(
                title = title,
                description = description,
                eventAt = eventAt,
                location = location,
                latitude = latitude,
                longitude = longitude,
                isRemote = isRemote,
                tags = tags,
                serviceId = serviceId
            )
            val response = forumApi.createEvent(body)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listComments(
        targetType: String,
        targetId: String,
        page: Int = 1,
        limit: Int = 20
    ): Result<ForumCommentListResponse> {
        return try {
            val response = forumApi.listComments(
                targetType = targetType,
                targetId = targetId,
                page = page,
                limit = limit
            )
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
        targetType: String,
        targetId: String,
        content: String
    ): Result<ForumCommentResponse> {
        return try {
            val body = ForumCommentCreate(
                targetType = targetType,
                targetId = targetId,
                content = content
            )
            val response = forumApi.createComment(body)
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
