package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.RatingListResponse
import com.hive.hive_app.data.api.dto.RatingResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val usersRepository: UsersRepository,
    private val ratingsRepository: RatingsRepository
) : ViewModel() {

    private val _user = MutableStateFlow<UserResponse?>(null)
    val user: StateFlow<UserResponse?> = _user.asStateFlow()

    private val _badges = MutableStateFlow<BadgesResponse?>(null)
    val badges: StateFlow<BadgesResponse?> = _badges.asStateFlow()

    private val _ratings = MutableStateFlow<RatingListResponse?>(null)
    val ratings: StateFlow<RatingListResponse?> = _ratings.asStateFlow()

    private val _ratingTopTags = MutableStateFlow<List<Pair<String, Int>>>(emptyList())
    val ratingTopTags: StateFlow<List<Pair<String, Int>>> = _ratingTopTags.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _communities = MutableStateFlow<List<CommunityResponse>>(emptyList())
    val communities: StateFlow<List<CommunityResponse>> = _communities.asStateFlow()

    private val _mutualCount = MutableStateFlow(0)
    val mutualCount: StateFlow<Int> = _mutualCount.asStateFlow()

    fun load(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            usersRepository.getUser(userId).fold(
                onSuccess = { _user.value = it },
                onFailure = { _error.value = it.message }
            )
            usersRepository.getUserBadges(userId).onSuccess { _badges.value = it }
            ratingsRepository.getUserRatings(userId, page = 1, limit = 20).onSuccess { body ->
                _ratings.value = body
                _ratingTopTags.value = computeTopTagsFromRatings(body.ratings)
            }
            usersRepository.getUserCommunities(userId).onSuccess { resp ->
                _communities.value = resp.communities
                _mutualCount.value = resp.mutualCount
            }
            _isLoading.value = false
        }
    }

    private fun computeTopTagsFromRatings(ratings: List<RatingResponse>?): List<Pair<String, Int>> {
        val counts = mutableMapOf<String, Int>()
        ratings.orEmpty().forEach { r ->
            r.tags.orEmpty().forEach { tag ->
                if (tag.isNotBlank()) counts[tag] = (counts[tag] ?: 0) + 1
            }
        }
        return counts.entries
            .sortedByDescending { it.value }
            .take(3)
            .map { it.key to it.value }
    }
}