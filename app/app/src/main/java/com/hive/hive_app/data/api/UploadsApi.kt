package com.hive.hive_app.data.api

import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UploadsApi {
    @Multipart
    @POST("upload/service-image")
    suspend fun uploadServiceImage(
        @Part file: MultipartBody.Part
    ): Response<ResponseBody>

    /** OpenAPI: Upload an image for a rating/feedback. Returns the URL. */
    @Multipart
    @POST("upload/rating-image")
    suspend fun uploadRatingImage(
        @Part file: MultipartBody.Part
    ): Response<ResponseBody>

    /** OpenAPI: Upload an image for a forum event. Returns the URL/path. */
    @Multipart
    @POST("upload/forum-event-image")
    suspend fun uploadForumEventImage(
        @Part file: MultipartBody.Part
    ): Response<ResponseBody>
}

