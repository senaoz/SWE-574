package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Switch
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.util.formatApplicationDate

@Composable
fun ForumScreen(
    modifier: Modifier = Modifier,
    viewModel: ForumViewModel = hiltViewModel()
) {
    var selectedDiscussionId by remember { mutableStateOf<String?>(null) }
    var selectedEventId by remember { mutableStateOf<String?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var showCreateEvent by remember { mutableStateOf(false) }
    val selectedTab by viewModel.selectedTab.collectAsState()

    if (showCreateEvent) {
        ForumCreateEventContent(
            viewModel = viewModel,
            onBack = { showCreateEvent = false },
            onCreated = { id ->
                showCreateEvent = false
                selectedEventId = id
            },
            modifier = modifier
        )
        return
    }

    if (showCreate) {
        ForumCreateDiscussionContent(
            viewModel = viewModel,
            onBack = { showCreate = false },
            onCreated = { id ->
                showCreate = false
                selectedDiscussionId = id
            },
            modifier = modifier
        )
        return
    }

    if (selectedEventId != null) {
        val id = selectedEventId!!
        LaunchedEffect(id) {
            viewModel.loadEvent(id)
        }
        ForumEventDetailContent(
            viewModel = viewModel,
            onBack = {
                viewModel.clearEventDetail()
                selectedEventId = null
            },
            modifier = modifier
        )
        return
    }

    if (selectedDiscussionId != null) {
        val id = selectedDiscussionId!!
        LaunchedEffect(id) {
            viewModel.loadDiscussion(id)
        }
        ForumDiscussionDetailContent(
            viewModel = viewModel,
            onBack = {
                viewModel.clearDetail()
                selectedDiscussionId = null
            },
            modifier = modifier
        )
        return
    }

    val listState by viewModel.listState.collectAsState()
    val eventsListState by viewModel.eventsListState.collectAsState()
    LaunchedEffect(Unit) {
        if (listState.discussions.isEmpty() && !listState.isLoading) viewModel.loadDiscussions()
        if (eventsListState.events.isEmpty() && !eventsListState.isLoading) viewModel.loadEvents()
    }
    LaunchedEffect(selectedTab) {
        if (selectedTab == ForumTab.EVENTS && eventsListState.events.isEmpty() && !eventsListState.isLoading) {
            viewModel.loadEvents(1)
        }
    }
    LaunchedEffect(listState.searchQuery) {
        if (listState.searchQuery.isNotBlank()) viewModel.loadDiscussions(1)
    }
    LaunchedEffect(eventsListState.searchQuery) {
        if (eventsListState.searchQuery.isNotBlank()) viewModel.loadEvents(1)
    }

    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedTab == ForumTab.DISCUSSIONS,
                onClick = { viewModel.setSelectedTab(ForumTab.DISCUSSIONS) },
                label = { Text("Discussions") }
            )
            FilterChip(
                selected = selectedTab == ForumTab.EVENTS,
                onClick = { viewModel.setSelectedTab(ForumTab.EVENTS) },
                label = { Text("Events") }
            )
        }

        if (selectedTab == ForumTab.DISCUSSIONS) {
            OutlinedTextField(
                value = listState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                placeholder = { Text("Search discussions…") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { viewModel.loadDiscussions(1) }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                    cursorColor = MaterialTheme.colorScheme.primary
                )
            )
            if (listState.isLoading && listState.discussions.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            } else if (listState.error != null && listState.discussions.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = listState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                        TextButton(onClick = { viewModel.loadDiscussions(1) }) { Text("Retry") }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(items = listState.discussions, key = { it.id }) { discussion ->
                        ForumDiscussionCard(
                            discussion = discussion,
                            onClick = { selectedDiscussionId = discussion.id }
                        )
                    }
                }
            }
            Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.CenterEnd) {
                FloatingActionButton(
                    onClick = { showCreate = true },
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ) {
                    Icon(Icons.Default.Add, contentDescription = "New discussion")
                }
            }
        } else {
            OutlinedTextField(
                value = eventsListState.searchQuery,
                onValueChange = { viewModel.setEventsSearchQuery(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                placeholder = { Text("Search events…") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { viewModel.loadEvents(1) }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                    cursorColor = MaterialTheme.colorScheme.primary
                )
            )
            if (eventsListState.isLoading && eventsListState.events.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            } else if (eventsListState.error != null && eventsListState.events.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = eventsListState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                        TextButton(onClick = { viewModel.loadEvents(1) }) { Text("Retry") }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(items = eventsListState.events, key = { it.id }) { event ->
                        ForumEventCard(
                            event = event,
                            onClick = { selectedEventId = event.id }
                        )
                    }
                }
            }
            Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.CenterEnd) {
                FloatingActionButton(
                    onClick = { showCreateEvent = true },
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ) {
                    Icon(Icons.Default.Add, contentDescription = "New event")
                }
            }
        }
    }
}

@Composable
private fun ForumDiscussionCard(
    discussion: ForumDiscussionResponse,
    onClick: () -> Unit
) {
    val author = discussion.user?.username ?: discussion.user?.fullName ?: "Unknown"
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = discussion.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = discussion.body.take(150) + if (discussion.body.length > 150) "…" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = author,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${discussion.commentCount} comments · ${formatApplicationDate(discussion.createdAt)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ForumEventCard(
    event: ForumEventResponse,
    onClick: () -> Unit
) {
    val author = event.user?.username ?: event.user?.fullName ?: "Unknown"
    val locationText = event.location?.takeIf { it.isNotBlank() }
        ?: if (event.isRemote) "Remote" else "—"
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = event.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = event.description.take(120) + if (event.description.length > 120) "…" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = formatApplicationDate(event.eventAt),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = author,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$locationText · ${event.commentCount} comments",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ForumEventDetailContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val eventDetailState by viewModel.eventDetailState.collectAsState()
    val newCommentText by viewModel.newCommentText.collectAsState()
    val focusManager = LocalFocusManager.current

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(text = "Event", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(start = 8.dp))
            }
        }
    ) { innerPadding ->
        if (eventDetailState.isLoading && eventDetailState.event == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        } else if (eventDetailState.error != null && eventDetailState.event == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding).padding(16.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = eventDetailState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                    TextButton(onClick = { eventDetailState.event?.let { viewModel.loadEvent(it.id) } }) { Text("Retry") }
                }
            }
        } else {
            val event = eventDetailState.event ?: return@Scaffold
            Column(modifier = modifier.fillMaxSize().padding(innerPadding)) {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = event.title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                                Text(text = event.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = "${formatApplicationDate(event.eventAt)}${event.location?.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""}${if (event.isRemote) " · Remote" else ""}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${event.user?.username ?: "User"} · ${formatApplicationDate(event.createdAt)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    item {
                        Text(
                            text = "Comments (${eventDetailState.commentsTotal})",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (eventDetailState.commentsLoading && eventDetailState.comments.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(32.dp), color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    } else {
                        items(items = eventDetailState.comments, key = { it.id }) { comment ->
                            ForumCommentItem(comment = comment)
                        }
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = newCommentText,
                        onValueChange = { viewModel.setNewCommentText(it) },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Add a comment…") },
                        maxLines = 3,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                viewModel.submitCommentForEvent(event.id)
                                focusManager.clearFocus()
                            }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline
                        )
                    )
                    IconButton(onClick = { viewModel.submitCommentForEvent(event.id); focusManager.clearFocus() }) {
                        Icon(Icons.Default.Send, contentDescription = "Send comment")
                    }
                }
            }
        }
    }
}

@Composable
private fun ForumCreateEventContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val createEventState by viewModel.createEventState.collectAsState()
    val createdId = createEventState.createdId
    LaunchedEffect(createdId) {
        createdId?.let { id ->
            viewModel.clearCreateEventState()
            onCreated(id)
        }
    }
    Scaffold(
        topBar = {
            Row(
                modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surface).padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(text = "New event", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(start = 8.dp))
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier.fillMaxSize().padding(innerPadding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = createEventState.title,
                onValueChange = { viewModel.setCreateEventTitle(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Title") },
                placeholder = { Text("At least 3 characters") },
                singleLine = true,
                isError = createEventState.error != null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            OutlinedTextField(
                value = createEventState.description,
                onValueChange = { viewModel.setCreateEventDescription(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Description") },
                placeholder = { Text("What's the event about?") },
                minLines = 3,
                isError = createEventState.error != null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            OutlinedTextField(
                value = createEventState.eventAt,
                onValueChange = { viewModel.setCreateEventAt(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Date & time") },
                placeholder = { Text("e.g. 2026-03-15T14:00:00 or Mar 15, 2026 2:00 PM") },
                singleLine = true,
                isError = createEventState.error != null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            OutlinedTextField(
                value = createEventState.location,
                onValueChange = { viewModel.setCreateEventLocation(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Location (optional)") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Remote event", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                Switch(
                    checked = createEventState.isRemote,
                    onCheckedChange = { viewModel.setCreateEventIsRemote(it) }
                )
            }
            if (createEventState.error != null) {
                Text(
                    text = createEventState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onBack) { Text("Cancel") }
                if (createEventState.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.primary)
                } else {
                    TextButton(onClick = { viewModel.createEvent() }) { Text("Create event") }
                }
            }
        }
    }
}

@Composable
private fun ForumDiscussionDetailContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val detailState by viewModel.detailState.collectAsState()
    val newCommentText by viewModel.newCommentText.collectAsState()
    val focusManager = LocalFocusManager.current

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back"
                    )
                }
                Text(
                    text = "Discussion",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }
        }
    ) { innerPadding ->
        if (detailState.isLoading && detailState.discussion == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        } else if (detailState.error != null && detailState.discussion == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = detailState.error!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    TextButton(onClick = { detailState.discussion?.let { viewModel.loadDiscussion(it.id) } }) {
                        Text("Retry")
                    }
                }
            }
        } else {
            val discussion = detailState.discussion ?: return@Scaffold
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = discussion.title,
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = discussion.body,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${discussion.user?.username ?: "User"} · ${formatApplicationDate(discussion.createdAt)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    item {
                        Text(
                            text = "Comments (${detailState.commentsTotal})",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (detailState.commentsLoading && detailState.comments.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier.fillMaxWidth(),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(32.dp),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    } else {
                        items(
                            items = detailState.comments,
                            key = { it.id }
                        ) { comment ->
                            ForumCommentItem(comment = comment)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = newCommentText,
                        onValueChange = { viewModel.setNewCommentText(it) },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Add a comment…") },
                        maxLines = 3,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                viewModel.submitComment(discussion.id)
                                focusManager.clearFocus()
                            }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline
                        )
                    )
                    IconButton(
                        onClick = {
                            viewModel.submitComment(discussion.id)
                            focusManager.clearFocus()
                        }
                    ) {
                        Icon(
                            Icons.Default.Send,
                            contentDescription = "Send comment"
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ForumCommentItem(comment: ForumCommentResponse) {
    val author = comment.user?.username ?: comment.user?.fullName ?: "Unknown"
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = comment.content,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "$author · ${formatApplicationDate(comment.createdAt)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ForumCreateDiscussionContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val createState by viewModel.createState.collectAsState()

    val createdId = createState.createdId
    LaunchedEffect(createdId) {
        createdId?.let { id ->
            viewModel.clearCreateState()
            onCreated(id)
        }
    }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back"
                    )
                }
                Text(
                    text = "New discussion",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = createState.title,
                onValueChange = { viewModel.setCreateTitle(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Title") },
                placeholder = { Text("At least 3 characters") },
                singleLine = true,
                isError = createState.error != null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            OutlinedTextField(
                value = createState.body,
                onValueChange = { viewModel.setCreateBody(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f, fill = false),
                label = { Text("Body") },
                placeholder = { Text("What do you want to discuss?") },
                minLines = 4,
                isError = createState.error != null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            if (createState.error != null) {
                Text(
                    text = createState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = onBack) {
                    Text("Cancel")
                }
                if (createState.isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.primary
                    )
                } else {
                    TextButton(
                        onClick = { viewModel.createDiscussion() }
                    ) {
                        Text("Post")
                    }
                }
            }
        }
    }
}
