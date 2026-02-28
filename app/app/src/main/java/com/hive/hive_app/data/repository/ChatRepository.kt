package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.ChatApi
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageCreate
import com.hive.hive_app.data.api.dto.MessageListResponse
import com.hive.hive_app.data.api.dto.ChatRoomListResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import javax.inject.Inject
import javax.inject.Singleton
import retrofit2.HttpException

@Singleton
class ChatRepository @Inject constructor(
    private val api: ChatApi
) {
    suspend fun getRooms(page: Int = 1, limit: Int = 20): Result<ChatRoomListResponse> {
        return try {
            val response = api.getRooms(page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRoom(roomId: String): Result<ChatRoomResponse?> {
        return try {
            val response = api.getRoom(roomId)
            when {
                response.isSuccessful && response.body() != null -> Result.success(response.body())
                response.code() == 404 -> Result.success(null)
                else -> Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /** Create or get chat room for a transaction. Backend may return existing room. */
    suspend fun createRoomForTransaction(transactionId: String): Result<ChatRoomResponse> {
        return try {
            val response = api.createRoomForTransaction(transactionId)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMessages(roomId: String, page: Int = 1, limit: Int = 50): Result<MessageListResponse> {
        return try {
            val response = api.getMessages(roomId, page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendMessage(roomId: String, content: String): Result<MessageResponse> {
        return try {
            val response = api.sendMessage(MessageCreate(roomId = roomId, content = content))
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
