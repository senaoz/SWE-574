package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.CommunityApi
import com.hive.hive_app.data.api.dto.CommunityCreate
import com.hive.hive_app.data.api.dto.CommunityListResponse
import com.hive.hive_app.data.api.dto.CommunityPostCreate
import com.hive.hive_app.data.api.dto.CommunityPostListResponse
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.ForumUserEmbed
import com.hive.hive_app.data.api.dto.UpvoteResponse
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CommunityRepository @Inject constructor(
    private val communityApi: CommunityApi
) {
    suspend fun listCommunities(
        page: Int = 1,
        limit: Int = 20,
        q: String? = null,
        sortBy: String? = "member_count",
        myOnly: Boolean? = null
    ): Result<CommunityListResponse> = runCatching {
        val resp = communityApi.listCommunities(page, limit, q, sortBy, myOnly)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun createCommunity(body: CommunityCreate): Result<CommunityResponse> = runCatching {
        val resp = communityApi.createCommunity(body)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun getCommunity(id: String): Result<CommunityResponse> = runCatching {
        val resp = communityApi.getCommunity(id)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun joinCommunity(id: String): Result<CommunityResponse> = runCatching {
        val resp = communityApi.joinCommunity(id)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun leaveCommunity(id: String): Result<CommunityResponse> = runCatching {
        val resp = communityApi.leaveCommunity(id)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun getCommunityPosts(
        communityId: String,
        page: Int = 1,
        limit: Int = 20,
        sortBy: String = "created_at"
    ): Result<CommunityPostListResponse> = runCatching {
        val resp = communityApi.getCommunityPosts(communityId, page, limit, sortBy)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun createCommunityPost(
        communityId: String,
        body: CommunityPostCreate
    ): Result<CommunityPostResponse> = runCatching {
        val resp = communityApi.createCommunityPost(communityId, body)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun upvotePost(communityId: String, postId: String): Result<UpvoteResponse> = runCatching {
        val resp = communityApi.upvotePost(communityId, postId)
        if (resp.isSuccessful) resp.body()!! else throw HttpException(resp)
    }

    suspend fun getCommunityMembers(communityId: String): Result<List<ForumUserEmbed>> = runCatching {
        val resp = communityApi.getCommunityMembers(communityId)
        if (!resp.isSuccessful) throw HttpException(resp)
        val body = resp.body()
        body?.members?.mapNotNull { it.user } ?: emptyList()
    }
}
