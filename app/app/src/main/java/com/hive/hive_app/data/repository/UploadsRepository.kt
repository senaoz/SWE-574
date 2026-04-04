package com.hive.hive_app.data.repository

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import com.hive.hive_app.data.api.UploadsApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.ResponseBody

@Singleton
class UploadsRepository @Inject constructor(
    private val uploadsApi: UploadsApi
) {
    suspend fun uploadServiceImage(context: Context, uri: Uri): Result<String> {
        return try {
            val (multipart, _) = withContext(Dispatchers.IO) {
                val contentResolver = context.contentResolver
                val mimeType = contentResolver.getType(uri) ?: "image/*"
                val mediaType = mimeType.toMediaTypeOrNull()

                val fileName = getDisplayName(context, uri) ?: "upload.jpg"
                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Unable to read image")
                val requestBody = bytes.toRequestBody(mediaType)
                val part = MultipartBody.Part.createFormData("file", fileName, requestBody)
                part to fileName
            }

            val response = uploadsApi.uploadServiceImage(multipart)
            val body = response.body()
            if (!response.isSuccessful || body == null) {
                return Result.failure(IllegalStateException("Image upload failed"))
            }

            val url = extractUrlFromUploadResponse(body)
            if (url.isNullOrBlank()) {
                Result.failure(IllegalStateException("Upload succeeded but no URL returned"))
            } else {
                Result.success(url)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun getDisplayName(context: Context, uri: Uri): String? {
        return try {
            val cursor: Cursor? = context.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (nameIndex >= 0 && it.moveToFirst()) it.getString(nameIndex) else null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun extractUrlFromUploadResponse(body: ResponseBody): String? {
        val raw = runCatching { body.string() }.getOrNull() ?: return null
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return null

        // Backend may return either plain URL text or a JSON object with a URL/path field.
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            return trimmed
        }

        return runCatching {
            val json = JSONObject(trimmed)
            json.optString("url", "").takeIf { it.isNotBlank() }
                ?: json.optString("image_url", "").takeIf { it.isNotBlank() }
                ?: json.optString("path", "").takeIf { it.isNotBlank() }
                ?: json.optString("location", "").takeIf { it.isNotBlank() }
        }.getOrNull()
    }
}

