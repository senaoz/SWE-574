package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.notifications.NotificationPreferencesStore
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.NotificationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationsRepository: NotificationsRepository,
    private val notificationPreferencesStore: NotificationPreferencesStore
) : ViewModel() {

    val isLoggedIn: StateFlow<Boolean?> = authRepository.isLoggedIn
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _pendingDestination = MutableStateFlow<String?>(null)
    val pendingDestination: StateFlow<String?> = _pendingDestination.asStateFlow()

    fun setPendingDestination(destination: String) {
        _pendingDestination.value = destination
    }

    fun consumePendingDestination() {
        _pendingDestination.value = null
    }

    fun refreshUnreadCount() {
        viewModelScope.launch {
            notificationsRepository.getUnreadCount().getOrNull()?.let {
                _unreadCount.value = it.count
            }
        }
    }

    fun clearUnreadBadge() {
        _unreadCount.value = 0
        viewModelScope.launch {
            notificationPreferencesStore.setLastKnownUnreadCount(0)
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun onLoginSuccess() {
        refreshUnreadCount()
    }

    fun onSessionExpired() {
        _unreadCount.value = 0
    }
}
