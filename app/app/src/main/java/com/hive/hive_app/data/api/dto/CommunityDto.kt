package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CommunityResponse(
    @Json(name = "_id") val id: String,
    val name: String,
    val slug: String,
    val description: String,
    val rules: List<String> = emptyList(),
    @Json(name = "founder_id") val founderId: String,
    val tags: List<TagDto>? = null,
    @Json(name = "cover_image_url") val coverImageUrl: String? = null,
    @Json(name = "avatar_url") val avatarUrl: String? = null,
    @Json(name = "member_count") val memberCount: Int = 0,
    @Json(name = "post_count") val postCount: Int = 0,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val founder: ForumUserEmbed? = null,
    @Json(name = "user_membership") val userMembership: String? = null
)

@JsonClass(generateAdapter = true)
data class CommunityListResponse(
    val communities: List<CommunityResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

@JsonClass(generateAdapter = true)
data class CommunityCreate(
    val name: String,
    val description: String,
    val rules: List<String> = emptyList(),
    val tags: List<TagDto>? = null
)

@JsonClass(generateAdapter = true)
data class CommunityPostResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "community_id") val communityId: String,
    @Json(name = "user_id") val userId: String,
    val title: String,
    val body: String,
    val tags: List<TagDto>? = null,
    @Json(name = "post_type") val postType: String = "post",
    @Json(name = "is_pinned") val isPinned: Boolean = false,
    @Json(name = "upvote_count") val upvoteCount: Int = 0,
    @Json(name = "user_upvoted") val userUpvoted: Boolean = false,
    @Json(name = "comment_count") val commentCount: Int = 0,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val user: ForumUserEmbed? = null
)

@JsonClass(generateAdapter = true)
data class CommunityPostListResponse(
    val posts: List<CommunityPostResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

@JsonClass(generateAdapter = true)
data class CommunityPostCreate(
    val title: String,
    val body: String,
    @Json(name = "post_type") val postType: String = "post"
)

@JsonClass(generateAdapter = true)
data class UpvoteResponse(
    @Json(name = "upvote_count") val upvoteCount: Int,
    @Json(name = "user_upvoted") val userUpvoted: Boolean
)

@JsonClass(generateAdapter = true)
data class CommunityMemberResponse(
    @Json(name = "_id") val id: String,
    @Json(name = "community_id") val communityId: String,
    @Json(name = "user_id") val userId: String,
    val role: String? = null,
    val status: String? = null,
    @Json(name = "joined_at") val joinedAt: String? = null,
    val user: ForumUserEmbed? = null
)

@JsonClass(generateAdapter = true)
data class CommunityMemberListResponse(
    val members: List<CommunityMemberResponse> = emptyList(),
    val total: Int = 0
)
