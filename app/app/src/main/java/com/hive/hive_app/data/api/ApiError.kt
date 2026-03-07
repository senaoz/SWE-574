package com.hive.hive_app.data.api

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/** FastAPI 401/400 style: {"detail": "string"} */
@JsonClass(generateAdapter = true)
data class ApiErrorDetail(
    val detail: String? = null
)

@JsonClass(generateAdapter = true)
data class ValidationErrorDetail(
    val loc: List<Any>,
    val msg: String,
    val type: String
)

@JsonClass(generateAdapter = true)
data class HttpValidationError(
    val detail: List<ValidationErrorDetail>? = null
)
