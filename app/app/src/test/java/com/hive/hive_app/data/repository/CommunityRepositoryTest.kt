package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.CommunityApi
import com.hive.hive_app.data.api.dto.CommunityCreate
import com.hive.hive_app.data.api.dto.CommunityListResponse
import com.hive.hive_app.data.api.dto.CommunityMemberListResponse
import com.hive.hive_app.data.api.dto.CommunityMemberResponse
import com.hive.hive_app.data.api.dto.CommunityPostCreate
import com.hive.hive_app.data.api.dto.CommunityPostListResponse
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.ForumUserEmbed
import com.hive.hive_app.data.api.dto.UpvoteResponse
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response

class CommunityRepositoryTest {
    @Test
    fun getCommunityMembersMapsNestedUsersAndFiltersMissingUsers() = runBlocking {
        val alice = ForumUserEmbed(id = "user-1", username = "alice", fullName = "Alice")
        val api = FakeCommunityApi(
            membersResponse = Response.success(
                CommunityMemberListResponse(
                    members = listOf(
                        member("member-1", alice),
                        member("member-2", user = null)
                    ),
                    total = 2
                )
            )
        )
        val repository = CommunityRepository(api)

        val result = repository.getCommunityMembers("community-1")

        assertTrue(result.isSuccess)
        assertEquals(listOf(alice), result.getOrThrow())
        assertEquals("community-1", api.lastMembersCommunityId)
    }

    @Test
    fun getCommunityMembersReturnsEmptyListWhenBodyIsMissing() = runBlocking {
        val api = FakeCommunityApi(membersResponse = Response.success(null))
        val repository = CommunityRepository(api)

        val result = repository.getCommunityMembers("community-1")

        assertTrue(result.isSuccess)
        assertEquals(emptyList<ForumUserEmbed>(), result.getOrThrow())
    }

    @Test
    fun getCommunityMembersReturnsFailureForHttpError() = runBlocking {
        val api = FakeCommunityApi(membersResponse = errorResponse())
        val repository = CommunityRepository(api)

        val result = repository.getCommunityMembers("community-1")

        assertTrue(result.isFailure)
    }

    private class FakeCommunityApi(
        private val membersResponse: Response<CommunityMemberListResponse> = Response.success(
            CommunityMemberListResponse()
        )
    ) : CommunityApi {
        var lastMembersCommunityId: String? = null

        override suspend fun getCommunityMembers(
            communityId: String
        ): Response<CommunityMemberListResponse> {
            lastMembersCommunityId = communityId
            return membersResponse
        }

        override suspend fun listCommunities(
            page: Int,
            limit: Int,
            q: String?,
            sortBy: String?,
            myOnly: Boolean?
        ): Response<CommunityListResponse> = unused()

        override suspend fun createCommunity(
            body: CommunityCreate
        ): Response<CommunityResponse> = unused()

        override suspend fun getCommunity(
            communityId: String
        ): Response<CommunityResponse> = unused()

        override suspend fun pinCommunity(
            communityId: String,
            pinned: Boolean
        ): Response<CommunityResponse> = unused()

        override suspend fun joinCommunity(
            communityId: String
        ): Response<CommunityResponse> = unused()

        override suspend fun leaveCommunity(
            communityId: String
        ): Response<CommunityResponse> = unused()

        override suspend fun getCommunityPosts(
            communityId: String,
            page: Int,
            limit: Int,
            sortBy: String?
        ): Response<CommunityPostListResponse> = unused()

        override suspend fun createCommunityPost(
            communityId: String,
            body: CommunityPostCreate
        ): Response<CommunityPostResponse> = unused()

        override suspend fun upvotePost(
            communityId: String,
            postId: String
        ): Response<UpvoteResponse> = unused()

        override suspend fun pinPost(
            communityId: String,
            postId: String,
            pinned: Boolean
        ): Response<CommunityPostResponse> = unused()

        private fun <T> unused(): Response<T> {
            throw UnsupportedOperationException("Unused in this test")
        }
    }

    companion object {
        private fun member(
            id: String,
            user: ForumUserEmbed?
        ) = CommunityMemberResponse(
            id = id,
            communityId = "community-1",
            userId = user?.resolvedId ?: "missing-user",
            user = user
        )

        private fun <T> errorResponse(): Response<T> =
            Response.error(
                500,
                """{"detail":"server error"}""".toResponseBody("application/json".toMediaType())
            )
    }
}
