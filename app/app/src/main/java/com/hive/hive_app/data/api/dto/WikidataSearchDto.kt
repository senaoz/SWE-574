package com.hive.hive_app.data.api.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class WikidataSearchResponse(
    val query: String? = null,
    val language: String? = null,
    val count: Int? = null,
    val results: List<WikidataSearchResult> = emptyList()
)

@JsonClass(generateAdapter = true)
data class WikidataSearchResult(
    val title: String? = null,
    val pageId: String? = null,
    val snippet: String? = null,
    val titleSnippet: String? = null
)

