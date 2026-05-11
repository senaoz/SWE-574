package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MoshiDtoTest {
    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Test
    fun parsesTagDtoBackendAndLegacyIdentityFields() {
        val adapter = moshi.adapter(TagDto::class.java)

        val tag = adapter.fromJson(
            """
            {
              "entityId": "Q638",
              "id": "legacy-id",
              "label": "Music",
              "description": "art form"
            }
            """.trimIndent()
        )

        assertEquals("Q638", tag?.entityId)
        assertEquals("legacy-id", tag?.id)
        assertEquals("Music", tag?.label)
        assertEquals("art form", tag?.description)
    }

    @Test
    fun serializesServiceCreateWithBackendFieldNames() {
        val adapter = moshi.adapter(ServiceCreate::class.java)
        val json = adapter.toJson(
            ServiceCreate(
                title = "Guitar lesson",
                description = "Beginner lesson",
                tags = listOf(TagDto(entityId = "Q638", label = "Music")),
                estimatedDuration = 2.5,
                location = LocationDto(latitude = 41.0, longitude = 29.0, address = "Kadikoy"),
                city = "Istanbul",
                serviceType = "offer",
                maxParticipants = 3,
                schedulingType = "specific",
                specificDate = "2026-06-01",
                specificTime = "10:00",
                imageUrls = listOf("image.jpg"),
                isRemote = true
            )
        )

        assertTrue(json.contains("\"estimated_duration\":2.5"))
        assertTrue(json.contains("\"service_type\":\"offer\""))
        assertTrue(json.contains("\"max_participants\":3"))
        assertTrue(json.contains("\"scheduling_type\":\"specific\""))
        assertTrue(json.contains("\"specific_date\":\"2026-06-01\""))
        assertTrue(json.contains("\"specific_time\":\"10:00\""))
        assertTrue(json.contains("\"image_urls\":[\"image.jpg\"]"))
        assertTrue(json.contains("\"is_remote\":true"))
        assertTrue(json.contains("\"entityId\":\"Q638\""))
        assertFalse(json.contains("\"estimatedDuration\""))
        assertFalse(json.contains("\"serviceType\""))
    }

    @Test
    fun parsesServiceResponseFromBackendFieldNames() {
        val adapter = moshi.adapter(ServiceResponse::class.java)

        val service = adapter.fromJson(
            """
            {
              "_id": "service-1",
              "title": "Guitar lesson",
              "description": "Beginner lesson",
              "tags": [],
              "estimated_duration": 1.5,
              "location": { "latitude": 41.0, "longitude": 29.0, "address": "Kadikoy" },
              "service_type": "need",
              "max_participants": 2,
              "user_id": "user-1",
              "status": "active",
              "is_pinned": true,
              "created_at": "2026-01-01T00:00:00",
              "updated_at": "2026-01-02T00:00:00",
              "scheduling_type": "open",
              "open_availability": "Weekends",
              "image_urls": ["one.jpg", "two.jpg"],
              "is_remote": false
            }
            """.trimIndent()
        )

        assertEquals("service-1", service?.`_id`)
        assertEquals(1.5, service?.estimatedDuration ?: 0.0, 0.0)
        assertEquals("need", service?.serviceType)
        assertEquals(2, service?.maxParticipants)
        assertEquals("user-1", service?.userId)
        assertEquals(true, service?.isPinned)
        assertEquals("open", service?.schedulingType)
        assertEquals("Weekends", service?.openAvailability)
        assertEquals(listOf("one.jpg", "two.jpg"), service?.imageUrls)
        assertEquals(false, service?.isRemote)
    }

    @Test
    fun parsesForumEventResponseFromBackendFieldNames() {
        val adapter = moshi.adapter(ForumEventResponse::class.java)

        val event = adapter.fromJson(
            """
            {
              "_id": "event-1",
              "user_id": "user-1",
              "title": "Neighborhood Jam",
              "description": "Bring an instrument",
              "event_at": "2026-06-01T15:30:00",
              "community_id": "community-1",
              "location": "Kadikoy",
              "latitude": 40.99,
              "longitude": 29.03,
              "is_remote": false,
              "tags": [{ "entityId": "Q638", "label": "Music" }],
              "service_id": "service-1",
              "image_urls": ["event.jpg"],
              "banner_image_url": "banner.jpg",
              "created_at": "2026-05-01T00:00:00",
              "updated_at": "2026-05-02T00:00:00",
              "comment_count": 4,
              "attendee_ids": ["user-2"],
              "attendee_count": 1,
              "is_pinned": true
            }
            """.trimIndent()
        )

        assertEquals("event-1", event?.id)
        assertEquals("user-1", event?.userId)
        assertEquals("2026-06-01T15:30:00", event?.eventAt)
        assertEquals("community-1", event?.communityId)
        assertEquals("service-1", event?.serviceId)
        assertEquals(listOf("event.jpg"), event?.imageUrls)
        assertEquals("banner.jpg", event?.bannerImageUrl)
        assertEquals(4, event?.commentCount)
        assertEquals(listOf("user-2"), event?.attendeeIds)
        assertEquals(1, event?.attendeeCount)
        assertEquals(true, event?.isPinned)
    }

    @Test
    fun parsesNotificationResponseFromBackendFieldNames() {
        val adapter = moshi.adapter(NotificationResponse::class.java)

        val notification = adapter.fromJson(
            """
            {
              "_id": "notification-1",
              "user_id": "user-1",
              "type": "comment",
              "title": "New comment",
              "body": "Someone replied",
              "related_id": "discussion-1",
              "related_type": "discussion",
              "is_read": true,
              "created_at": "2026-05-01T10:00:00"
            }
            """.trimIndent()
        )

        assertEquals("notification-1", notification?.id)
        assertEquals("user-1", notification?.userId)
        assertEquals("discussion-1", notification?.relatedId)
        assertEquals("discussion", notification?.relatedType)
        assertEquals(true, notification?.isRead)
        assertEquals("2026-05-01T10:00:00", notification?.createdAt)
    }
}
