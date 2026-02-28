package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.ForumCommentCreate
import com.hive.hive_app.data.api.dto.ForumCommentListResponse
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumCommentUpdate
import com.hive.hive_app.data.api.dto.ForumDiscussionCreate
import com.hive.hive_app.data.api.dto.ForumDiscussionListResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionUpdate
import com.hive.hive_app.data.api.dto.ForumEventCreate
import com.hive.hive_app.data.api.dto.ForumEventListResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ForumEventUpdate
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ForumApi {

    @GET("forum/discussions")
    suspend fun listDiscussions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("tag") tag: String? = null,
        @Query("q") q: String? = null
    ): Response<ForumDiscussionListResponse>

    @POST("forum/discussions")
    suspend fun createDiscussion(@Body body: ForumDiscussionCreate): Response<ForumDiscussionResponse>

    @GET("forum/discussions/{discussion_id}")
    suspend fun getDiscussion(@Path("discussion_id") discussionId: String): Response<ForumDiscussionResponse>

    @PUT("forum/discussions/{discussion_id}")
    suspend fun updateDiscussion(
        @Path("discussion_id") discussionId: String,
        @Body body: ForumDiscussionUpdate
    ): Response<ForumDiscussionResponse>

    @DELETE("forum/discussions/{discussion_id}")
    suspend fun deleteDiscussion(@Path("discussion_id") discussionId: String): Response<Unit>

    @GET("forum/events")
    suspend fun listEvents(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100,
        @Query("tag") tag: String? = null,
        @Query("q") q: String? = null,
        @Query("has_location") hasLocation: Boolean? = null
    ): Response<ForumEventListResponse>

    @POST("forum/events")
    suspend fun createEvent(@Body body: ForumEventCreate): Response<ForumEventResponse>

    @GET("forum/events/{event_id}")
    suspend fun getEvent(@Path("event_id") eventId: String): Response<ForumEventResponse>

    @PUT("forum/events/{event_id}")
    suspend fun updateEvent(
        @Path("event_id") eventId: String,
        @Body body: ForumEventUpdate
    ): Response<ForumEventResponse>

    @DELETE("forum/events/{event_id}")
    suspend fun deleteEvent(@Path("event_id") eventId: String): Response<Unit>

    @GET("forum/comments")
    suspend fun listComments(
        @Query("target_type") targetType: String,
        @Query("target_id") targetId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ForumCommentListResponse>

    @POST("forum/comments")
    suspend fun createComment(@Body body: ForumCommentCreate): Response<ForumCommentResponse>

    @PUT("forum/comments/{comment_id}")
    suspend fun updateComment(
        @Path("comment_id") commentId: String,
        @Body body: ForumCommentUpdate
    ): Response<ForumCommentResponse>

    @DELETE("forum/comments/{comment_id}")
    suspend fun deleteComment(@Path("comment_id") commentId: String): Response<Unit>
}
