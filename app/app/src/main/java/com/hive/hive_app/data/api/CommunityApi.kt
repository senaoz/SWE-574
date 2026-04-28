package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.CommunityCreate
import com.hive.hive_app.data.api.dto.CommunityListResponse
import com.hive.hive_app.data.api.dto.CommunityPostCreate
import com.hive.hive_app.data.api.dto.CommunityPostListResponse
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.UpvoteResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface CommunityApi {

    @GET("communities")
    suspend fun listCommunities(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("q") q: String? = null,
        @Query("sort_by") sortBy: String? = "member_count",
        @Query("my_only") myOnly: Boolean? = null
    ): Response<CommunityListResponse>

    @POST("communities")
    suspend fun createCommunity(@Body body: CommunityCreate): Response<CommunityResponse>

    @GET("communities/{community_id}")
    suspend fun getCommunity(@Path("community_id") communityId: String): Response<CommunityResponse>

    @POST("communities/{community_id}/join")
    suspend fun joinCommunity(@Path("community_id") communityId: String): Response<CommunityResponse>

    @DELETE("communities/{community_id}/leave")
    suspend fun leaveCommunity(@Path("community_id") communityId: String): Response<CommunityResponse>

    @GET("communities/{community_id}/posts")
    suspend fun getCommunityPosts(
        @Path("community_id") communityId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("sort_by") sortBy: String? = "created_at"
    ): Response<CommunityPostListResponse>

    @POST("communities/{community_id}/posts")
    suspend fun createCommunityPost(
        @Path("community_id") communityId: String,
        @Body body: CommunityPostCreate
    ): Response<CommunityPostResponse>

    @POST("communities/{community_id}/posts/{post_id}/upvote")
    suspend fun upvotePost(
        @Path("community_id") communityId: String,
        @Path("post_id") postId: String
    ): Response<UpvoteResponse>
}
