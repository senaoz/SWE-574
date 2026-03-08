package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.RatingListResponse
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

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            usersRepository.getUser(userId).fold(
                onSuccess = { _user.value = it },
                onFailure = { _error.value = it.message }
            )
            usersRepository.getUserBadges(userId).onSuccess { _badges.value = it }
            ratingsRepository.getUserRatings(userId).onSuccess { _ratings.value = it }
            _isLoading.value = false
        }
    }
}
