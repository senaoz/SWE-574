package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.ChatRoomListResponse
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageCreate
import com.hive.hive_app.data.api.dto.MessageListResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ChatApi {
    @GET("chat/rooms")
    suspend fun getRooms(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ChatRoomListResponse>

    @GET("chat/rooms/{room_id}")
    suspend fun getRoom(@Path("room_id") roomId: String): Response<ChatRoomResponse>

    @POST("chat/rooms/transaction/{transaction_id}")
    suspend fun createRoomForTransaction(@Path("transaction_id") transactionId: String): Response<ChatRoomResponse>

    @GET("chat/rooms/{room_id}/messages")
    suspend fun getMessages(
        @Path("room_id") roomId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<MessageListResponse>

    @POST("chat/messages")
    suspend fun sendMessage(@Body body: MessageCreate): Response<MessageResponse>
}
