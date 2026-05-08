package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.WikidataApi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WikidataRepository @Inject constructor(
    private val wikidataApi: WikidataApi
) {
    suspend fun searchTags(
        query: String,
        language: String = "en",
        limit: Int = 10
    ): Result<List<WikidataTagSuggestion>> {
        return try {
            val response = wikidataApi.search(query = query, language = language, limit = limit)
            val suggestions = response.results.mapNotNull { r ->
                val id = r.title?.takeIf { it.isNotBlank() } ?: r.pageId?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                val rawLabel = r.titleSnippet?.takeIf { it.isNotBlank() } ?: r.title?.takeIf { it.isNotBlank() } ?: id
                val label = stripHtml(rawLabel).ifBlank { id }
                WikidataTagSuggestion(id = id, label = label)
            }
            Result.success(suggestions)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    private fun stripHtml(input: String): String {
        // Wikidata returns HTML fragments like:
        // <span class="searchmatch">Google</span>
        return input
            .replace(Regex("<[^>]*>"), "")
            .replace("&nbsp;", " ")
            .trim()
    }
}

