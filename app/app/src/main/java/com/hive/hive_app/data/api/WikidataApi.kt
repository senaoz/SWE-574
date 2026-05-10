package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.WikidataSearchResponse
import retrofit2.http.GET
import retrofit2.http.Query

interface WikidataApi {
    @GET("wikidata/search")
    suspend fun search(
        @Query("query") query: String,
        @Query("language") language: String,
        @Query("limit") limit: Int
    ): WikidataSearchResponse
}

