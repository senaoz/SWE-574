package com.hive.hive_app.ui.main

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.TagDto
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ForumUserEmbed
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ForumRepository
import com.hive.hive_app.data.repository.CommunityRepository
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.CommunityCreate
import com.hive.hive_app.data.api.dto.CommunityPostCreate
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.UpvoteResponse
import com.hive.hive_app.data.repository.UploadsRepository
import com.hive.hive_app.data.repository.WikidataRepository
import com.hive.hive_app.data.repository.WikidataTagSuggestion
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class ForumTab { DISCUSSIONS, EVENTS, COMMUNITIES }

@HiltViewModel
class ForumViewModel @Inject constructor(
    private val forumRepository: ForumRepository,
    private val authRepository: AuthRepository,
    private val communityRepository: CommunityRepository,
    private val uploadsRepository: UploadsRepository,
    private val wikidataRepository: WikidataRepository,
    @ApplicationContext private val appContext: Context
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
        val attendees: List<ForumUserEmbed> = emptyList(),
        val isLoading: Boolean = false,
        val commentsLoading: Boolean = false,
        val error: String? = null,
        val currentUserId: String? = null,
        val isAttendingLoading: Boolean = false
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

    private val _tagSearchQuery = MutableStateFlow("")
    val tagSearchQuery: StateFlow<String> = _tagSearchQuery.asStateFlow()

    private val _tagSuggestions = MutableStateFlow<List<WikidataTagSuggestion>>(emptyList())
    val tagSuggestions: StateFlow<List<WikidataTagSuggestion>> = _tagSuggestions.asStateFlow()

    private val _tagSearchLoading = MutableStateFlow(false)
    val tagSearchLoading: StateFlow<Boolean> = _tagSearchLoading.asStateFlow()

    private val _tagSearchError = MutableStateFlow<String?>(null)
    val tagSearchError: StateFlow<String?> = _tagSearchError.asStateFlow()

    private var tagSearchJob: Job? = null

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

    fun setTagSearchQuery(query: String) {
        _tagSearchQuery.value = query
        tagSearchJob?.cancel()

        val trimmed = query.trim()
        if (trimmed.isBlank()) {
            _tagSuggestions.value = emptyList()
            _tagSearchError.value = null
            _tagSearchLoading.value = false
            return
        }

        tagSearchJob = viewModelScope.launch {
            _tagSearchLoading.value = true
            _tagSearchError.value = null
            delay(300)

            wikidataRepository.searchTags(trimmed, language = "en", limit = 10).fold(
                onSuccess = { suggestions ->
                    _tagSuggestions.value = suggestions
                    _tagSearchLoading.value = false
                },
                onFailure = { err ->
                    _tagSearchError.value = err.message ?: "Failed to search tags"
                    _tagSuggestions.value = emptyList()
                    _tagSearchLoading.value = false
                }
            )
        }
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

    fun createDiscussion(
        tags: List<TagDto>? = null,
        communityId: String? = null,
        onSuccess: (String) -> Unit = {}
    ) {
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
            forumRepository.createDiscussion(
                title = title,
                body = body,
                tags = tags,
                communityId = communityId
            )
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

    fun createDiscussionRich(
        title: String,
        body: String,
        tags: List<WikidataTagSuggestion>,
        communityId: String?,
        imageUris: List<Uri>,
        onSuccess: (String) -> Unit = {}
    ) {
        setCreateTitle(title)
        setCreateBody(body)
        viewModelScope.launch {
            _createState.update { it.copy(isSubmitting = true, error = null) }
            val uploaded = uploadImages(imageUris).getOrElse { err ->
                _createState.update { it.copy(isSubmitting = false, error = err.message ?: "Failed to upload images") }
                return@launch
            }
            _createState.update { it.copy(isSubmitting = false) }
            val tagsDto = tags.toTagDtos()
            val bodyWithImages = appendImageLinks(body, uploaded)
            setCreateBody(bodyWithImages)
            createDiscussion(tags = tagsDto, communityId = communityId, onSuccess = onSuccess)
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
            val currentUserId = authRepository.getCurrentUser().getOrNull()?._id
            forumRepository.getEvent(eventId)
                .onSuccess { event ->
                    _eventDetailState.update {
                        it.copy(
                            event = event,
                            isLoading = false,
                            error = null,
                            currentUserId = currentUserId
                        )
                    }
                    loadCommentsForEvent(eventId)
                    forumRepository.getEventAttendees(eventId).onSuccess { attendees ->
                        _eventDetailState.update { it.copy(attendees = attendees) }
                    }
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

    fun toggleAttend(eventId: String) {
        val state = _eventDetailState.value
        val currentUserId = state.currentUserId ?: return
        val isAttending = state.event?.attendeeIds?.contains(currentUserId) == true
        viewModelScope.launch {
            _eventDetailState.update { it.copy(isAttendingLoading = true) }
            val result = if (isAttending) {
                forumRepository.unattendEvent(eventId)
            } else {
                forumRepository.attendEvent(eventId)
            }
            result
                .onSuccess { updatedEvent ->
                    _eventDetailState.update { it.copy(event = updatedEvent, isAttendingLoading = false) }
                    forumRepository.getEventAttendees(eventId).onSuccess { attendees ->
                        _eventDetailState.update { it.copy(attendees = attendees) }
                    }
                }
                .onFailure {
                    _eventDetailState.update { it.copy(isAttendingLoading = false) }
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

    fun createEvent(
        communityId: String? = null,
        onSuccess: (String) -> Unit = {}
    ) {
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
                communityId = communityId,
                location = _createEventState.value.location.takeIf { it.isNotBlank() },
                latitude = null,
                longitude = null,
                isRemote = _createEventState.value.isRemote,
                tags = null
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

    fun createEventRich(
        title: String,
        description: String,
        eventAt: String,
        communityId: String?,
        location: String?,
        latitude: Double?,
        longitude: Double?,
        isRemote: Boolean,
        tags: List<WikidataTagSuggestion>,
        imageUris: List<Uri>,
        onSuccess: (String) -> Unit = {}
    ) {
        setCreateEventTitle(title)
        setCreateEventDescription(description)
        setCreateEventAt(eventAt)
        setCreateEventLocation(location.orEmpty())
        setCreateEventIsRemote(isRemote)
        viewModelScope.launch {
            _createEventState.update { it.copy(isSubmitting = true, error = null) }
            val uploaded = uploadImages(imageUris).getOrElse { err ->
                _createEventState.update { it.copy(isSubmitting = false, error = err.message ?: "Failed to upload images") }
                return@launch
            }
            val descriptionWithImages = appendImageLinks(description, uploaded)
            forumRepository.createEvent(
                title = title.trim(),
                description = descriptionWithImages,
                eventAt = eventAt.trim(),
                communityId = communityId,
                location = location?.takeIf { it.isNotBlank() },
                latitude = latitude,
                longitude = longitude,
                isRemote = isRemote,
                tags = tags.toTagDtos()
            ).onSuccess { event ->
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
            }.onFailure { e ->
                _createEventState.update {
                    it.copy(
                        isSubmitting = false,
                        error = e.message ?: "Failed to create event"
                    )
                }
            }
        }
    }
    // --------------- Communities ---------------

    data class CommunitiesListState(
        val communities: List<CommunityResponse> = emptyList(),
        val total: Int = 0,
        val page: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val searchQuery: String = ""
    )

    data class CreateCommunityState(
        val name: String = "",
        val description: String = "",
        val isSubmitting: Boolean = false,
        val error: String? = null,
        val createdId: String? = null
    )

    private val _communitiesListState = MutableStateFlow(CommunitiesListState())
    val communitiesListState: StateFlow<CommunitiesListState> = _communitiesListState.asStateFlow()

    private val _createCommunityState = MutableStateFlow(CreateCommunityState())
    val createCommunityState: StateFlow<CreateCommunityState> = _createCommunityState.asStateFlow()

    private val _communityById = MutableStateFlow<Map<String, CommunityResponse>>(emptyMap())
    val communityById: StateFlow<Map<String, CommunityResponse>> = _communityById.asStateFlow()

    fun setCommunitySearchQuery(query: String) {
        _communitiesListState.update { it.copy(searchQuery = query) }
    }

    fun loadCommunities(page: Int = 1) {
        viewModelScope.launch {
            _communitiesListState.update { it.copy(isLoading = true, error = null) }
            val q = _communitiesListState.value.searchQuery.takeIf { it.isNotBlank() }
            communityRepository.listCommunities(page = page, limit = 20, q = q)
                .onSuccess { response ->
                    updateCommunityCache(response.communities)
                    _communitiesListState.update {
                        it.copy(
                            communities = if (page == 1) response.communities else it.communities + response.communities,
                            total = response.total,
                            page = response.page,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                .onFailure { e ->
                    _communitiesListState.update {
                        it.copy(isLoading = false, error = e.message ?: "Failed to load communities")
                    }
                }
        }
    }

    fun setCreateCommunityName(name: String) {
        _createCommunityState.update { it.copy(name = name, error = null) }
    }

    fun setCreateCommunityDescription(desc: String) {
        _createCommunityState.update { it.copy(description = desc, error = null) }
    }

    fun createCommunity(
        rules: List<String> = emptyList(),
        tags: List<TagDto>? = null,
        coverImageUrl: String? = null,
        avatarUrl: String? = null,
        onSuccess: (String) -> Unit = {}
    ) {
        val name = _createCommunityState.value.name.trim()
        val description = _createCommunityState.value.description.trim()
        if (name.length < 3) {
            _createCommunityState.update { it.copy(error = "Name must be at least 3 characters") }
            return
        }
        if (description.isBlank()) {
            _createCommunityState.update { it.copy(error = "Description is required") }
            return
        }
        viewModelScope.launch {
            _createCommunityState.update { it.copy(isSubmitting = true, error = null) }
            communityRepository.createCommunity(
                CommunityCreate(
                    name = name,
                    description = description,
                    rules = rules,
                    tags = tags,
                    coverImageUrl = coverImageUrl,
                    avatarUrl = avatarUrl
                )
            )
                .onSuccess { community ->
                    _createCommunityState.update {
                        it.copy(isSubmitting = false, name = "", description = "", createdId = community.id, error = null)
                    }
                    loadCommunities(1)
                    onSuccess(community.id)
                }
                .onFailure { e ->
                    _createCommunityState.update {
                        it.copy(isSubmitting = false, error = e.message ?: "Failed to create community")
                    }
                }
        }
    }

    fun createCommunityRich(
        name: String,
        description: String,
        rules: List<String>,
        tags: List<WikidataTagSuggestion>,
        coverImageUri: Uri?,
        avatarImageUri: Uri?,
        onSuccess: (String) -> Unit = {}
    ) {
        setCreateCommunityName(name)
        setCreateCommunityDescription(description)
        viewModelScope.launch {
            _createCommunityState.update { it.copy(isSubmitting = true, error = null) }
            val coverImageUrl = coverImageUri?.let { uri ->
                uploadsRepository.uploadServiceImage(appContext, uri).getOrElse { err ->
                    _createCommunityState.update {
                        it.copy(isSubmitting = false, error = err.message ?: "Failed to upload cover image")
                    }
                    return@launch
                }
            }
            val avatarImageUrl = avatarImageUri?.let { uri ->
                uploadsRepository.uploadServiceImage(appContext, uri).getOrElse { err ->
                    _createCommunityState.update {
                        it.copy(isSubmitting = false, error = err.message ?: "Failed to upload avatar image")
                    }
                    return@launch
                }
            }
            _createCommunityState.update { it.copy(isSubmitting = false) }
            createCommunity(
                rules = rules,
                tags = tags.toTagDtos(),
                coverImageUrl = coverImageUrl,
                avatarUrl = avatarImageUrl,
                onSuccess = onSuccess
            )
        }
    }

    fun clearCreateCommunityState() {
        _createCommunityState.value = CreateCommunityState()
    }

    private suspend fun uploadImages(imageUris: List<Uri>): Result<List<String>> {
        if (imageUris.isEmpty()) return Result.success(emptyList())
        return coroutineScope {
            val deferred = imageUris.map { uri ->
                async { uploadsRepository.uploadServiceImage(appContext, uri) }
            }
            val results = deferred.map { it.await() }
            val firstFailure = results.firstOrNull { it.isFailure }?.exceptionOrNull()
            if (firstFailure != null) {
                Result.failure(firstFailure)
            } else {
                Result.success(results.mapNotNull { it.getOrNull() })
            }
        }
    }

    private fun appendImageLinks(baseText: String, urls: List<String>): String {
        if (urls.isEmpty()) return baseText.trim()
        val linksBlock = buildString {
            appendLine()
            appendLine()
            appendLine("Images:")
            urls.forEach { appendLine("- $it") }
        }
        return baseText.trim() + linksBlock
    }

    private fun List<WikidataTagSuggestion>.toTagDtos(): List<TagDto>? =
        this.mapNotNull { tag ->
            val id = tag.id.trim()
            if (id.isBlank()) null else TagDto(entityId = id, label = tag.label.trim(), aliases = emptyList())
        }.takeIf { it.isNotEmpty() }

    // --------------- Community Detail ---------------

    data class CommunityDetailState(
        val community: CommunityResponse? = null,
        val posts: List<CommunityPostResponse> = emptyList(),
        val postsTotal: Int = 0,
        val members: List<ForumUserEmbed> = emptyList(),
        val membersLoading: Boolean = false,
        val isLoading: Boolean = false,
        val postsLoading: Boolean = false,
        val membershipLoading: Boolean = false,
        val error: String? = null,
        val sortBy: String = "created_at"
    )

    data class CreatePostState(
        val title: String = "",
        val body: String = "",
        val isSubmitting: Boolean = false,
        val error: String? = null
    )

    private val _communityDetailState = MutableStateFlow(CommunityDetailState())
    val communityDetailState: StateFlow<CommunityDetailState> = _communityDetailState.asStateFlow()

    private val _createPostState = MutableStateFlow(CreatePostState())
    val createPostState: StateFlow<CreatePostState> = _createPostState.asStateFlow()

    fun loadCommunityDetail(communityId: String) {
        viewModelScope.launch {
            _communityDetailState.update { it.copy(isLoading = true, error = null) }
            communityRepository.getCommunity(communityId)
                .onSuccess { community ->
                    updateCommunityCache(listOf(community))
                    _communityDetailState.update { it.copy(community = community, isLoading = false) }
                    loadCommunityPosts(communityId)
                    loadCommunityMembers(communityId)
                }
                .onFailure { e ->
                    _communityDetailState.update { it.copy(isLoading = false, error = e.message ?: "Failed to load community") }
                }
        }
    }

    fun loadCommunityMembers(communityId: String) {
        viewModelScope.launch {
            _communityDetailState.update { it.copy(membersLoading = true) }
            communityRepository.getCommunityMembers(communityId)
                .onSuccess { members ->
                    _communityDetailState.update { it.copy(members = members, membersLoading = false) }
                }
                .onFailure {
                    _communityDetailState.update { it.copy(membersLoading = false) }
                }
        }
    }

    fun loadCommunityPosts(communityId: String, page: Int = 1) {
        viewModelScope.launch {
            _communityDetailState.update { it.copy(postsLoading = true) }
            val sortBy = _communityDetailState.value.sortBy
            communityRepository.getCommunityPosts(communityId, page = page, sortBy = sortBy)
                .onSuccess { resp ->
                    _communityDetailState.update {
                        it.copy(
                            posts = if (page == 1) resp.posts else it.posts + resp.posts,
                            postsTotal = resp.total,
                            postsLoading = false
                        )
                    }
                }
                .onFailure {
                    _communityDetailState.update { it.copy(postsLoading = false) }
                }
        }
    }

    fun setCommunityPostSort(communityId: String, sortBy: String) {
        _communityDetailState.update { it.copy(sortBy = sortBy) }
        loadCommunityPosts(communityId, page = 1)
    }

    fun joinCommunity(communityId: String) {
        viewModelScope.launch {
            _communityDetailState.update { it.copy(membershipLoading = true) }
            communityRepository.joinCommunity(communityId)
                .onSuccess { updated ->
                    _communityDetailState.update { it.copy(community = updated, membershipLoading = false) }
                    _communitiesListState.update { listState ->
                        listState.copy(communities = listState.communities.map { c ->
                            if (c.id == communityId) updated else c
                        })
                    }
                    loadCommunityMembers(communityId)
                }
                .onFailure { e ->
                    _communityDetailState.update { it.copy(membershipLoading = false, error = e.message) }
                }
        }
    }

    fun leaveCommunity(communityId: String) {
        viewModelScope.launch {
            _communityDetailState.update { it.copy(membershipLoading = true) }
            communityRepository.leaveCommunity(communityId)
                .onSuccess { updated ->
                    _communityDetailState.update { it.copy(community = updated, membershipLoading = false) }
                    _communitiesListState.update { listState ->
                        listState.copy(communities = listState.communities.map { c ->
                            if (c.id == communityId) updated else c
                        })
                    }
                }
                .onFailure { e ->
                    _communityDetailState.update { it.copy(membershipLoading = false, error = e.message) }
                }
        }
    }

    fun setCreatePostTitle(title: String) {
        _createPostState.update { it.copy(title = title, error = null) }
    }

    fun setCreatePostBody(body: String) {
        _createPostState.update { it.copy(body = body, error = null) }
    }

    fun createCommunityPost(communityId: String, onSuccess: () -> Unit = {}) {
        val title = _createPostState.value.title.trim()
        val body = _createPostState.value.body.trim()
        if (title.isBlank()) {
            _createPostState.update { it.copy(error = "Title is required") }
            return
        }
        if (body.isBlank()) {
            _createPostState.update { it.copy(error = "Body is required") }
            return
        }
        viewModelScope.launch {
            _createPostState.update { it.copy(isSubmitting = true, error = null) }
            communityRepository.createCommunityPost(communityId, CommunityPostCreate(title = title, body = body))
                .onSuccess { post ->
                    _createPostState.value = CreatePostState()
                    _communityDetailState.update { it.copy(posts = listOf(post) + it.posts, postsTotal = it.postsTotal + 1) }
                    _communityDetailState.update { s ->
                        s.copy(community = s.community?.copy(postCount = (s.community.postCount) + 1))
                    }
                    onSuccess()
                }
                .onFailure { e ->
                    _createPostState.update { it.copy(isSubmitting = false, error = e.message ?: "Failed to create post") }
                }
        }
    }

    fun clearCreatePostState() {
        _createPostState.value = CreatePostState()
    }

    fun upvoteCommunityPost(communityId: String, postId: String) {
        viewModelScope.launch {
            communityRepository.upvotePost(communityId, postId)
                .onSuccess { result ->
                    _communityDetailState.update { s ->
                        s.copy(posts = s.posts.map { p ->
                            if (p.id == postId) p.copy(upvoteCount = result.upvoteCount, userUpvoted = result.userUpvoted) else p
                        })
                    }
                }
                .onFailure { /* silent */ }
        }
    }

    fun ensureCommunity(communityId: String?) {
        val id = communityId?.trim().orEmpty()
        if (id.isBlank()) return
        if (_communityById.value.containsKey(id)) return
        viewModelScope.launch {
            communityRepository.getCommunity(id).onSuccess { community ->
                updateCommunityCache(listOf(community))
            }
        }
    }

    private fun updateCommunityCache(communities: List<CommunityResponse>) {
        if (communities.isEmpty()) return
        _communityById.update { existing ->
            buildMap {
                putAll(existing)
                communities.forEach { community ->
                    put(community.id, community)
                }
            }
        }
    }

    fun clearCommunityDetail() {
        _communityDetailState.value = CommunityDetailState()
        _createPostState.value = CreatePostState()
    }

}
