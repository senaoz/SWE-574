package com.hive.hive_app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ChatRoomResponse(
    val _id: String,
    @Json(name = "participant_ids") val participantIds: List<String>,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val name: String? = null,
    val description: String? = null,
    @Json(name = "is_active") val isActive: Boolean = true,
    @Json(name = "transaction_id") val transactionId: String? = null,
    @Json(name = "last_message_at") val lastMessageAt: String? = null,
    val participants: List<ChatParticipant>? = null,
    val service: Any? = null,
    val transaction: ChatRoomTransaction? = null
)

@JsonClass(generateAdapter = true)
data class ChatParticipant(
    val _id: String? = null,
    val username: String? = null,
    @Json(name = "full_name") val fullName: String? = null
)

/** Minimal transaction info for chat room (to check if exchange is completed). */
@JsonClass(generateAdapter = true)
data class ChatRoomTransaction(
    val _id: String? = null,
    val status: String? = null
)

@JsonClass(generateAdapter = true)
data class ChatRoomListResponse(
    val rooms: List<ChatRoomResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

@JsonClass(generateAdapter = true)
data class MessageCreate(
    @Json(name = "room_id") val roomId: String,
    val content: String,
    @Json(name = "message_type") val messageType: String = "text",
    @Json(name = "reply_to_message_id") val replyToMessageId: String? = null
)

@JsonClass(generateAdapter = true)
data class MessageResponse(
    val _id: String,
    @Json(name = "room_id") val roomId: String,
    @Json(name = "sender_id") val senderId: String,
    val content: String,
    @Json(name = "message_type") val messageType: String = "text",
    @Json(name = "reply_to_message_id") val replyToMessageId: String? = null,
    @Json(name = "is_edited") val isEdited: Boolean = false,
    @Json(name = "is_deleted") val isDeleted: Boolean = false,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String,
    val sender: ChatParticipant? = null
)

@JsonClass(generateAdapter = true)
data class MessageListResponse(
    val messages: List<MessageResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)
