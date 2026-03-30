package com.hive.hive_app.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.NotificationResponse
import com.hive.hive_app.data.notifications.NotificationPreferencesStore
import com.hive.hive_app.data.repository.NotificationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repo: NotificationsRepository,
    private val prefStore: NotificationPreferencesStore
) : ViewModel() {

    data class State(
        val notifications: List<NotificationResponse> = emptyList(),
        val isLoading: Boolean = false,
        val page: Int = 1,
        val hasMore: Boolean = true,
        val error: String? = null
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    init {
        load(reset = true)
    }

    fun load(reset: Boolean = false) {
        val current = _state.value
        if (current.isLoading) return
        if (!reset && !current.hasMore) return

        val page = if (reset) 1 else current.page
        _state.value = current.copy(isLoading = true, error = null)

        viewModelScope.launch {
            repo.getNotifications(page = page, limit = 20).fold(
                onSuccess = { response ->
                    val existing = if (reset) emptyList() else _state.value.notifications
                    _state.value = _state.value.copy(
                        notifications = existing + response.notifications,
                        isLoading = false,
                        page = page + 1,
                        hasMore = (existing.size + response.notifications.size) < response.total
                    )
                    prefStore.setLastKnownUnreadCount(
                        _state.value.notifications.count { !it.isRead }.coerceAtLeast(0)
                    )
                },
                onFailure = { e ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            repo.markRead(id).onSuccess {
                _state.value = _state.value.copy(
                    notifications = _state.value.notifications.map { n ->
                        if (n.id == id) n.copy(isRead = true) else n
                    }
                )
            }
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            repo.markAllRead().onSuccess {
                _state.value = _state.value.copy(
                    notifications = _state.value.notifications.map { it.copy(isRead = true) }
                )
                prefStore.setLastKnownUnreadCount(0)
            }
        }
    }
}
