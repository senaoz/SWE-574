package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.WikidataApi
import com.hive.hive_app.data.api.dto.WikidataSearchResponse
import com.hive.hive_app.data.api.dto.WikidataSearchResult
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WikidataRepositoryTest {
    @Test
    fun searchTagsStripsHtmlAndUsesTitleAsId() = runBlocking {
        val api = FakeWikidataApi(
            response = WikidataSearchResponse(
                results = listOf(
                    WikidataSearchResult(
                        title = "Q638",
                        titleSnippet = "<span class=\"searchmatch\">Music</span>&nbsp;genre"
                    )
                )
            )
        )
        val repository = WikidataRepository(api)

        val result = repository.searchTags(query = "music", language = "en", limit = 5)

        assertTrue(result.isSuccess)
        assertEquals(listOf(WikidataTagSuggestion("Q638", "Music genre")), result.getOrThrow())
        assertEquals("music", api.lastQuery)
        assertEquals("en", api.lastLanguage)
        assertEquals(5, api.lastLimit)
    }

    @Test
    fun searchTagsFallsBackToPageIdAndDropsItemsWithoutIdentity() = runBlocking {
        val api = FakeWikidataApi(
            response = WikidataSearchResponse(
                results = listOf(
                    WikidataSearchResult(pageId = "123", titleSnippet = ""),
                    WikidataSearchResult(title = "", pageId = "")
                )
            )
        )
        val repository = WikidataRepository(api)

        val result = repository.searchTags(query = "garden")

        assertTrue(result.isSuccess)
        assertEquals(listOf(WikidataTagSuggestion("123", "123")), result.getOrThrow())
    }

    @Test
    fun searchTagsReturnsFailureWhenApiThrows() = runBlocking {
        val api = FakeWikidataApi(error = IllegalStateException("network down"))
        val repository = WikidataRepository(api)

        val result = repository.searchTags(query = "music")

        assertTrue(result.isFailure)
        assertEquals("network down", result.exceptionOrNull()?.message)
    }

    private class FakeWikidataApi(
        private val response: WikidataSearchResponse = WikidataSearchResponse(),
        private val error: Throwable? = null
    ) : WikidataApi {
        var lastQuery: String? = null
        var lastLanguage: String? = null
        var lastLimit: Int? = null

        override suspend fun search(
            query: String,
            language: String,
            limit: Int
        ): WikidataSearchResponse {
            lastQuery = query
            lastLanguage = language
            lastLimit = limit
            error?.let { throw it }
            return response
        }
    }
}
