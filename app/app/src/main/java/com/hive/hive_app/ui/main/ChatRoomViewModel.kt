package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.TransactionsRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatRoomViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository,
    private val usersRepository: UsersRepository,
    private val transactionsRepository: TransactionsRepository,
    private val ratingsRepository: RatingsRepository
) : ViewModel() {

    data class ChatRoomState(
        val messages: List<MessageResponse> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val currentUserId: String? = null,
        val otherUser: UserResponse? = null,
        val transaction: TransactionResponse? = null,
        val alreadyRatedTransaction: Boolean = false
    )

    private val _state = MutableStateFlow(ChatRoomState())
    val state: StateFlow<ChatRoomState> = _state.asStateFlow()

    /** True when the room's transaction is completed; sending should be disabled (backend enforces; UI hides send). */
    fun isExchangeCompleted(room: ChatRoomResponse): Boolean {
        val status = room.transaction?.status?.lowercase() ?: _state.value.transaction?.status?.lowercase() ?: return false
        return status == "completed"
    }

    /** True if current user can confirm completion (they are provider or requester and have not confirmed yet). */
    fun canConfirmCompletion(): Boolean {
        val t = _state.value.transaction ?: return false
        val uid = _state.value.currentUserId ?: return false
        val status = t.status?.lowercase() ?: return false
        if (status != "in_progress" && status != "pending") return false
        return when (uid) {
            t.providerId -> t.providerConfirmed != true
            t.requesterId -> t.requesterConfirmed != true
            else -> false
        }
    }

    /** User ID of the other party (for rating after exchange completed). */
    fun otherUserIdForRating(): String? {
        val t = _state.value.transaction ?: return null
        val uid = _state.value.currentUserId ?: return null
        return if (uid == t.providerId) t.requesterId else t.providerId
    }

    /** Refresh only the message list (e.g. for polling new messages from web). */
    fun refreshMessages(roomId: String) {
        viewModelScope.launch {
            chatRepository.getMessages(roomId, page = 1, limit = 100).fold(
                onSuccess = { response ->
                    _state.value = _state.value.copy(messages = response.messages.sortedBy { it.createdAt })
                },
                onFailure = { }
            )
        }
    }

    fun loadMessages(roomId: String, room: ChatRoomResponse) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, otherUser = null, transaction = null, alreadyRatedTransaction = false)
            val userResult = authRepository.getCurrentUser()
            val userId = userResult.getOrNull()?._id
            chatRepository.getMessages(roomId, page = 1, limit = 100).fold(
                onSuccess = { response ->
                    val otherId = room.participants?.firstOrNull { it._id != userId }?._id
                    var otherUser: UserResponse? = null
                    if (otherId != null) {
                        usersRepository.getUser(otherId).onSuccess { otherUser = it }
                    }
                    var transaction: TransactionResponse? = null
                    var alreadyRated = false
                    val txId = room.transactionId ?: room.transaction?._id
                    if (txId != null) {
                        transactionsRepository.getTransaction(txId).getOrNull()?.let { transaction = it }
                        ratingsRepository.getTransactionRatings(txId).getOrNull()?.let { ratings ->
                            alreadyRated = ratings.any { it.raterId == userId }
                        }
                    }
                    _state.value = _state.value.copy(
                        messages = response.messages.sortedBy { it.createdAt },
                        isLoading = false,
                        error = null,
                        currentUserId = userId,
                        otherUser = otherUser,
                        transaction = transaction,
                        alreadyRatedTransaction = alreadyRated
                    )
                },
                onFailure = {
                    val otherId = room.participants?.firstOrNull { it._id != userId }?._id
                    var otherUser: UserResponse? = null
                    if (otherId != null) {
                        usersRepository.getUser(otherId).onSuccess { otherUser = it }
                    }
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load messages",
                        currentUserId = userId,
                        otherUser = otherUser
                    )
                }
            )
        }
    }

    fun confirmCompletion(room: ChatRoomResponse, onResult: (Boolean, String?) -> Unit) {
        val txId = room.transactionId ?: room.transaction?._id ?: run {
            onResult(false, "No transaction")
            return
        }
        viewModelScope.launch {
            transactionsRepository.confirmCompletion(txId).fold(
                onSuccess = { updated ->
                    _state.value = _state.value.copy(transaction = updated)
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    fun submitRating(room: ChatRoomResponse, score: Int, comment: String?, onResult: (Boolean, String?) -> Unit) {
        val t = _state.value.transaction ?: run {
            onResult(false, "Transaction not loaded")
            return
        }
        val ratedUserId = otherUserIdForRating() ?: run {
            onResult(false, "Cannot determine user to rate")
            return
        }
        viewModelScope.launch {
            ratingsRepository.createRating(t.id, ratedUserId, score, comment).fold(
                onSuccess = {
                    _state.value = _state.value.copy(alreadyRatedTransaction = true)
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    fun sendMessage(roomId: String, content: String, onSent: () -> Unit, onError: (String) -> Unit) {
        if (content.isBlank()) return
        viewModelScope.launch {
            chatRepository.sendMessage(roomId, content.trim()).fold(
                onSuccess = { newMessage ->
                    _state.value = _state.value.copy(
                        messages = (_state.value.messages + newMessage).sortedBy { it.createdAt }
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
