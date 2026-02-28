package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatRoomViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    data class ChatRoomState(
        val messages: List<MessageResponse> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val currentUserId: String? = null
    )

    private val _state = MutableStateFlow(ChatRoomState())
    val state: StateFlow<ChatRoomState> = _state.asStateFlow()

    /** True when the room's transaction is completed; sending should be disabled (backend enforces; UI hides send). */
    fun isExchangeCompleted(room: ChatRoomResponse): Boolean {
        val status = room.transaction?.status?.lowercase() ?: return false
        return status == "completed"
    }

    fun loadMessages(roomId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val userResult = authRepository.getCurrentUser()
            val userId = userResult.getOrNull()?._id
            chatRepository.getMessages(roomId, page = 1, limit = 100).fold(
                onSuccess = { response ->
                    _state.value = _state.value.copy(
                        messages = response.messages,
                        isLoading = false,
                        error = null,
                        currentUserId = userId
                    )
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load messages",
                        currentUserId = userId
                    )
                }
            )
        }
    }

    fun sendMessage(roomId: String, content: String, onSent: () -> Unit, onError: (String) -> Unit) {
        if (content.isBlank()) return
        viewModelScope.launch {
            chatRepository.sendMessage(roomId, content.trim()).fold(
                onSuccess = { newMessage ->
                    _state.value = _state.value.copy(
                        messages = _state.value.messages + newMessage
                    )
                    onSent()
                },
                onFailure = {
                    onError(it.message ?: "Failed to send")
                }
            )
        }
    }
}
