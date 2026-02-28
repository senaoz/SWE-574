package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.repository.ForumRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class ForumTab { DISCUSSIONS, EVENTS }

@HiltViewModel
class ForumViewModel @Inject constructor(
    private val forumRepository: ForumRepository
) : ViewModel() {

    data class ForumListState(
        val discussions: List<ForumDiscussionResponse> = emptyList(),
        val total: Int = 0,
        val page: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val searchQuery: String = ""
    )

    data class DiscussionDetailState(
        val discussion: ForumDiscussionResponse? = null,
        val comments: List<ForumCommentResponse> = emptyList(),
        val commentsTotal: Int = 0,
        val isLoading: Boolean = false,
        val commentsLoading: Boolean = false,
        val error: String? = null
    )

    data class CreateDiscussionState(
        val title: String = "",
        val body: String = "",
        val isSubmitting: Boolean = false,
        val error: String? = null,
        val createdId: String? = null
    )

    data class EventsListState(
        val events: List<ForumEventResponse> = emptyList(),
        val total: Int = 0,
        val page: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val searchQuery: String = ""
    )

    data class EventDetailState(
        val event: ForumEventResponse? = null,
        val comments: List<ForumCommentResponse> = emptyList(),
        val commentsTotal: Int = 0,
        val isLoading: Boolean = false,
        val commentsLoading: Boolean = false,
        val error: String? = null
    )

    data class CreateEventState(
        val title: String = "",
        val description: String = "",
        val eventAt: String = "",
        val location: String = "",
        val isRemote: Boolean = false,
        val isSubmitting: Boolean = false,
        val error: String? = null,
        val createdId: String? = null
    )

    private val _selectedTab = MutableStateFlow(ForumTab.DISCUSSIONS)
    val selectedTab: StateFlow<ForumTab> = _selectedTab.asStateFlow()

    private val _listState = MutableStateFlow(ForumListState())
    val listState: StateFlow<ForumListState> = _listState.asStateFlow()

    private val _detailState = MutableStateFlow(DiscussionDetailState())
    val detailState: StateFlow<DiscussionDetailState> = _detailState.asStateFlow()

    private val _createState = MutableStateFlow(CreateDiscussionState())
    val createState: StateFlow<CreateDiscussionState> = _createState.asStateFlow()

    private val _eventsListState = MutableStateFlow(EventsListState())
    val eventsListState: StateFlow<EventsListState> = _eventsListState.asStateFlow()

    private val _eventDetailState = MutableStateFlow(EventDetailState())
    val eventDetailState: StateFlow<EventDetailState> = _eventDetailState.asStateFlow()

    private val _createEventState = MutableStateFlow(CreateEventState())
    val createEventState: StateFlow<CreateEventState> = _createEventState.asStateFlow()

    private val _newCommentText = MutableStateFlow("")
    val newCommentText: StateFlow<String> = _newCommentText.asStateFlow()

    fun setSelectedTab(tab: ForumTab) {
        _selectedTab.value = tab
    }

    fun setSearchQuery(query: String) {
        _listState.update { it.copy(searchQuery = query) }
    }

    fun setEventsSearchQuery(query: String) {
        _eventsListState.update { it.copy(searchQuery = query) }
        _listState.update { it.copy(searchQuery = query) }
    }

    fun loadDiscussions(page: Int = 1) {
        viewModelScope.launch {
            _listState.update { it.copy(isLoading = true, error = null) }
            val q = _listState.value.searchQuery.takeIf { it.isNotBlank() }
            forumRepository.listDiscussions(page = page, limit = 20, q = q)
                .onSuccess { response ->
                    _listState.update {
                        it.copy(
                            discussions = if (page == 1) response.discussions else it.discussions + response.discussions,
                            total = response.total,
                            page = response.page,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                .onFailure { e ->
                    _listState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load discussions"
                        )
                    }
                }
        }
    }

    fun loadDiscussion(discussionId: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true, error = null) }
            forumRepository.getDiscussion(discussionId)
                .onSuccess { discussion ->
                    _detailState.update {
                        it.copy(discussion = discussion, isLoading = false, error = null)
                    }
                    loadComments(discussionId)
                }
                .onFailure { e ->
                    _detailState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load discussion"
                        )
                    }
                }
        }
    }

    fun loadComments(discussionId: String, page: Int = 1) {
        viewModelScope.launch {
            _detailState.update { it.copy(commentsLoading = true) }
            forumRepository.listComments(
                targetType = "discussion",
                targetId = discussionId,
                page = page,
                limit = 50
            )
                .onSuccess { response ->
                    _detailState.update {
                        it.copy(
                            comments = if (page == 1) response.comments else it.comments + response.comments,
                            commentsTotal = response.total,
                            commentsLoading = false
                        )
                    }
                }
                .onFailure {
                    _detailState.update { it.copy(commentsLoading = false) }
                }
        }
    }

    fun setNewCommentText(text: String) {
        _newCommentText.value = text
    }

    fun submitComment(discussionId: String, onSuccess: () -> Unit = {}) {
        val content = _newCommentText.value.trim()
        if (content.isBlank()) return
        viewModelScope.launch {
            forumRepository.createComment(
                targetType = "discussion",
                targetId = discussionId,
                content = content
            )
                .onSuccess {
                    _newCommentText.value = ""
                    loadComments(discussionId)
                    loadDiscussion(discussionId) // refresh comment count
                    onSuccess()
                }
        }
    }

    fun setCreateTitle(title: String) {
        _createState.update { it.copy(title = title, error = null) }
    }

    fun setCreateBody(body: String) {
        _createState.update { it.copy(body = body, error = null) }
    }

    fun createDiscussion(onSuccess: (String) -> Unit = {}) {
        val title = _createState.value.title.trim()
        val body = _createState.value.body.trim()
        if (title.length < 3) {
            _createState.update { it.copy(error = "Title must be at least 3 characters") }
            return
        }
        if (body.isBlank()) {
            _createState.update { it.copy(error = "Body is required") }
            return
        }
        viewModelScope.launch {
            _createState.update { it.copy(isSubmitting = true, error = null) }
            forumRepository.createDiscussion(title = title, body = body)
                .onSuccess { discussion ->
                    _createState.update {
                        it.copy(
                            isSubmitting = false,
                            title = "",
                            body = "",
                            createdId = discussion.id,
                            error = null
                        )
                    }
                    loadDiscussions(1)
                    onSuccess(discussion.id)
                }
                .onFailure { e ->
                    _createState.update {
                        it.copy(
                            isSubmitting = false,
                            error = e.message ?: "Failed to create discussion"
                        )
                    }
                }
        }
    }

    fun clearDetail() {
        _detailState.value = DiscussionDetailState()
        _newCommentText.value = ""
    }

    fun clearEventDetail() {
        _eventDetailState.value = EventDetailState()
        _newCommentText.value = ""
    }

    fun clearCreateState() {
        _createState.value = CreateDiscussionState()
    }

    fun clearCreateEventState() {
        _createEventState.value = CreateEventState()
    }

    fun clearListError() {
        _listState.update { it.copy(error = null) }
        _eventsListState.update { it.copy(error = null) }
    }

    // --------------- Events ---------------

    fun loadEvents(page: Int = 1) {
        viewModelScope.launch {
            _eventsListState.update { it.copy(isLoading = true, error = null) }
            val q = _eventsListState.value.searchQuery.takeIf { it.isNotBlank() }
            forumRepository.listEvents(page = page, limit = 50, q = q)
                .onSuccess { response ->
                    _eventsListState.update {
                        it.copy(
                            events = if (page == 1) response.events else it.events + response.events,
                            total = response.total,
                            page = response.page,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                .onFailure { e ->
                    _eventsListState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load events"
                        )
                    }
                }
        }
    }

    fun loadEvent(eventId: String) {
        viewModelScope.launch {
            _eventDetailState.update { it.copy(isLoading = true, error = null) }
            forumRepository.getEvent(eventId)
                .onSuccess { event ->
                    _eventDetailState.update {
                        it.copy(event = event, isLoading = false, error = null)
                    }
                    loadCommentsForEvent(eventId)
                }
                .onFailure { e ->
                    _eventDetailState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load event"
                        )
                    }
                }
        }
    }

    fun loadCommentsForEvent(eventId: String, page: Int = 1) {
        viewModelScope.launch {
            _eventDetailState.update { it.copy(commentsLoading = true) }
            forumRepository.listComments(
                targetType = "event",
                targetId = eventId,
                page = page,
                limit = 50
            )
                .onSuccess { response ->
                    _eventDetailState.update {
                        it.copy(
                            comments = if (page == 1) response.comments else it.comments + response.comments,
                            commentsTotal = response.total,
                            commentsLoading = false
                        )
                    }
                }
                .onFailure {
                    _eventDetailState.update { it.copy(commentsLoading = false) }
                }
        }
    }

    fun submitCommentForEvent(eventId: String, onSuccess: () -> Unit = {}) {
        val content = _newCommentText.value.trim()
        if (content.isBlank()) return
        viewModelScope.launch {
            forumRepository.createComment(
                targetType = "event",
                targetId = eventId,
                content = content
            )
                .onSuccess {
                    _newCommentText.value = ""
                    loadCommentsForEvent(eventId)
                    loadEvent(eventId)
                    onSuccess()
                }
        }
    }

    fun setCreateEventTitle(title: String) {
        _createEventState.update { it.copy(title = title, error = null) }
    }

    fun setCreateEventDescription(description: String) {
        _createEventState.update { it.copy(description = description, error = null) }
    }

    fun setCreateEventAt(eventAt: String) {
        _createEventState.update { it.copy(eventAt = eventAt, error = null) }
    }

    fun setCreateEventLocation(location: String) {
        _createEventState.update { it.copy(location = location) }
    }

    fun setCreateEventIsRemote(isRemote: Boolean) {
        _createEventState.update { it.copy(isRemote = isRemote) }
    }

    fun createEvent(onSuccess: (String) -> Unit = {}) {
        val title = _createEventState.value.title.trim()
        val description = _createEventState.value.description.trim()
        val eventAt = _createEventState.value.eventAt.trim()
        if (title.length < 3) {
            _createEventState.update { it.copy(error = "Title must be at least 3 characters") }
            return
        }
        if (description.isBlank()) {
            _createEventState.update { it.copy(error = "Description is required") }
            return
        }
        if (eventAt.isBlank()) {
            _createEventState.update { it.copy(error = "Date & time is required") }
            return
        }
        viewModelScope.launch {
            _createEventState.update { it.copy(isSubmitting = true, error = null) }
            forumRepository.createEvent(
                title = title,
                description = description,
                eventAt = eventAt,
                location = _createEventState.value.location.takeIf { it.isNotBlank() },
                isRemote = _createEventState.value.isRemote
            )
                .onSuccess { event ->
                    _createEventState.update {
                        it.copy(
                            isSubmitting = false,
                            title = "",
                            description = "",
                            eventAt = "",
                            location = "",
                            createdId = event.id,
                            error = null
                        )
                    }
                    loadEvents(1)
                    onSuccess(event.id)
                }
                .onFailure { e ->
                    _createEventState.update {
                        it.copy(
                            isSubmitting = false,
                            error = e.message ?: "Failed to create event"
                        )
                    }
                }
        }
    }
}
