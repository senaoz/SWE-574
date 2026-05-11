package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.NotificationsApi
import com.hive.hive_app.data.api.dto.NotificationListResponse
import com.hive.hive_app.data.api.dto.NotificationResponse
import com.hive.hive_app.data.api.dto.UnreadCountResponse
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response

class NotificationsRepositoryTest {
    @Test
    fun getNotificationsWrapsSuccessfulResponse() = runBlocking {
        val notification = notification(id = "notification-1")
        val api = FakeNotificationsApi(
            notificationsResponse = Response.success(
                NotificationListResponse(
                    notifications = listOf(notification),
                    total = 1,
                    page = 2,
                    limit = 10
                )
            )
        )
        val repository = NotificationsRepository(api)

        val result = repository.getNotifications(page = 2, limit = 10)

        assertTrue(result.isSuccess)
        assertEquals(listOf(notification), result.getOrThrow().notifications)
        assertEquals(2, api.lastPage)
        assertEquals(10, api.lastLimit)
    }

    @Test
    fun getNotificationsReturnsFailureForHttpError() = runBlocking {
        val api = FakeNotificationsApi(
            notificationsResponse = errorResponse()
        )
        val repository = NotificationsRepository(api)

        val result = repository.getNotifications()

        assertTrue(result.isFailure)
    }

    @Test
    fun getUnreadCountWrapsSuccessfulResponse() = runBlocking {
        val api = FakeNotificationsApi(
            unreadCountResponse = Response.success(UnreadCountResponse(count = 4))
        )
        val repository = NotificationsRepository(api)

        val result = repository.getUnreadCount()

        assertTrue(result.isSuccess)
        assertEquals(4, result.getOrThrow().count)
    }

    @Test
    fun markReadWrapsSuccessfulResponseAndRecordsId() = runBlocking {
        val readNotification = notification(id = "notification-2", isRead = true)
        val api = FakeNotificationsApi(
            markReadResponse = Response.success(readNotification)
        )
        val repository = NotificationsRepository(api)

        val result = repository.markRead("notification-2")

        assertTrue(result.isSuccess)
        assertEquals(readNotification, result.getOrThrow())
        assertEquals("notification-2", api.lastMarkReadId)
    }

    @Test
    fun markAllReadReturnsSuccessForSuccessfulEmptyResponse() = runBlocking {
        val api = FakeNotificationsApi(markAllReadResponse = Response.success(Unit))
        val repository = NotificationsRepository(api)

        val result = repository.markAllRead()

        assertTrue(result.isSuccess)
    }

    @Test
    fun markAllReadReturnsFailureForHttpError() = runBlocking {
        val api = FakeNotificationsApi(markAllReadResponse = errorResponse())
        val repository = NotificationsRepository(api)

        val result = repository.markAllRead()

        assertTrue(result.isFailure)
    }

    private class FakeNotificationsApi(
        private val notificationsResponse: Response<NotificationListResponse> = Response.success(
            NotificationListResponse(emptyList(), total = 0, page = 1, limit = 20)
        ),
        private val unreadCountResponse: Response<UnreadCountResponse> = Response.success(
            UnreadCountResponse(count = 0)
        ),
        private val markReadResponse: Response<NotificationResponse> = Response.success(
            notification()
        ),
        private val markAllReadResponse: Response<Unit> = Response.success(Unit)
    ) : NotificationsApi {
        var lastPage: Int? = null
        var lastLimit: Int? = null
        var lastMarkReadId: String? = null

        override suspend fun getNotifications(
            page: Int,
            limit: Int
        ): Response<NotificationListResponse> {
            lastPage = page
            lastLimit = limit
            return notificationsResponse
        }

        override suspend fun getUnreadCount(): Response<UnreadCountResponse> =
            unreadCountResponse

        override suspend fun markRead(id: String): Response<NotificationResponse> {
            lastMarkReadId = id
            return markReadResponse
        }

        override suspend fun markAllRead(): Response<Unit> = markAllReadResponse
    }

    companion object {
        private fun notification(
            id: String = "notification-1",
            isRead: Boolean = false
        ) = NotificationResponse(
            id = id,
            userId = "user-1",
            type = "message",
            title = "New message",
            body = "Alice sent you a message",
            relatedId = "chat-1",
            relatedType = "chat",
            isRead = isRead,
            createdAt = "2026-05-01T10:00:00"
        )

        private fun <T> errorResponse(): Response<T> =
            Response.error(
                500,
                """{"detail":"server error"}""".toResponseBody("application/json".toMediaType())
            )
    }
}
