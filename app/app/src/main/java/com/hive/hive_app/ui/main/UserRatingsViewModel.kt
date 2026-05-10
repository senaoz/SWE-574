package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.RatingResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.TransactionsRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserRatingsViewModel @Inject constructor(
    private val ratingsRepository: RatingsRepository,
    private val usersRepository: UsersRepository,
    private val transactionsRepository: TransactionsRepository
) : ViewModel() {

    private val _ratings = MutableStateFlow<List<RatingResponse>>(emptyList())
    val ratings: StateFlow<List<RatingResponse>> = _ratings.asStateFlow()

    private val _total = MutableStateFlow(0)
    val total: StateFlow<Int> = _total.asStateFlow()

    private val _averageScore = MutableStateFlow<Double?>(null)
    val averageScore: StateFlow<Double?> = _averageScore.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _page = MutableStateFlow(1)
    private val _hasMore = MutableStateFlow(true)
    val hasMore: StateFlow<Boolean> = _hasMore.asStateFlow()

    private val _raterById = MutableStateFlow<Map<String, UserResponse>>(emptyMap())
    val raterById: StateFlow<Map<String, UserResponse>> = _raterById.asStateFlow()

    private val _transactionById = MutableStateFlow<Map<String, TransactionResponse>>(emptyMap())
    val transactionById: StateFlow<Map<String, TransactionResponse>> = _transactionById.asStateFlow()

    /** Tag label → count across all ratings loaded so far (updates when loading more). */
    private val _tagCounts = MutableStateFlow<List<Pair<String, Int>>>(emptyList())
    val tagCounts: StateFlow<List<Pair<String, Int>>> = _tagCounts.asStateFlow()

    fun load(userId: String, reset: Boolean = true) {
        viewModelScope.launch {
            if (reset) {
                _page.value = 1
                _ratings.value = emptyList()
                _hasMore.value = true
                _raterById.value = emptyMap()
                _transactionById.value = emptyMap()
                _tagCounts.value = emptyList()
            }
            _isLoading.value = true
            _error.value = null
            val page = _page.value
            ratingsRepository.getUserRatings(userId, page = page, limit = 20).fold(
                onSuccess = { body ->
                    _total.value = body.total
                    _averageScore.value = body.averageScore
                    val list = body.ratings.orEmpty()
                    _ratings.value = if (reset) list else _ratings.value + list
                    _hasMore.value = _ratings.value.size < body.total && list.isNotEmpty()
                    if (list.isNotEmpty()) _page.value = page + 1
                    recomputeTagCounts(_ratings.value)
                    enrichForRatings(_ratings.value)
                },
                onFailure = { _error.value = it.message }
            )
            _isLoading.value = false
        }
    }

    fun loadMore(userId: String) {
        if (!_hasMore.value || _isLoading.value) return
        load(userId, reset = false)
    }

    private fun recomputeTagCounts(ratings: List<RatingResponse>) {
        val counts = mutableMapOf<String, Int>()
        ratings.forEach { r ->
            r.tags.orEmpty().forEach { tag ->
                if (tag.isNotBlank()) {
                    counts[tag] = (counts[tag] ?: 0) + 1
                }
            }
        }
        _tagCounts.value = counts.entries
            .sortedByDescending { it.value }
            .map { it.key to it.value }
            .take(3)
    }

    private suspend fun enrichForRatings(ratings: List<RatingResponse>) {
        val raterIds = ratings.mapNotNull { it.raterId }.distinct()
            .filter { it !in _raterById.value.keys }
        val txnIds = ratings.mapNotNull { it.transactionId }.distinct()
            .filter { it !in _transactionById.value.keys }
        if (raterIds.isEmpty() && txnIds.isEmpty()) return
        coroutineScope {
            val raterResults = raterIds.map { id ->
                async {
                    usersRepository.getUser(id).getOrNull()?.let { user -> id to user }
                }
            }.awaitAll().filterNotNull()
            val txnResults = txnIds.map { id ->
                async {
                    transactionsRepository.getTransaction(id).getOrNull()?.let { txn -> id to txn }
                }
            }.awaitAll().filterNotNull()
            _raterById.update { current ->
                current + raterResults
            }
            _transactionById.update { current ->
                current + txnResults
            }
        }
    }
}
