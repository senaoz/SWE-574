package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository,
    private val usersRepository: UsersRepository
) : ViewModel() {
    data class RoomLastMessage(
        val senderLabel: String?,
        val content: String,
        val createdAt: String?,
        val unreadCount: Int = 0
    )

    enum class RoomFilter { ALL, DIRECT, GROUP }

    data class ChatListState(
        val rooms: List<ChatRoomResponse> = emptyList(),
        val visibleRooms: List<ChatRoomResponse> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val currentUserId: String? = null,
        val roomQuery: String = "",
        val activeFilter: RoomFilter = RoomFilter.ALL,
        val isCreateGroupSheetVisible: Boolean = false,
        val createGroupName: String = "",
        val participantSearchQuery: String = "",
        val candidateUsers: List<UserResponse> = emptyList(),
        val selectedParticipants: List<UserResponse> = emptyList(),
        val isSearchingParticipants: Boolean = false,
        val participantSearchError: String? = null,
        val isCreatingGroup: Boolean = false,
        val createGroupError: String? = null,
        val roomLastMessages: Map<String, RoomLastMessage> = emptyMap()
    )

    private val _state = MutableStateFlow(ChatListState())
    val state: StateFlow<ChatListState> = _state.asStateFlow()
    private var searchJob: Job? = null
    private val roomLastReadAt = mutableMapOf<String, String>()

    fun loadRooms() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUser().getOrNull()?._id
            _state.value = _state.value.copy(isLoading = true, error = null, currentUserId = userId)
            chatRepository.getRooms(page = 1, limit = 50).fold(
                onSuccess = { response ->
                    val sortedRooms = sortRooms(response.rooms)
                    val lastMessages = fetchRoomLastMessages(sortedRooms)
                    _state.value = _state.value.copy(
                        rooms = sortedRooms,
                        visibleRooms = applyRoomFilters(
                            rooms = sortedRooms,
                            roomQuery = _state.value.roomQuery,
                            filter = _state.value.activeFilter,
                            currentUserId = userId
                        ),
                        roomLastMessages = lastMessages,
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

    fun setRoomQuery(query: String) {
        _state.value = _state.value.copy(
            roomQuery = query,
            visibleRooms = applyRoomFilters(
                rooms = _state.value.rooms,
                roomQuery = query,
                filter = _state.value.activeFilter,
                currentUserId = _state.value.currentUserId
            )
        )
    }

    fun setRoomFilter(filter: RoomFilter) {
        _state.value = _state.value.copy(
            activeFilter = filter,
            visibleRooms = applyRoomFilters(
                rooms = _state.value.rooms,
                roomQuery = _state.value.roomQuery,
                filter = filter,
                currentUserId = _state.value.currentUserId
            )
        )
    }

    fun showCreateGroupSheet() {
        _state.value = _state.value.copy(
            isCreateGroupSheetVisible = true,
            createGroupError = null
        )
    }

    fun hideCreateGroupSheet() {
        searchJob?.cancel()
        _state.value = _state.value.copy(
            isCreateGroupSheetVisible = false,
            createGroupName = "",
            participantSearchQuery = "",
            candidateUsers = emptyList(),
            selectedParticipants = emptyList(),
            isSearchingParticipants = false,
            participantSearchError = null,
            isCreatingGroup = false,
            createGroupError = null
        )
    }

    fun updateCreateGroupName(name: String) {
        _state.value = _state.value.copy(createGroupName = name)
    }

    fun updateParticipantSearchQuery(query: String) {
        _state.value = _state.value.copy(
            participantSearchQuery = query,
            participantSearchError = null
        )
        searchJob?.cancel()
        if (query.isBlank()) {
            _state.value = _state.value.copy(
                candidateUsers = emptyList(),
                isSearchingParticipants = false
            )
            return
        }
        searchJob = viewModelScope.launch {
            delay(350)
            searchUsers(query)
        }
    }

    private suspend fun searchUsers(query: String) {
        _state.value = _state.value.copy(isSearchingParticipants = true, participantSearchError = null)
        usersRepository.searchUsers(query = query, limit = 20).fold(
            onSuccess = { users ->
                val currentState = _state.value
                val selectedIds = currentState.selectedParticipants.map { it._id }.toSet()
                val candidates = users.filter { user ->
                    user._id != currentState.currentUserId && user._id !in selectedIds
                }
                _state.value = _state.value.copy(
                    candidateUsers = candidates,
                    isSearchingParticipants = false
                )
            },
            onFailure = {
                _state.value = _state.value.copy(
                    candidateUsers = emptyList(),
                    isSearchingParticipants = false,
                    participantSearchError = it.message ?: "Failed to search users"
                )
            }
        )
    }

    fun toggleParticipantSelection(user: UserResponse) {
        val current = _state.value
        val selected = current.selectedParticipants.toMutableList()
        val existingIndex = selected.indexOfFirst { it._id == user._id }
        if (existingIndex >= 0) {
            selected.removeAt(existingIndex)
        } else {
            if (selected.size >= MAX_OTHER_PARTICIPANTS) {
                _state.value = current.copy(
                    createGroupError = "You can select up to $MAX_OTHER_PARTICIPANTS participants."
                )
                return
            }
            selected += user
        }
        _state.value = current.copy(
            selectedParticipants = selected,
            createGroupError = null
        )
        if (_state.value.participantSearchQuery.isNotBlank()) {
            updateParticipantSearchQuery(_state.value.participantSearchQuery)
        }
    }

    fun createGroupChat(onCreated: (ChatRoomResponse) -> Unit) {
        viewModelScope.launch {
            val currentState = _state.value
            val currentUserId = currentState.currentUserId ?: authRepository.getCurrentUser().getOrNull()?._id
            if (currentUserId == null) {
                _state.value = currentState.copy(createGroupError = "Please sign in again and retry.")
                return@launch
            }
            val selectedIds = currentState.selectedParticipants.map { it._id }.distinct()
            val participantIds = (listOf(currentUserId) + selectedIds).distinct()
            if (participantIds.size < MIN_TOTAL_PARTICIPANTS) {
                _state.value = currentState.copy(createGroupError = "Select at least one participant.")
                return@launch
            }
            if (participantIds.size > MAX_TOTAL_PARTICIPANTS) {
                _state.value = currentState.copy(createGroupError = "Group size cannot exceed $MAX_TOTAL_PARTICIPANTS.")
                return@launch
            }

            _state.value = currentState.copy(isCreatingGroup = true, createGroupError = null)
            chatRepository.createRoom(
                participantIds = participantIds,
                name = currentState.createGroupName
            ).fold(
                onSuccess = { room ->
                    val newRooms = sortRooms(
                        listOf(room) + _state.value.rooms.filterNot { existing -> existing._id == room._id }
                    )
                    _state.value = _state.value.copy(
                        rooms = newRooms,
                        visibleRooms = applyRoomFilters(
                            rooms = newRooms,
                            roomQuery = _state.value.roomQuery,
                            filter = _state.value.activeFilter,
                            currentUserId = currentUserId
                        ),
                        roomLastMessages = _state.value.roomLastMessages + (
                            room._id to RoomLastMessage(
                                senderLabel = null,
                                content = "",
                                createdAt = room.lastMessageAt ?: room.updatedAt
                            )
                        ),
                        isCreateGroupSheetVisible = false,
                        createGroupName = "",
                        participantSearchQuery = "",
                        candidateUsers = emptyList(),
                        selectedParticipants = emptyList(),
                        isSearchingParticipants = false,
                        participantSearchError = null,
                        isCreatingGroup = false,
                        createGroupError = null
                    )
                    onCreated(room)
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isCreatingGroup = false,
                        createGroupError = it.message ?: "Failed to create group chat"
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

    fun markRoomAsRead(roomId: String) {
        roomLastReadAt[roomId] = currentTimestampForComparison()
        val existing = _state.value.roomLastMessages[roomId] ?: return
        _state.value = _state.value.copy(
            roomLastMessages = _state.value.roomLastMessages + (roomId to existing.copy(unreadCount = 0))
        )
    }

    private fun sortRooms(rooms: List<ChatRoomResponse>): List<ChatRoomResponse> {
        return rooms.sortedByDescending { room -> room.lastMessageAt ?: room.updatedAt }
    }

    private suspend fun fetchRoomLastMessages(rooms: List<ChatRoomResponse>): Map<String, RoomLastMessage> {
        val currentUserId = _state.value.currentUserId
        val previewJobs = rooms.map { room ->
            viewModelScope.async {
                val messages = chatRepository.getMessages(
                    roomId = room._id,
                    page = 1,
                    limit = 20
                ).getOrNull()
                    ?.messages
                    ?.sortedBy(MessageResponse::createdAt)
                    .orEmpty()
                val latestMessage = messages.lastOrNull()
                val senderLabel = when {
                    latestMessage == null -> null
                    latestMessage.senderId == currentUserId -> "You"
                    !latestMessage.sender?.fullName.isNullOrBlank() -> latestMessage.sender?.fullName
                    !latestMessage.sender?.username.isNullOrBlank() -> latestMessage.sender?.username
                    else -> null
                }
                val lastReadAt = roomLastReadAt[room._id]
                val unreadCount = if (currentUserId == null) {
                    0
                } else {
                    messages.count { msg ->
                        msg.senderId != currentUserId && isAfter(msg.createdAt, lastReadAt)
                    }
                }
                room._id to RoomLastMessage(
                    senderLabel = senderLabel,
                    content = latestMessage?.content.orEmpty(),
                    createdAt = latestMessage?.createdAt ?: room.lastMessageAt ?: room.updatedAt,
                    unreadCount = unreadCount
                )
            }
        }
        return previewJobs.mapNotNull { job ->
            runCatching { job.await() }.getOrNull()
        }.toMap()
    }

    private fun currentTimestampForComparison(): String {
        return java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now())
    }

    private fun isAfter(candidate: String?, baseline: String?): Boolean {
        if (candidate.isNullOrBlank()) return false
        if (baseline.isNullOrBlank()) return true
        val c = parseInstant(candidate) ?: return false
        val b = parseInstant(baseline) ?: return true
        return c.isAfter(b)
    }

    private fun parseInstant(value: String): java.time.Instant? {
        return runCatching { java.time.Instant.parse(value) }.getOrNull()
            ?: runCatching {
                val formatted = if (value.endsWith("Z")) value else "${value.take(19)}Z"
                java.time.Instant.parse(formatted)
            }.getOrNull()
    }

    private fun applyRoomFilters(
        rooms: List<ChatRoomResponse>,
        roomQuery: String,
        filter: RoomFilter,
        currentUserId: String?
    ): List<ChatRoomResponse> {
        val query = roomQuery.trim().lowercase()
        return rooms.filter { room ->
            val matchesFilter = when (filter) {
                RoomFilter.ALL -> true
                RoomFilter.DIRECT -> room.participantIds.size <= 2
                RoomFilter.GROUP -> room.participantIds.size > 2
            }
            if (!matchesFilter) return@filter false
            if (query.isBlank()) return@filter true

            val roomName = room.name.orEmpty().lowercase()
            val participantText = room.participants
                ?.filter { it._id != currentUserId }
                ?.joinToString(" ") { participant ->
                    listOfNotNull(participant.fullName, participant.username).joinToString(" ")
                }
                .orEmpty()
                .lowercase()
            roomName.contains(query) || participantText.contains(query)
        }
    }

    companion object {
        private const val MIN_TOTAL_PARTICIPANTS = 2
        private const val MAX_TOTAL_PARTICIPANTS = 10
        private const val MAX_OTHER_PARTICIPANTS = MAX_TOTAL_PARTICIPANTS - 1
    }
}
