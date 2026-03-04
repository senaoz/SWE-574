package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    data class ChatListState(
        val rooms: List<ChatRoomResponse> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val currentUserId: String? = null
    )

    private val _state = MutableStateFlow(ChatListState())
    val state: StateFlow<ChatListState> = _state.asStateFlow()

    fun loadRooms() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUser().getOrNull()?._id
            _state.value = _state.value.copy(isLoading = true, error = null, currentUserId = userId)
            chatRepository.getRooms(page = 1, limit = 50).fold(
                onSuccess = { response ->
                    _state.value = _state.value.copy(
                        rooms = response.rooms,
                        isLoading = false,
                        error = null
                    )
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load chats"
                    )
                }
            )
        }
    }

    fun openRoom(roomId: String, onResult: (ChatRoomResponse?) -> Unit) {
        viewModelScope.launch {
            chatRepository.getRoom(roomId).fold(
                onSuccess = { onResult(it) },
                onFailure = { onResult(null) }
            )
        }
    }
}
