@file:OptIn(ExperimentalMaterial3Api::class)

package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import coil.compose.AsyncImage
import com.hive.hive_app.data.api.dto.CommunityPostResponse
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.api.dto.ForumCommentResponse
import com.hive.hive_app.data.api.dto.ForumDiscussionResponse
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ForumUserEmbed
import com.hive.hive_app.util.formatApplicationDate
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.FlowRow

// ─── Main forum screen ────────────────────────────────────────────────────────

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
        LaunchedEffect(id) { viewModel.loadEvent(id) }
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
        LaunchedEffect(id) { viewModel.loadCommunityDetail(id) }
        CommunityDetailScreen(
            communityId = id,
            viewModel = viewModel,
            onBack = {
                viewModel.clearCommunityDetail()
                selectedCommunityId = null
            },
            onOpenUserProfile = onOpenUserProfile,
            modifier = modifier
        )
        return
    }

    if (selectedDiscussionId != null) {
        val id = selectedDiscussionId!!
        LaunchedEffect(id) { viewModel.loadDiscussion(id) }
        ForumDiscussionDetailContent(
            viewModel = viewModel,
            onBack = {
                viewModel.clearDetail()
                selectedDiscussionId = null
            },
            onOpenUserProfile = onOpenUserProfile,
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

    val forumTabs = listOf(ForumTab.DISCUSSIONS, ForumTab.EVENTS, ForumTab.COMMUNITIES)
    val tabIndex = forumTabs.indexOf(selectedTab).coerceAtLeast(0)

    Column(modifier = modifier.fillMaxSize()) {
        // ── Tab row ──
        PrimaryTabRow(selectedTabIndex = tabIndex) {
            Tab(
                selected = selectedTab == ForumTab.DISCUSSIONS,
                onClick = { viewModel.setSelectedTab(ForumTab.DISCUSSIONS) },
                icon = { Icon(Icons.Filled.Forum, contentDescription = null, modifier = Modifier.size(18.dp)) },
                text = { Text("Discussions") }
            )
            Tab(
                selected = selectedTab == ForumTab.EVENTS,
                onClick = { viewModel.setSelectedTab(ForumTab.EVENTS) },
                icon = { Icon(Icons.Filled.Event, contentDescription = null, modifier = Modifier.size(18.dp)) },
                text = { Text("Events") }
            )
            Tab(
                selected = selectedTab == ForumTab.COMMUNITIES,
                onClick = { viewModel.setSelectedTab(ForumTab.COMMUNITIES) },
                icon = { Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(18.dp)) },
                text = { Text("Communities") }
            )
        }

        when (selectedTab) {
            ForumTab.DISCUSSIONS -> {
                OutlinedTextField(
                    value = listState.searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Search discussions…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
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
                    when {
                        listState.isLoading && listState.discussions.isEmpty() -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            }
                        }
                        listState.error != null && listState.discussions.isEmpty() -> {
                            Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(text = listState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                                    TextButton(onClick = { viewModel.loadDiscussions(1) }) { Text("Retry") }
                                }
                            }
                        }
                        else -> {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(items = listState.discussions, key = { it.id }) { discussion ->
                                    ForumDiscussionCard(
                                        discussion = discussion,
                                        onClick = { selectedDiscussionId = discussion.id },
                                        onOpenUserProfile = onOpenUserProfile
                                    )
                                }
                            }
                        }
                    }
                }
            }

            ForumTab.EVENTS -> {
                OutlinedTextField(
                    value = eventsListState.searchQuery,
                    onValueChange = { viewModel.setEventsSearchQuery(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Search events…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
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
                    when {
                        eventsListState.isLoading && eventsListState.events.isEmpty() -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            }
                        }
                        eventsListState.error != null && eventsListState.events.isEmpty() -> {
                            Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(text = eventsListState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                                    TextButton(onClick = { viewModel.loadEvents(1) }) { Text("Retry") }
                                }
                            }
                        }
                        else -> {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(items = eventsListState.events, key = { it.id }) { event ->
                                    ForumEventCard(
                                        event = event,
                                        onClick = { selectedEventId = event.id },
                                        onOpenUserProfile = onOpenUserProfile
                                    )
                                }
                            }
                        }
                    }
                }
            }

            ForumTab.COMMUNITIES -> {
                CommunitiesContent(
                    viewModel = viewModel,
                    onCommunityClick = { id -> selectedCommunityId = id }
                )
            }
        }
    }
}

// ─── Map helper ──────────────────────────────────────────────────────────────

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

// ─── Shared avatar helpers ────────────────────────────────────────────────────

private fun forumUserInitials(user: ForumUserEmbed?): String {
    val name = user?.fullName?.takeIf { it.isNotBlank() }
        ?: user?.username?.takeIf { it.isNotBlank() }
        ?: "?"
    return name.trim().firstOrNull()?.uppercase() ?: "?"
}

private fun forumUserDisplayName(user: ForumUserEmbed?): String =
    user?.fullName?.takeIf { it.isNotBlank() }
        ?: user?.username?.takeIf { it.isNotBlank() }
        ?: "Unknown"

@Composable
private fun ForumUserAvatar(
    user: ForumUserEmbed?,
    size: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var imageLoadFailed by remember { mutableStateOf(false) }
    val model = buildImageRequest(context, user?.profilePicture)

    if (model != null && !imageLoadFailed) {
        AsyncImage(
            model = model,
            contentDescription = user?.username ?: user?.fullName,
            contentScale = ContentScale.Crop,
            onError = { imageLoadFailed = true },
            modifier = modifier.size(size).clip(CircleShape)
        )
    } else {
        Box(
            modifier = modifier
                .size(size)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = forumUserInitials(user),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
private fun CommunityAvatar(
    name: String,
    avatarUrl: String?,
    size: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var imageLoadFailed by remember { mutableStateOf(false) }
    val model = buildImageRequest(context, avatarUrl)

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center
    ) {
        if (model != null && !imageLoadFailed) {
            AsyncImage(
                model = model,
                contentDescription = name,
                contentScale = ContentScale.Crop,
                onError = { imageLoadFailed = true },
                modifier = Modifier.fillMaxSize().clip(CircleShape)
            )
        } else {
            Text(
                text = name.firstOrNull()?.uppercase() ?: "C",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

// ─── Tag chip helper ──────────────────────────────────────────────────────────

@Composable
private fun TagChipsRow(
    tags: List<com.hive.hive_app.data.api.dto.TagDto>,
    prefix: String? = null
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        tags.forEach { tag ->
            Surface(
                shape = RoundedCornerShape(percent = 50),
                color = MaterialTheme.colorScheme.secondaryContainer
            ) {
                val label = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: ""
                Text(
                    text = if (prefix.isNullOrEmpty()) label else "$prefix$label",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ─── Discussion card ──────────────────────────────────────────────────────────

@Composable
private fun ForumDiscussionCard(
    discussion: ForumDiscussionResponse,
    onClick: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {}
) {
    val author = forumUserDisplayName(discussion.user)
    val authorId = discussion.user?.resolvedId ?: discussion.userId

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            // Left accent bar
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(MaterialTheme.colorScheme.primary)
            )
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ForumUserAvatar(
                        user = discussion.user,
                        size = 36.dp,
                        modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                    )
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                    ) {
                        Text(
                            text = discussion.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
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
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
                if (!discussion.tags.isNullOrEmpty()) {
                    TagChipsRow(tags = discussion.tags)
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.ChatBubble,
                            contentDescription = "Comments",
                            modifier = Modifier.size(13.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "${discussion.commentCount}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Text(
                        text = formatApplicationDate(discussion.createdAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// ─── Event card helpers ───────────────────────────────────────────────────────

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

private fun formatDateBadge(iso: String?): Pair<String, String>? {
    if (iso.isNullOrBlank()) return null
    return try {
        val fmt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
        val date = fmt.parse(iso.take(19)) ?: return null
        val day = java.text.SimpleDateFormat("d", java.util.Locale.US).format(date)
        val month = java.text.SimpleDateFormat("MMM", java.util.Locale.US).format(date).uppercase()
        Pair(day, month)
    } catch (_: Exception) { null }
}

@Composable
private fun EventDateBadge(day: String, month: String) {
    Box(
        modifier = Modifier
            .size(52.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(
                text = day,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = month,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

// ─── Event card ───────────────────────────────────────────────────────────────

@Composable
private fun ForumEventCard(
    event: ForumEventResponse,
    onClick: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {}
) {
    val author = forumUserDisplayName(event.user)
    val authorId = event.user?.resolvedId ?: event.userId
    val locationText = event.location?.takeIf { it.isNotBlank() }
    val timeLeft = formatEventTimeLeft(event.eventAt)
    val dateBadge = formatDateBadge(event.eventAt)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Date badge replaces avatar for events
                if (dateBadge != null) {
                    EventDateBadge(day = dateBadge.first, month = dateBadge.second)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = event.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                    ) {
                        ForumUserAvatar(user = event.user, size = 18.dp)
                        Text(
                            text = author,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                // Time-left chip
                if (timeLeft != null) {
                    val isPast = timeLeft == "Past"
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = if (isPast) MaterialTheme.colorScheme.surfaceVariant
                                else MaterialTheme.colorScheme.tertiaryContainer
                    ) {
                        Text(
                            text = timeLeft,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isPast) MaterialTheme.colorScheme.onSurfaceVariant
                                    else MaterialTheme.colorScheme.onTertiaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            Text(
                text = event.description.take(120) + if (event.description.length > 120) "…" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            // Meta row: location + remote + attendees + comments
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (locationText != null) {
                        Icon(
                            Icons.Filled.LocationOn,
                            contentDescription = null,
                            modifier = Modifier.size(13.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = locationText,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    if (event.isRemote) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Wifi,
                                    contentDescription = null,
                                    modifier = Modifier.size(10.dp),
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "Remote",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val attendeeCount = event.attendeeCount.takeIf { it > 0 } ?: event.attendeeIds?.size ?: 0
                    if (attendeeCount > 0) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Filled.People,
                                contentDescription = "Attendees",
                                modifier = Modifier.size(13.dp),
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
                        horizontalArrangement = Arrangement.spacedBy(3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.ChatBubble,
                            contentDescription = "Comments",
                            modifier = Modifier.size(13.dp),
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

            if (!event.tags.isNullOrEmpty()) {
                TagChipsRow(tags = event.tags, prefix = "#")
            }
        }
    }
}

// ─── Event detail ─────────────────────────────────────────────────────────────

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
    val context = LocalContext.current
    var showAttendeeNames by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = eventDetailState.event?.title ?: "Event",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
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
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                // Author row
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    val authorId = event.user?.resolvedId ?: event.userId
                                    ForumUserAvatar(
                                        user = event.user,
                                        size = 44.dp,
                                        modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                                    )
                                    Column(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                                    ) {
                                        Text(
                                            text = forumUserDisplayName(event.user),
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = formatApplicationDate(event.eventAt),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    if (eventTimeLeft != null) {
                                        val isPast = eventTimeLeft == "Past"
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = if (isPast) MaterialTheme.colorScheme.surfaceVariant
                                                    else MaterialTheme.colorScheme.tertiaryContainer
                                        ) {
                                            Text(
                                                text = eventTimeLeft,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = if (isPast) MaterialTheme.colorScheme.onSurfaceVariant
                                                        else MaterialTheme.colorScheme.onTertiaryContainer,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                }

                                Text(
                                    text = event.description,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                // Meta chips: date, location, remote
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    AssistChip(
                                        onClick = {},
                                        label = { Text(formatApplicationDate(event.eventAt), style = MaterialTheme.typography.labelSmall) },
                                        leadingIcon = {
                                            Icon(Icons.Filled.CalendarToday, contentDescription = null, modifier = Modifier.size(14.dp))
                                        },
                                        colors = AssistChipDefaults.assistChipColors(
                                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                                            labelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                            leadingIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    )
                                    val locationStr = event.location?.takeIf { it.isNotBlank() }
                                    if (locationStr != null) {
                                        val query =
                                            if (event.latitude != null && event.longitude != null) "${event.latitude},${event.longitude}" else locationStr
                                        val url = "https://www.google.com/maps/search/?api=1&query=${Uri.encode(query)}"
                                        AssistChip(
                                            onClick = {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                                }
                                                try {
                                                    context.startActivity(intent)
                                                } catch (_: Exception) {
                                                    // no-op
                                                }
                                            },
                                            label = { Text(locationStr, style = MaterialTheme.typography.labelSmall) },
                                            leadingIcon = {
                                                Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp))
                                            }
                                        )
                                    }
                                    if (event.isRemote) {
                                        AssistChip(
                                            onClick = {},
                                            label = { Text("Remote", style = MaterialTheme.typography.labelSmall) },
                                            leadingIcon = {
                                                Icon(Icons.Filled.Wifi, contentDescription = null, modifier = Modifier.size(14.dp))
                                            },
                                            colors = AssistChipDefaults.assistChipColors(
                                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                                labelColor = MaterialTheme.colorScheme.onSecondaryContainer,
                                                leadingIconContentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                        )
                                    }
                                }

                                if (!event.tags.isNullOrEmpty()) {
                                    TagChipsRow(tags = event.tags, prefix = "#")
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
                                        Text("Leave event")
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
                        HorizontalDivider()
                        Spacer(Modifier.height(4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "Attendees ($attendeeCount)",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(Modifier.weight(1f))
                            TextButton(onClick = { showAttendeeNames = !showAttendeeNames }) {
                                Text(if (showAttendeeNames) "Show less" else "See all")
                            }
                        }
                    }

                    if (!showAttendeeNames) {
                        item {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                eventDetailState.attendees.forEach { attendee ->
                                    val id = attendee.resolvedId
                                    ForumUserAvatar(
                                        user = attendee,
                                        size = 42.dp,
                                        modifier = Modifier.clickable(enabled = id != null) { id?.let(onOpenUserProfile) }
                                    )
                                }
                            }
                        }
                    } else {
                        items(items = eventDetailState.attendees, key = { it.id ?: it.username ?: "" }) { attendee ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(MaterialTheme.shapes.small)
                                    .clickable(enabled = attendee.resolvedId != null) { attendee.resolvedId?.let { id -> onOpenUserProfile(id) } }
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                ForumUserAvatar(user = attendee, size = 36.dp)
                                Text(
                                    text = forumUserDisplayName(attendee),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    item {
                        HorizontalDivider()
                        Spacer(Modifier.height(4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Filled.ChatBubble, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "Comments (${eventDetailState.commentsTotal})",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    if (eventDetailState.commentsLoading && eventDetailState.comments.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(32.dp), color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    } else {
                        items(items = eventDetailState.comments, key = { it.id }) { comment ->
                            ForumCommentItem(comment = comment, onOpenUserProfile = onOpenUserProfile)
                        }
                    }

                    // Inline comment input (non-floating)
                    item {
                        Surface(
                            shadowElevation = 0.dp,
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 8.dp),
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = newCommentText,
                                    onValueChange = { viewModel.setNewCommentText(it) },
                                    modifier = Modifier.weight(1f),
                                    placeholder = { Text("Add a comment…") },
                                    maxLines = 3,
                                    shape = RoundedCornerShape(24.dp),
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
                                IconButton(
                                    onClick = { viewModel.submitCommentForEvent(event.id); focusManager.clearFocus() },
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary)
                                ) {
                                    Icon(Icons.Default.Send, contentDescription = "Send comment", tint = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Create event ─────────────────────────────────────────────────────────────

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
            TopAppBar(
                title = { Text("New Event") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
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
                leadingIcon = { Icon(Icons.Filled.CalendarToday, contentDescription = null) },
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
                leadingIcon = { Icon(Icons.Filled.LocationOn, contentDescription = null) },
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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Filled.Wifi, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Remote event", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                }
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
                    Button(onClick = { viewModel.createEvent() }) { Text("Create event") }
                }
            }
        }
    }
}

// ─── Discussion detail ────────────────────────────────────────────────────────

@Composable
private fun ForumDiscussionDetailContent(
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val detailState by viewModel.detailState.collectAsState()
    val newCommentText by viewModel.newCommentText.collectAsState()
    val focusManager = LocalFocusManager.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = detailState.discussion?.title ?: "Discussion",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        if (detailState.isLoading && detailState.discussion == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        } else if (detailState.error != null && detailState.discussion == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding).padding(16.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = detailState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                    TextButton(onClick = { detailState.discussion?.let { viewModel.loadDiscussion(it.id) } }) { Text("Retry") }
                }
            }
        } else {
            val discussion = detailState.discussion ?: return@Scaffold
            Column(modifier = modifier.fillMaxSize().padding(innerPadding)) {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                                Box(
                                    modifier = Modifier
                                        .width(4.dp)
                                        .fillMaxHeight()
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        val authorId = discussion.user?.resolvedId ?: discussion.userId
                                        ForumUserAvatar(
                                            user = discussion.user,
                                            size = 44.dp,
                                            modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                                        )
                                        Column(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                                        ) {
                                            Text(
                                            text = forumUserDisplayName(discussion.user),
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = formatApplicationDate(discussion.createdAt),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                    Text(
                                        text = discussion.body,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (!discussion.tags.isNullOrEmpty()) {
                                        TagChipsRow(tags = discussion.tags)
                                    }
                                }
                            }
                        }
                    }

                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Icon(Icons.Filled.ChatBubble, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "Comments (${detailState.commentsTotal})",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    if (detailState.commentsLoading && detailState.comments.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(32.dp), color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    } else {
                        items(items = detailState.comments, key = { it.id }) { comment ->
                            ForumCommentItem(comment = comment, onOpenUserProfile = onOpenUserProfile)
                        }
                    }

                    // Inline comment input (non-floating)
                    item {
                        Surface(
                            shadowElevation = 0.dp,
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 8.dp),
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = newCommentText,
                                    onValueChange = { viewModel.setNewCommentText(it) },
                                    modifier = Modifier.weight(1f),
                                    placeholder = { Text("Add a comment…") },
                                    maxLines = 3,
                                    shape = RoundedCornerShape(24.dp),
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
                                    },
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary)
                                ) {
                                    Icon(Icons.Default.Send, contentDescription = "Send comment", tint = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Comment item ─────────────────────────────────────────────────────────────

@Composable
private fun ForumCommentItem(
    comment: ForumCommentResponse,
    onOpenUserProfile: (String) -> Unit = {}
) {
    val author = forumUserDisplayName(comment.user)
    val authorId = comment.user?.resolvedId ?: comment.userId
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f))
            .padding(10.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        ForumUserAvatar(
            user = comment.user,
            size = 32.dp,
            modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = author,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSecondaryContainer
                )
                Text(
                    text = "·",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formatApplicationDate(comment.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = comment.content,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

// ─── Create discussion ────────────────────────────────────────────────────────

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
            TopAppBar(
                title = { Text("New Discussion") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
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
                Text(text = createState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onBack) { Text("Cancel") }
                if (createState.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.primary)
                } else {
                    Button(onClick = { viewModel.createDiscussion() }) { Text("Post") }
                }
            }
        }
    }
}

// ─── Communities list ─────────────────────────────────────────────────────────

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
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Search communities…") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
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
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
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
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
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

// ─── Community card ───────────────────────────────────────────────────────────

@Composable
fun CommunityCard(
    community: CommunityResponse,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    val context = LocalContext.current
    Card(
        modifier = modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        // Cover image banner
        if (!community.coverImageUrl.isNullOrBlank()) {
            var coverLoadFailed by remember { mutableStateOf(false) }
            if (!coverLoadFailed) {
                AsyncImage(
                    model = buildImageRequest(context, community.coverImageUrl),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    onError = { coverLoadFailed = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                )
            }
        }

        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                CommunityAvatar(name = community.name, avatarUrl = community.avatarUrl, size = 48.dp)

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = community.name,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f, fill = false)
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
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = "${community.memberCount}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Article, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = "${community.postCount}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            if (community.description.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = community.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (!community.founder?.fullName.isNullOrBlank() || !community.founder?.username.isNullOrBlank()) {
                Text(
                    text = "by ${community.founder?.fullName?.takeIf { it.isNotBlank() } ?: community.founder?.username ?: ""}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            if (!community.tags.isNullOrEmpty()) {
                Spacer(Modifier.height(6.dp))
                TagChipsRow(tags = community.tags)
            }
        }
    }
}

// ─── Community detail ─────────────────────────────────────────────────────────

@Composable
fun CommunityDetailScreen(
    communityId: String,
    viewModel: ForumViewModel,
    onBack: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val detailState by viewModel.communityDetailState.collectAsState()
    val createPostState by viewModel.createPostState.collectAsState()
    var showNewPost by remember { mutableStateOf(false) }
    var showAllMembers by remember { mutableStateOf(false) }
    var selectedPost by remember { mutableStateOf<CommunityPostResponse?>(null) }
    val context = LocalContext.current
    val postSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val community = detailState.community

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = community?.name ?: "Community",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        if (detailState.isLoading && community == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return@Scaffold
        }

        if (community == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                Text("Community not found.", color = MaterialTheme.colorScheme.error)
            }
            return@Scaffold
        }

        selectedPost?.let { post ->
            ModalBottomSheet(
                onDismissRequest = { selectedPost = null },
                sheetState = postSheetState
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Post",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        TextButton(onClick = { selectedPost = null }) { Text("Close") }
                    }
                    Text(
                        text = post.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (post.isPinned) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.tertiaryContainer
                        ) {
                            Text(
                                text = "Pinned",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onTertiaryContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                    if (post.user != null) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            val authorId = post.user.resolvedId
                            ForumUserAvatar(
                                user = post.user,
                                size = 40.dp,
                                modifier = Modifier.clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = forumUserDisplayName(post.user),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = formatApplicationDate(post.createdAt),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    if (post.body.isNotBlank()) {
                        Text(
                            text = post.body,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Filled.ThumbUp, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("${post.upvoteCount}", style = MaterialTheme.typography.labelMedium)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Filled.ChatBubble, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("${post.commentCount}", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }

        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(Color.White)
                .padding(innerPadding),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // ── Community header ──
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .border(
                            width = 2.dp,
                            color = MaterialTheme.colorScheme.primary,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(2.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(128.dp)
                            .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        if (!community.coverImageUrl.isNullOrBlank()) {
                            var coverLoadFailed by remember { mutableStateOf(false) }
                            if (!coverLoadFailed) {
                                AsyncImage(
                                    model = buildImageRequest(context, community.coverImageUrl),
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    onError = { coverLoadFailed = true },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }

                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CommunityAvatar(
                                name = community.name,
                                avatarUrl = community.avatarUrl,
                                size = 60.dp
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    community.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                        Text(
                                            text = "${community.memberCount} members",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Filled.Article, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                        Text(
                                            text = "${community.postCount} posts",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
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
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = community.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        if (!community.tags.isNullOrEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            TagChipsRow(tags = community.tags)
                        }

                        if (community.rules.isNotEmpty()) {
                            Spacer(Modifier.height(10.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Community Rules",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(Modifier.height(4.dp))
                            community.rules.forEachIndexed { i, rule ->
                                Text(
                                    text = "${i + 1}. $rule",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(bottom = 2.dp)
                                )
                            }
                        }

                        // Join / Leave / New Post buttons
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

            // ── Members section ──
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(2.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    Icons.Filled.People,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Members (${community.memberCount})",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            TextButton(onClick = { showAllMembers = !showAllMembers }) {
                                Text(if (showAllMembers) "Show less" else "See all")
                            }
                        }

                        if (detailState.membersLoading && detailState.members.isEmpty()) {
                            Box(modifier = Modifier.fillMaxWidth().height(56.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(28.dp), color = MaterialTheme.colorScheme.primary)
                            }
                        } else if (detailState.members.isEmpty()) {
                            Text(
                                text = "No members found.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else if (!showAllMembers) {
                            // Horizontal avatar strip — first 8
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                contentPadding = PaddingValues(horizontal = 2.dp)
                            ) {
                                items(
                                    items = detailState.members.take(8),
                                    key = { it.resolvedId ?: it.username ?: "" }
                                ) { member ->
                                    val memberId = member.resolvedId
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(4.dp),
                                        modifier = Modifier
                                            .width(56.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .clickable(enabled = memberId != null) { memberId?.let(onOpenUserProfile) }
                                            .padding(vertical = 4.dp)
                                    ) {
                                        ForumUserAvatar(user = member, size = 44.dp)
                                    }
                                }
                            }
                        } else {
                            // Expanded full member list
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                detailState.members.forEach { member ->
                                    val memberId = member.resolvedId
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .clickable(enabled = memberId != null) { memberId?.let(onOpenUserProfile) }
                                            .padding(vertical = 6.dp, horizontal = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        ForumUserAvatar(user = member, size = 40.dp)
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = forumUserDisplayName(member),
                                                style = MaterialTheme.typography.bodyMedium,
                                                fontWeight = FontWeight.Medium,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            if (!member.username.isNullOrBlank() && member.fullName?.isNotBlank() == true) {
                                                Text(
                                                    text = "@${member.username}",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
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
                            Text("New Post", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
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
                                    onClick = { viewModel.createCommunityPost(communityId) { showNewPost = false } },
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
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer
                    ) {
                        Box(modifier = Modifier.fillMaxWidth().padding(12.dp), contentAlignment = Alignment.Center) {
                            Text(
                                "Join this community to create posts.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }
            }

            // ── Posts ──
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
                        onClick = { selectedPost = post },
                        onUpvote = { viewModel.upvoteCommunityPost(communityId, post.id) },
                        onOpenUserProfile = onOpenUserProfile,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

// ─── Community post card ──────────────────────────────────────────────────────

@Composable
fun CommunityPostCard(
    post: CommunityPostResponse,
    onClick: () -> Unit = {},
    onUpvote: () -> Unit,
    onOpenUserProfile: (String) -> Unit = {},
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
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val authorId = post.user?.resolvedId ?: post.userId
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondaryContainer)
                        .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) },
                    contentAlignment = Alignment.Center
                ) {
                    val context = LocalContext.current
                    var imageLoadFailed by remember { mutableStateOf(false) }
                    val model = buildImageRequest(context, post.user?.profilePicture)
                    if (model != null && !imageLoadFailed) {
                        AsyncImage(
                            model = model,
                            contentDescription = post.user?.username ?: post.user?.fullName,
                            contentScale = ContentScale.Crop,
                            onError = { imageLoadFailed = true },
                            modifier = Modifier.fillMaxSize().clip(CircleShape)
                        )
                    } else {
                        val initials = post.user?.fullName?.firstOrNull()?.uppercase()
                            ?: post.user?.username?.firstOrNull()?.uppercase() ?: "?"
                        Text(initials, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSecondaryContainer)
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable(enabled = authorId != null) { authorId?.let(onOpenUserProfile) }
                ) {
                    Text(
                        text = forumUserDisplayName(post.user),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(timeAgo(post.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (post.isPinned) {
                    Surface(shape = RoundedCornerShape(4.dp), color = MaterialTheme.colorScheme.tertiaryContainer) {
                        Text("📌 Pinned", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onTertiaryContainer, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            Text(text = post.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)

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
                        tint = if (post.userUpvoted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${post.upvoteCount}",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (post.userUpvoted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Filled.ChatBubble, contentDescription = "Comments", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${post.commentCount}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
