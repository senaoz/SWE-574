package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.api.dto.UserSettingsUpdate
import com.hive.hive_app.data.api.dto.UserUpdate
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val usersRepository: UsersRepository
) : ViewModel() {

    private val _profile = MutableStateFlow<UserResponse?>(null)
    val profile: StateFlow<UserResponse?> = _profile.asStateFlow()

    private val _timeBank = MutableStateFlow<TimeBankResponse?>(null)
    val timeBank: StateFlow<TimeBankResponse?> = _timeBank.asStateFlow()

    private val _badges = MutableStateFlow<BadgesResponse?>(null)
    val badges: StateFlow<BadgesResponse?> = _badges.asStateFlow()

    private val _availableInterests = MutableStateFlow<List<String>>(emptyList())
    val availableInterests: StateFlow<List<String>> = _availableInterests.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            usersRepository.getProfile().onSuccess { _profile.value = it }.onFailure { _error.value = it.message }
            usersRepository.getTimeBank().onSuccess { _timeBank.value = it }.onFailure { }
            usersRepository.getMyBadges().onSuccess { _badges.value = it }.onFailure { }
            usersRepository.getAvailableInterests().onSuccess { _availableInterests.value = it }.onFailure { }
            _isLoading.value = false
        }
    }

    fun updateProfile(update: UserUpdate) {
        viewModelScope.launch {
            _error.value = null
            usersRepository.updateProfile(update).fold(
                onSuccess = { _profile.value = it },
                onFailure = { _error.value = it.message }
            )
        }
    }

    fun updateSettings(update: UserSettingsUpdate) {
        viewModelScope.launch {
            _error.value = null
            usersRepository.updateSettings(update).fold(
                onSuccess = { _profile.value = it },
                onFailure = { _error.value = it.message }
            )
        }
    }

    fun changePassword(currentPassword: String, newPassword: String, confirmPassword: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            _error.value = null
            usersRepository.changePassword(currentPassword, newPassword, confirmPassword).fold(
                onSuccess = { onResult(true, null) },
                onFailure = { e ->
                    _error.value = e.message
                    onResult(false, e.message)
                }
            )
        }
    }

    fun deleteAccount(password: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            _error.value = null
            usersRepository.deleteAccount(password).fold(
                onSuccess = { onResult(true, null) },
                onFailure = { e ->
                    _error.value = e.message
                    onResult(false, e.message)
                }
            )
        }
    }

    fun clearError() { _error.value = null }
}
