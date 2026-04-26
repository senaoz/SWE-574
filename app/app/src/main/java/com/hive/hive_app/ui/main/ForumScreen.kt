package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.material3.Surface
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
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
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.ForumUserEmbed
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.Color
import com.hive.hive_app.util.formatApplicationDate
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import androidx.compose.runtime.DisposableEffect
import androidx.core.content.ContextCompat
import android.content.Context
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import coil.request.ImageRequest

@Composable
fun ForumScreen(
    modifier: Modifier = Modifier,
    onOpenUserProfile: (String) -> Unit = {},
    viewModel: ForumViewModel = hiltViewModel()
) {
    var selectedDiscussionId by remember { mutableStateOf<String?>(null) }
    var selectedEventId by remember { mutableStateOf<String?>(null) }
    var selectedCommunityId by remember { mutableStateOf<String?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var showCreateEvent by remember { mutableStateOf(false) }
    var showCreateCommunity by remember { mutableStateOf(false) }
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
            onOpenUserProfile = onOpenUserProfile,
            modifier = modifier
        )
        return
    }

    if (selectedCommunityId != null) {
        val id = selectedCommunityId!!
        LaunchedEffect(id) {
            viewModel.loadCommunityDetail(id)
        }
        CommunityDetailScreen(
            communityId = id,
            viewModel = viewModel,
            onBack = {
                viewModel.clearCommunityDetail()
                selectedCommunityId = null
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
    val communitiesListState by viewModel.communitiesListState.collectAsState()
    LaunchedEffect(Unit) {
        if (listState.discussions.isEmpty() && !listState.isLoading) viewModel.loadDiscussions()
        if (eventsListState.events.isEmpty() && !eventsListState.isLoading) viewModel.loadEvents()
    }
    LaunchedEffect(selectedTab) {
        if (selectedTab == ForumTab.EVENTS && eventsListState.events.isEmpty() && !eventsListState.isLoading) {
            viewModel.loadEvents(1)
        }
        if (selectedTab == ForumTab.COMMUNITIES && communitiesListState.communities.isEmpty() && !communitiesListState.isLoading) {
            viewModel.loadCommunities(1)
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
            FilterChip(
                selected = selectedTab == ForumTab.COMMUNITIES,
                onClick = { viewModel.setSelectedTab(ForumTab.COMMUNITIES) },
                label = { Text("Communities") }
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
            Box(modifier = Modifier.weight(1f)) {
                if (listState.isLoading && listState.discussions.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                } else if (listState.error != null && listState.discussions.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = listState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                            TextButton(onClick = { viewModel.loadDiscussions(1) }) { Text("Retry") }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 88.dp),
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

            }
        } else if (selectedTab == ForumTab.COMMUNITIES) {
            CommunitiesContent(
                viewModel = viewModel,
                onCommunityClick = { id -> selectedCommunityId = id }
            )
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
            Box(modifier = Modifier.weight(1f)) {
                if (eventsListState.isLoading && eventsListState.events.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                } else if (eventsListState.error != null && eventsListState.events.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = eventsListState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                            TextButton(onClick = { viewModel.loadEvents(1) }) { Text("Retry") }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 88.dp),
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

            }
        }
    }
}

@Composable
private fun ForumEventMap(
    latitude: Double,
    longitude: Double,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var mapView by remember { mutableStateOf<MapView?>(null) }
    Box(modifier = modifier) {
        AndroidView(
            factory = {
                Configuration.getInstance().load(it, it.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
                MapView(it).apply {
                    setTileSource(
                        XYTileSource(
                            "Carto Voyager",
                            0, 18, 256, ".png",
                            arrayOf("https://a.basemaps.cartocdn.com/rastertiles/voyager/"),
                            "© CARTO"
                        )
                    )
                    setMultiTouchControls(true)
                    controller.setCenter(GeoPoint(latitude, longitude))
                    controller.setZoom(14.0)
                    val pin = ContextCompat.getDrawable(it, com.hive.hive_app.R.drawable.ic_map_pin_offer)
                    val marker = Marker(this).apply {
                        position = GeoPoint(latitude, longitude)
                        setAnchor(Marker.ANCHOR_BOTTOM, Marker.ANCHOR_CENTER)
                        setIcon(pin)
                    }
                    overlays.add(marker)
                    mapView = this
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { mapView = it }
        )
        DisposableEffect(lifecycleOwner) {
            val observer = LifecycleEventObserver { _, event ->
                when (event) {
                    Lifecycle.Event.ON_RESUME -> mapView?.onResume()
                    Lifecycle.Event.ON_PAUSE -> mapView?.onPause()
                    else -> {}
                }
            }
            lifecycleOwner.lifecycle.addObserver(observer)
            onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
        }
    }
}

private fun forumUserInitials(user: ForumUserEmbed?): String {
    val name = user?.username?.takeIf { it.isNotBlank() }
        ?: user?.fullName?.takeIf { it.isNotBlank() }
        ?: "?"
    return name.trim().firstOrNull()?.uppercase() ?: "?"
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
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = forumUserInitials(discussion.user),
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = discussion.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = author,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Text(
                text = discussion.body.take(150) + if (discussion.body.length > 150) "…" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (!discussion.tags.isNullOrEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    discussion.tags.forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(percent = 50),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                        ) {
                            Text(
                                text = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${discussion.commentCount} comments",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formatApplicationDate(discussion.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private fun formatEventTimeLeft(eventAtIso: String?): String? {
    if (eventAtIso.isNullOrBlank()) return null
    return try {
        val input = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
        val date = input.parse(eventAtIso.take(19)) ?: return null
        val now = System.currentTimeMillis()
        val diff = date.time - now
        if (diff < 0) "Past"
        else when {
            diff < 60_000 -> "In ${diff / 1000} sec"
            diff < 3600_000 -> "${diff / 60_000} min left"
            diff < 24 * 3600_000 -> "${diff / 3600_000} hours left"
            else -> "${diff / (24 * 3600_000)} days left"
        }
    } catch (_: Exception) { null }
}

@Composable
private fun ForumEventCard(
    event: ForumEventResponse,
    onClick: () -> Unit
) {
    val author = event.user?.username ?: event.user?.fullName ?: "Unknown"
    val locationText = event.location?.takeIf { it.isNotBlank() }
        ?: if (event.isRemote) "Remote" else "—"
    val timeLeft = formatEventTimeLeft(event.eventAt)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = forumUserInitials(event.user),
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = event.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = author,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
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
            timeLeft?.let { left ->
                Text(
                    text = left,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (!event.tags.isNullOrEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    event.tags.forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(percent = 50),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                        ) {
                            Text(
                                text = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = locationText,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val attendeeCount = event.attendeeCount.takeIf { it > 0 } ?: event.attendeeIds?.size ?: 0
                    if (attendeeCount > 0) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Filled.People,
                                contentDescription = "Attendees",
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = attendeeCount.toString(),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.ChatBubble,
                            contentDescription = "Comments",
                            modifier = Modifier.size(14.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = event.commentCount.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ForumEventDetailContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {},
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
            val eventTimeLeft = formatEventTimeLeft(event.eventAt)
            Column(modifier = modifier.fillMaxSize().padding(innerPadding)) {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.primaryContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = forumUserInitials(event.user),
                                            style = MaterialTheme.typography.titleMedium,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = event.title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                                        Text(
                                            text = event.user?.username ?: event.user?.fullName ?: "User",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Text(text = event.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = "${formatApplicationDate(event.eventAt)}${event.location?.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""}${if (event.isRemote) " · Remote" else ""}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                eventTimeLeft?.let { left ->
                                    Text(
                                        text = left,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (!event.tags.isNullOrEmpty()) {
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        event.tags.forEach { tag ->
                                            Surface(
                                                shape = RoundedCornerShape(percent = 50),
                                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                                            ) {
                                                Text(
                                                    text = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface,
                                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                                if (event.latitude != null && event.longitude != null) {
                                    ForumEventMap(
                                        latitude = event.latitude,
                                        longitude = event.longitude,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(180.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                }
                            }
                        }
                    }
                    item {
                        val currentUserId = eventDetailState.currentUserId
                        val isOrganizer = currentUserId != null && event.userId == currentUserId
                        val isAttending = currentUserId != null &&
                                event.attendeeIds?.contains(currentUserId) == true

                        if (currentUserId != null && !isOrganizer) {
                            if (isAttending) {
                                OutlinedButton(
                                    onClick = { viewModel.toggleAttend(event.id) },
                                    enabled = !eventDetailState.isAttendingLoading,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = MaterialTheme.colorScheme.error
                                    )
                                ) {
                                    if (eventDetailState.isAttendingLoading) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Leave")
                                    }
                                }
                            } else {
                                Button(
                                    onClick = { viewModel.toggleAttend(event.id) },
                                    enabled = !eventDetailState.isAttendingLoading,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    if (eventDetailState.isAttendingLoading) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp,
                                            color = MaterialTheme.colorScheme.onPrimary
                                        )
                                    } else {
                                        Text("Attend")
                                    }
                                }
                            }
                        }
                    }
                    item {
                        val attendeeCount = event.attendeeCount.takeIf { it > 0 } ?: event.attendeeIds?.size ?: eventDetailState.attendees.size
                        Text(
                            text = "Attendees ($attendeeCount)",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    items(items = eventDetailState.attendees, key = { it.id ?: it.username ?: "" }) { attendee ->
                        val ctx = LocalContext.current
                        var imageLoadFailed by remember { mutableStateOf(false) }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(MaterialTheme.shapes.small)
                                .clickable(enabled = attendee.id != null) { attendee.id?.let { id -> onOpenUserProfile(id) } }
                                .padding(vertical = 6.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            val initial = (attendee.username ?: attendee.fullName ?: "?")
                                .trim().firstOrNull()?.uppercase() ?: "?"
                            if (!attendee.profilePicture.isNullOrBlank() && !imageLoadFailed) {
                                AsyncImage(
                                    model = ImageRequest.Builder(ctx)
                                        .data(attendee.profilePicture)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = attendee.username,
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                    onError = { imageLoadFailed = true },
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = initial,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            Text(
                                text = attendee.fullName?.takeIf { it.isNotBlank() } ?: attendee.username ?: "User",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
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
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.primaryContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = forumUserInitials(discussion.user),
                                            style = MaterialTheme.typography.titleMedium,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = discussion.title,
                                            style = MaterialTheme.typography.titleLarge,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "${discussion.user?.username ?: discussion.user?.fullName ?: "User"} · ${formatApplicationDate(discussion.createdAt)}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Text(
                                    text = discussion.body,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (!discussion.tags.isNullOrEmpty()) {
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        discussion.tags.forEach { tag ->
                                            Surface(
                                                shape = RoundedCornerShape(percent = 50),
                                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                                            ) {
                                                Text(
                                                    text = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface,
                                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                                )
                                            }
                                        }
                                    }
                                }
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
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = forumUserInitials(comment.user),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Column(modifier = Modifier.weight(1f)) {
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

// ─── Communities List ─────────────────────────────────────────────────────────

@Composable
fun CommunitiesContent(
    viewModel: ForumViewModel,
    modifier: Modifier = Modifier,
    onCommunityClick: (String) -> Unit = {}
) {
    val state by viewModel.communitiesListState.collectAsState()

    Column(modifier = modifier.fillMaxSize()) {
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = { viewModel.setCommunitySearchQuery(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            placeholder = { Text("Search communities…") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { viewModel.loadCommunities(1) }),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                cursorColor = MaterialTheme.colorScheme.primary
            )
        )

        Box(modifier = Modifier.weight(1f)) {
            when {
                state.isLoading && state.communities.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
                state.error != null && state.communities.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = state.error!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            TextButton(onClick = { viewModel.loadCommunities(1) }) { Text("Retry") }
                        }
                    }
                }
                state.communities.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No communities yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 88.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(items = state.communities, key = { it.id }) { community ->
                            CommunityCard(
                                community = community,
                                onClick = { onCommunityClick(community.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CommunityCard(
    community: CommunityResponse,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Avatar circle
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    if (!community.avatarUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(community.avatarUrl)
                                .crossfade(true)
                                .build(),
                            contentDescription = community.name,
                            modifier = Modifier.fillMaxSize().clip(CircleShape)
                        )
                    } else {
                        Text(
                            text = community.name.firstOrNull()?.uppercase() ?: "C",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = community.name,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        if (community.userMembership != null) {
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                Text(
                                    text = when (community.userMembership) {
                                        "founder" -> "Founder"
                                        "moderator" -> "Mod"
                                        else -> "Member"
                                    },
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "${community.memberCount} members",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${community.postCount} posts",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (community.description.isNotBlank()) {
                Text(
                    text = community.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (!community.founder?.fullName.isNullOrBlank()) {
                Text(
                    text = "by ${community.founder?.fullName ?: community.founder?.username ?: ""}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  Community Detail Screen
// ─────────────────────────────────────────────────────────────
@Composable
fun CommunityDetailScreen(
    communityId: String,
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val detailState by viewModel.communityDetailState.collectAsState()
    val createPostState by viewModel.createPostState.collectAsState()
    var showNewPost by remember { mutableStateOf(false) }

    val community = detailState.community

    Column(modifier = modifier.fillMaxSize()) {
        // ── Top bar ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            Text(
                text = community?.name ?: "Community",
                style = MaterialTheme.typography.titleMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
        }

        if (detailState.isLoading && community == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return@Column
        }

        if (community == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Community not found.", color = MaterialTheme.colorScheme.error)
            }
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 88.dp)
        ) {
            // ── Community header card ──
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                if (!community.avatarUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(LocalContext.current)
                                            .data(community.avatarUrl).crossfade(true).build(),
                                        contentDescription = community.name,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape)
                                    )
                                } else {
                                    Text(
                                        text = community.name.firstOrNull()?.uppercase() ?: "C",
                                        style = MaterialTheme.typography.titleLarge,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(community.name, style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = "${community.memberCount} members · ${community.postCount} posts",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (!community.founder?.fullName.isNullOrBlank()) {
                                    Text(
                                        text = "by ${community.founder?.fullName ?: community.founder?.username ?: ""}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        if (community.description.isNotBlank()) {
                            Text(
                                text = community.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 10.dp)
                            )
                        }

                        if (community.rules.isNotEmpty()) {
                            Column(modifier = Modifier.padding(top = 10.dp)) {
                                Text("Rules", style = MaterialTheme.typography.labelMedium)
                                community.rules.forEachIndexed { i, rule ->
                                    Text(
                                        text = "${i + 1}. $rule",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        // ── Join / Leave button ──
                        val membership = community.userMembership
                        val isFounder = membership == "founder"
                        val isMember = membership != null
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (!isMember) {
                                Button(
                                    onClick = { viewModel.joinCommunity(communityId) },
                                    enabled = !detailState.membershipLoading
                                ) {
                                    if (detailState.membershipLoading) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Join")
                                    }
                                }
                            } else if (!isFounder) {
                                OutlinedButton(
                                    onClick = { viewModel.leaveCommunity(communityId) },
                                    enabled = !detailState.membershipLoading
                                ) {
                                    if (detailState.membershipLoading) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Leave")
                                    }
                                }
                            }
                            if (isMember) {
                                Button(onClick = { showNewPost = true }) {
                                    Text("+ New Post")
                                }
                            }
                        }
                    }
                }
            }

            // ── Sort row ──
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Sort:", style = MaterialTheme.typography.labelMedium)
                    FilterChip(
                        selected = detailState.sortBy == "created_at",
                        onClick = { viewModel.setCommunityPostSort(communityId, "created_at") },
                        label = { Text("Latest") }
                    )
                    FilterChip(
                        selected = detailState.sortBy == "upvote_count",
                        onClick = { viewModel.setCommunityPostSort(communityId, "upvote_count") },
                        label = { Text("Top") }
                    )
                }
            }

            // ── New post form ──
            if (showNewPost) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("New Post", style = MaterialTheme.typography.titleSmall)
                            OutlinedTextField(
                                value = createPostState.title,
                                onValueChange = { viewModel.setCreatePostTitle(it) },
                                label = { Text("Title") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = createPostState.body,
                                onValueChange = { viewModel.setCreatePostBody(it) },
                                label = { Text("Body") },
                                modifier = Modifier.fillMaxWidth().height(120.dp),
                                maxLines = 6
                            )
                            if (createPostState.error != null) {
                                Text(createPostState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                TextButton(onClick = {
                                    showNewPost = false
                                    viewModel.clearCreatePostState()
                                }) { Text("Cancel") }
                                Button(
                                    onClick = {
                                        viewModel.createCommunityPost(communityId) { showNewPost = false }
                                    },
                                    enabled = !createPostState.isSubmitting
                                ) {
                                    if (createPostState.isSubmitting) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Post")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Non-member notice ──
            if (community.userMembership == null) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                            Text(
                                "Join this community to create posts.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // ── Posts loading ──
            if (detailState.postsLoading && detailState.posts.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
            } else if (detailState.posts.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text("No posts yet. Be the first!", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                items(items = detailState.posts, key = { it.id }) { post ->
                    CommunityPostCard(
                        post = post,
                        onUpvote = { viewModel.upvoteCommunityPost(communityId, post.id) },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun CommunityPostCard(
    post: CommunityPostResponse,
    onUpvote: () -> Unit,
    modifier: Modifier = Modifier
) {
    fun timeAgo(dateStr: String): String {
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val date = sdf.parse(dateStr.substringBefore(".").substringBefore("Z")) ?: return dateStr
            val diffMs = System.currentTimeMillis() - date.time
            val mins = diffMs / 60000
            when {
                mins < 1 -> "just now"
                mins < 60 -> "${mins}m ago"
                mins < 1440 -> "${mins / 60}h ago"
                mins < 43200 -> "${mins / 1440}d ago"
                else -> java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(date)
            }
        } catch (e: Exception) { dateStr }
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header row: avatar + author + time
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    val initials = post.user?.fullName?.firstOrNull()?.uppercase()
                        ?: post.user?.username?.firstOrNull()?.uppercase() ?: "?"
                    Text(initials, style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = post.user?.fullName ?: post.user?.username ?: "Unknown",
                        style = MaterialTheme.typography.labelMedium
                    )
                    Text(timeAgo(post.createdAt), style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (post.isPinned) {
                    Surface(shape = RoundedCornerShape(4.dp), color = MaterialTheme.colorScheme.tertiaryContainer) {
                        Text("📌 Pinned", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onTertiaryContainer,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // Title
            Text(
                text = post.title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Body preview
            if (post.body.isNotBlank()) {
                Text(
                    text = post.body,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(Modifier.height(8.dp))

            // Footer: upvote + comments
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.clickable { onUpvote() }
                ) {
                    Icon(
                        Icons.Filled.ThumbUp,
                        contentDescription = "Upvote",
                        modifier = Modifier.size(16.dp),
                        tint = if (post.userUpvoted) MaterialTheme.colorScheme.primary
                               else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${post.upvoteCount}",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (post.userUpvoted) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Filled.ChatBubble, contentDescription = "Comments",
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${post.commentCount}", style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
