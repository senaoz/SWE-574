package com.hive.hive_app.ui.main

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.graphics.Color
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.RecommendedServiceItemDto
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.api.dto.CommentResponse
import com.hive.hive_app.data.api.dto.CommentUserEmbed
import com.hive.hive_app.ui.theme.HiveTheme
import com.hive.hive_app.ui.theme.SurfaceVariantLight
import com.hive.hive_app.util.formatDurationHours
import com.hive.hive_app.util.formatApplicationDate
import com.hive.hive_app.util.formatLongOrdinalDate
import com.hive.hive_app.util.badgeIcon
import com.hive.hive_app.util.getHighestPriorityBadge
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

@Composable
fun ServiceDetailScreen(
    service: ServiceResponse?,
    creator: UserResponse?,
    acceptedUsers: List<UserResponse>,
    isLoading: Boolean,
    error: String?,
    onBack: () -> Unit = {},
    viewModel: ServiceDetailViewModel? = null,
    modifier: Modifier = Modifier,
    creatorBadges: BadgesResponse? = null,
    creatorRating: com.hive.hive_app.data.api.dto.RatingListResponse? = null,
    isSaved: Boolean = false,
    onStartChat: ((String) -> Unit)? = null,
    onOpenUserProfile: ((String) -> Unit)? = null,
    onOpenRecommendedService: ((String) -> Unit)? = null,
    /** Owner: open full-screen manage requests instead of a dialog. */
    onManageJoinRequests: (() -> Unit)? = null
) {
    var expandedImageUrl by remember { mutableStateOf<String?>(null) }

    when {
        isLoading -> {
            Column(
                modifier = modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        }
        error != null -> {
            Column(
                modifier = modifier.fillMaxSize().padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
        service != null -> {
            val isOwner by viewModel?.isOwner?.collectAsState(initial = false) ?: remember { mutableStateOf(false) }
            val joinRequests by viewModel?.joinRequests?.collectAsState(initial = emptyList()) ?: remember { mutableStateOf(emptyList<JoinRequestResponse>()) }
            val applyMessage by viewModel?.applyMessage?.collectAsState(initial = null) ?: remember { mutableStateOf<String?>(null) }
            val myJoinRequest by viewModel?.myJoinRequestForService?.collectAsState(initial = null) ?: remember { mutableStateOf<JoinRequestResponse?>(null) }
            val comments by viewModel?.comments?.collectAsState(initial = emptyList())
                ?: remember { mutableStateOf(emptyList<CommentResponse>()) }
            val commentsTotal by viewModel?.commentsTotal?.collectAsState(initial = 0)
                ?: remember { mutableStateOf(0) }
            val commentsLoading by viewModel?.commentsLoading?.collectAsState(initial = false)
                ?: remember { mutableStateOf(false) }
            val newCommentText by viewModel?.newCommentText?.collectAsState(initial = "")
                ?: remember { mutableStateOf("") }
            val recommendedServices by viewModel?.recommendedServices?.collectAsState(initial = emptyList())
                ?: remember { mutableStateOf(emptyList<RecommendedServiceItemDto>()) }
            val recommendedLoading by viewModel?.recommendedLoading?.collectAsState(initial = false)
                ?: remember { mutableStateOf(false) }
            val focusManager = LocalFocusManager.current
            var showApplyDialog by remember { mutableStateOf(false) }
            var applyError by remember { mutableStateOf<String?>(null) }
            var showBadgeInfo by remember { mutableStateOf(false) }
            if (showApplyDialog && viewModel != null) {
                var message by remember { mutableStateOf("") }
                AlertDialog(
                    onDismissRequest = {
                        showApplyDialog = false
                        applyError = null
                    },
                    title = { Text("Apply") },
                    text = {
                        Column {
                            Text("Add an optional message for the owner.")
                            OutlinedTextField(
                                value = message,
                                onValueChange = { message = it },
                                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                                placeholder = { Text("Message (optional)") },
                                minLines = 2,
                                shape = RoundedCornerShape(12.dp)
                            )
                            applyError?.let { err ->
                                Text(
                                    text = err,
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }
                    },
                    confirmButton = {
                        Button(onClick = {
                            applyError = null
                            viewModel.createJoinRequest(service._id, message.takeIf { it.isNotBlank() }) { success, errorMsg ->
                                if (success) {
                                    showApplyDialog = false
                                } else {
                                    applyError = errorMsg ?: "Application failed. Please try again."
                                }
                            }
                        }) { Text("Submit") }
                    },
                    dismissButton = {
                        TextButton(onClick = {
                            showApplyDialog = false
                            applyError = null
                        }) { Text("Cancel") }
                    }
                )
            }
            val scrollState = rememberScrollState()
            val showActionRow = viewModel != null &&
                service.status in listOf("active", "in_progress")
            Box(modifier = modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .verticalScroll(scrollState)
                ) {
                // Top bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                    Text(
                        text = service.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                }

                val imageUrls = service.imageUrls
                    ?.mapNotNull { toAbsoluteUrl(it) }
                    ?.take(3)
                    .orEmpty()
                if (imageUrls.isNotEmpty()) {
                    androidx.compose.foundation.lazy.LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(imageUrls) { url ->
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .size(width = 300.dp, height = 220.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { expandedImageUrl = url }
                            ) {
                                AsyncImage(
                                    model = url,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }
                }

                expandedImageUrl?.let { url ->
                    Dialog(onDismissRequest = { expandedImageUrl = null }) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(MaterialTheme.colorScheme.background.copy(alpha = 0.95f)),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = url,
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 400.dp)
                                    .clip(RoundedCornerShape(16.dp))
                            )
                        }
                    }
                }

                val context = LocalContext.current
                Column(modifier = Modifier.padding(16.dp)) {
                    // Type & status chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(percent = 50),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = service.serviceType.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                        StatusChip(status = service.status)
                        (service.category?.takeIf { it.isNotBlank() })?.let { cat ->
                            Surface(
                                shape = RoundedCornerShape(percent = 50),
                                color = HiveTheme.semanticColors.category.copy(alpha = 0.4f)
                            ) {
                                Text(
                                    text = cat,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Share, Save, Start Chat buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(onClick = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_SUBJECT, service.title)
                                putExtra(Intent.EXTRA_TEXT, "${service.title}\n\n${service.description}")
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share service"))
                        }) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.size(8.dp))
                            Text("Share")
                        }
                        if (viewModel != null) {
                            OutlinedButton(onClick = {
                                viewModel.toggleSave(service._id) { }
                            }) {
                                Icon(
                                    if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.size(8.dp))
                                Text(if (isSaved) "Saved" else "Save")
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Creator (photo, rating, badges, clickable)
                    DetailSection(title = "Creator", icon = Icons.Default.Person) {
                        val creatorId = creator?._id ?: service.userId
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .then(
                                    if (onOpenUserProfile != null) Modifier.clickable { onOpenUserProfile(creatorId) }
                                    else Modifier
                                ),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            if (creator?.profilePicture?.isNotBlank() == true) {
                                val context = LocalContext.current
                                AsyncImage(
                                    model = buildImageRequest(context, creator.profilePicture),
                                    contentDescription = "Profile photo",
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = (creator?.fullName?.takeIf { it.isNotBlank() } ?: creator?.username ?: "?")?.firstOrNull()?.uppercase() ?: "?",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = creator?.fullName?.takeIf { it.isNotBlank() }
                                        ?: creator?.username
                                        ?: "User #${service.userId.take(8)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                )
                                creatorRating?.averageScore?.let { avg ->
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                                        Text(
                                            text = "%.1f".format(avg),
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                            val topBadge = getHighestPriorityBadge(creatorBadges?.badges)
                            if (topBadge != null) {
                                IconButton(
                                    onClick = {
                                        showBadgeInfo = !showBadgeInfo
                                    },
                                    modifier = Modifier.padding(start = 8.dp)
                                ) {
                                    Icon(
                                        imageVector = badgeIcon(topBadge.key),
                                        contentDescription = topBadge.name ?: topBadge.key,
                                        modifier = Modifier.size(20.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                    val topBadge = getHighestPriorityBadge(creatorBadges?.badges)
                    if (showBadgeInfo && topBadge != null && !topBadge.key.isNullOrBlank()) {
                        BadgeInfoInlineBox(
                            key = topBadge.key!!,
                            name = topBadge.name,
                            description = topBadge.description,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }

                    // Description in a box
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = simpleMarkdownToAnnotatedString(service.description),
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(16.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Action row: Request to Join / Manage — between description and capacity
                    if (showActionRow) {
                        if (isOwner && onManageJoinRequests != null) {
                            Button(
                                onClick = onManageJoinRequests,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Manage service (${joinRequests.size})")
                            }
                        } else if (!isOwner) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (myJoinRequest != null) {
                                    StatusChip(status = myJoinRequest!!.status)
                                    if (myJoinRequest!!.status.equals("pending", ignoreCase = true)) {
                                        OutlinedButton(onClick = {
                                            viewModel?.cancelMyJoinRequest { _, _ -> }
                                        }) {
                                            Text("Cancel request")
                                        }
                                    }
                                    Spacer(modifier = Modifier.weight(1f))
                                    if (creator != null && onStartChat != null) {
                                        IconButton(onClick = {
                                            viewModel?.startChat(service._id, creator._id) { result ->
                                                result.getOrNull()?.let { roomId -> onStartChat(roomId) }
                                            }
                                        }) {
                                            Icon(
                                                Icons.Default.Chat,
                                                contentDescription = "Start chat",
                                                tint = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                } else {
                                    val buttonLabel =
                                        if (service.serviceType == "need") "Offer Help" else "Request Service"
                                    Button(
                                        onClick = { showApplyDialog = true },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(buttonLabel)
                                    }
                                    if (creator != null && onStartChat != null) {
                                        IconButton(onClick = {
                                            viewModel?.startChat(service._id, creator._id) { result ->
                                                result.getOrNull()?.let { roomId -> onStartChat(roomId) }
                                            }
                                        }) {
                                            Icon(
                                                Icons.Default.Chat,
                                                contentDescription = "Start chat",
                                                tint = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(20.dp))
                    }

                    // Capacity & accepted
                    DetailSection(title = "Capacity") {
                        val max = service.maxParticipants ?: 1
                        val acceptedCount = service.matchedUserIds?.size ?: 0
                        val remaining = max - acceptedCount
                        val isFull = max > 0 && remaining <= 0
                        val isNearlyFull = !isFull && max >= 3 && remaining <= (if (max == 3) 1 else 2)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "$acceptedCount / $max participants",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            if (isFull) {
                                androidx.compose.material3.Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = MaterialTheme.colorScheme.errorContainer
                                ) {
                                    Text(
                                        text = "Capacity full",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            } else if (isNearlyFull) {
                                androidx.compose.material3.Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = Color(0xFFFFECB3)
                                ) {
                                    Text(
                                        text = if (remaining == 1) "Only 1 spot left!" else "Only $remaining spots left!",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFF7B5800),
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Accepted users (if any)
                    if (acceptedUsers.isNotEmpty()) {
                        DetailSection(title = "Accepted users", icon = Icons.Default.Person) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                acceptedUsers.forEach { user ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .then(
                                                if (onOpenUserProfile != null) Modifier.clickable { onOpenUserProfile(user._id) }
                                                else Modifier
                                            ),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        val displayName = user.fullName?.takeIf { it.isNotBlank() } ?: user.username
                                        val initials = displayName.takeIf { it.isNotBlank() }?.take(2)?.uppercase() ?: "?"
                                        if (user.profilePicture?.isNotBlank() == true) {
                                            AsyncImage(
                                                model = buildImageRequest(context, user.profilePicture),
                                                contentDescription = "Profile photo",
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .clip(CircleShape)
                                            )
                                        } else {
                                            Box(
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .clip(CircleShape)
                                                    .background(MaterialTheme.colorScheme.primaryContainer),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = initials,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                                )
                                            }
                                        }
                                        Text(
                                            text = displayName,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (onOpenUserProfile != null) {
                                            Icon(Icons.Default.Person, contentDescription = "View profile", modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Tags
                    if (service.tags.isNotEmpty()) {
                        DetailSection(title = "Tags", icon = Icons.Default.Tag) {
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                service.tags.forEach { tag ->
                                    Surface(
                                        shape = RoundedCornerShape(percent = 50),
                                        color = HiveTheme.semanticColors.tag.copy(alpha = 0.4f)
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

                    // Scheduling & time
                    DetailSection(title = "Scheduling & time", icon = Icons.Default.Schedule) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            service.schedulingType?.let { type ->
                                LabelValue("Type", type.replaceFirstChar { it.uppercase() })
                            }
                            service.specificDate?.let { raw ->
                                val formatted = formatLongOrdinalDate(raw).ifBlank { raw }
                                LabelValue("Date", formatted)
                            }
                            service.specificTime?.let { LabelValue("Time", it) }
                            service.recurringPattern?.let { rp ->
                                if (rp.days.isNotEmpty()) {
                                    LabelValue("Recurring days", rp.days.joinToString(", "))
                                }
                                if (rp.time.isNotBlank()) {
                                    LabelValue("Time", rp.time)
                                }
                            }
                            service.openAvailability?.let { LabelValue("Availability", it) }
                            service.deadline?.let { raw ->
                                val formatted = formatLongOrdinalDate(raw).ifBlank { raw }
                                LabelValue("Deadline", formatted)
                            }
                            LabelValue("Duration", formatDurationHours(service.estimatedDuration))
                            if (service.schedulingType == null && service.specificDate == null &&
                                service.specificTime == null && service.recurringPattern == null &&
                                service.openAvailability == null && service.deadline == null
                            ) {
                                Text(
                                    text = "No specific schedule set",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Service Status Bar
                    ServiceStatusBar(status = service.status ?: "active")

                    // Comments
                    if (viewModel != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        DetailSection(
                            title = "Comments (${commentsTotal})",
                            icon = Icons.Default.Chat
                        ) {
                            if (commentsLoading && comments.isEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            } else if (comments.isEmpty()) {
                                Text(
                                    text = "No comments yet. Be the first to comment!",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    comments.forEach { comment ->
                                        ServiceCommentItem(
                                            comment = comment,
                                            ownerId = service.userId,
                                            onOpenUserProfile = onOpenUserProfile
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth(),
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
                                            viewModel.submitComment(service._id)
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
                                        viewModel.submitComment(service._id)
                                        focusManager.clearFocus()
                                    }
                                ) {
                                    Icon(
                                        Icons.Filled.Send,
                                        contentDescription = "Send comment"
                                    )
                                }
                            }
                        }
                    }

                    // Apply feedback (after request submit); primary actions are in the floating bar below
                    if (viewModel != null && !isOwner && service.status in listOf("active", "in_progress")) {
                        applyMessage?.let { msg ->
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = msg,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }

                    // Meta (created / updated)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Created ${formatLongOrdinalDate(service.createdAt).ifBlank { service.createdAt.take(10) }}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    // Location at bottom with map (or "Remote" if service is remote)
                    Spacer(modifier = Modifier.height(16.dp))
                    DetailSection(title = "Location", icon = Icons.Default.LocationOn) {
                        if (service.isRemote) {
                            Text(
                                text = "Remote",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        } else {
                            val loc = service.location
                            val locationLabel = loc.address?.takeIf { it.isNotBlank() }
                                ?: "Approximate: %.4f, %.4f".format(loc.latitude, loc.longitude)
                            Text(
                                text = locationLabel,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier
                                    .padding(bottom = 12.dp)
                                    .clickable {
                                        val query =
                                            loc.address?.takeIf { it.isNotBlank() }
                                                ?: "${loc.latitude},${loc.longitude}"
                                        val url =
                                            "https://www.google.com/maps/search/?api=1&query=${Uri.encode(query)}"
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        }
                                        try {
                                            context.startActivity(intent)
                                        } catch (_: Exception) {
                                            // no-op: if no handler exists, ignore click
                                        }
                                    }
                            )
                            ServiceDetailMap(
                                latitude = loc.latitude,
                                longitude = loc.longitude,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(200.dp)
                                    .clip(RoundedCornerShape(8.dp))
                            )
                        }
                    }
                    if (recommendedLoading || recommendedServices.isNotEmpty()) {
                        DetailSection(title = "Services like this", icon = Icons.Default.TrendingUp) {
                            if (recommendedLoading && recommendedServices.isEmpty()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(22.dp),
                                        color = MaterialTheme.colorScheme.primary,
                                        strokeWidth = 2.dp
                                    )
                                }
                            } else {
                                LazyRow(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    items(
                                        items = recommendedServices.take(3),
                                        key = { it.service._id }
                                    ) { item ->
                                        RecommendedServiceCompactCard(
                                            item = item,
                                            onClick = {
                                                onOpenRecommendedService?.invoke(item.service._id)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                    // Clearance so the floating + FAB never overlaps the map
                    Spacer(modifier = Modifier.height(96.dp))
                }
                }
            }
        }
    }
}

@Composable
private fun RecommendedServiceCompactCard(
    item: RecommendedServiceItemDto,
    onClick: () -> Unit
) {
    val context = LocalContext.current
    val imageModel = buildImageRequest(context, item.service.imageUrls?.firstOrNull())
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.size(width = 220.dp, height = 170.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (imageModel != null) {
                AsyncImage(
                    model = imageModel,
                    contentDescription = item.service.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(82.dp)
                        .clip(RoundedCornerShape(8.dp))
                )
            }
            Text(
                text = item.service.title,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
            Text(
                text = item.reason,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun BadgeInfoInlineBox(
    key: String,
    name: String?,
    description: String?,
    modifier: Modifier = Modifier
) {
    val title = name ?: key
    val desc = description?.takeIf { it.isNotBlank() } ?: "No description available."
    val lime = Color(0xFFC6E600)
    Card(
        modifier = modifier
            .border(1.5.dp, lime, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = badgeIcon(key),
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Badge: $title",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ServiceCommentItem(
    comment: CommentResponse,
    ownerId: String,
    onOpenUserProfile: ((String) -> Unit)? = null
) {
    val author = comment.user?.username ?: comment.user?.fullName ?: "Unknown"
    val authorId = comment.user?.resolvedId ?: comment.userId
    val isOwnerComment = authorId == ownerId
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (onOpenUserProfile != null) Modifier.clickable { onOpenUserProfile(authorId) }
                else Modifier
            ),
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
            val profilePicture = comment.user?.profilePicture
            if (!profilePicture.isNullOrBlank()) {
                AsyncImage(
                    model = buildImageRequest(context, profilePicture),
                    contentDescription = "Profile photo",
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = serviceCommentInitials(comment.user),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                if (isOwnerComment) {
                    Surface(
                        shape = RoundedCornerShape(percent = 50),
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Text(
                            text = "Owner",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
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

private fun serviceCommentInitials(user: CommentUserEmbed?): String {
    val name = user?.fullName?.takeIf { it.isNotBlank() } ?: user?.username ?: "?"
    return name.take(2).uppercase()
}

@Composable
private fun ServiceDetailMap(
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
                            0,
                            18,
                            256,
                            ".png",
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
            update = { map ->
                mapView = map
            }
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

@Composable
private fun StatusChip(status: String) {
    val (bg, onBg) = when (status.lowercase()) {
        "active" -> HiveTheme.semanticColors.active to MaterialTheme.colorScheme.onSurface
        "in progress", "in_progress" -> HiveTheme.semanticColors.inProgress to MaterialTheme.colorScheme.onSurface
        "completed" -> HiveTheme.semanticColors.completed to MaterialTheme.colorScheme.onSurface
        "cancelled" -> HiveTheme.semanticColors.cancelled to MaterialTheme.colorScheme.onSurface
        "expired" -> HiveTheme.semanticColors.expired to MaterialTheme.colorScheme.onSurface
        "pending" -> HiveTheme.semanticColors.pending to MaterialTheme.colorScheme.onSurface
        else -> HiveTheme.semanticColors.active to MaterialTheme.colorScheme.onSurface
    }
    val displayStatus = status.replace("_", " ").split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { it.uppercase() }
    }
    Surface(
        shape = RoundedCornerShape(percent = 50),
        color = bg.copy(alpha = 0.5f)
    ) {
        Text(
            text = displayStatus,
            style = MaterialTheme.typography.labelMedium,
            color = onBg,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

fun simpleMarkdownToAnnotatedString(text: String): androidx.compose.ui.text.AnnotatedString {
    return buildAnnotatedString {
        val lines = text.split('\n')
        lines.forEachIndexed { index, rawLine ->
            var line = rawLine
            var isHeading = false
            if (line.trimStart().startsWith("#")) {
                val trimmed = line.trimStart()
                val hashes = trimmed.takeWhile { it == '#' }
                if (hashes.isNotEmpty()) {
                    isHeading = true
                    line = trimmed.removePrefix(hashes).trimStart()
                }
            }

            if (isHeading) {
                pushStyle(SpanStyle(fontWeight = FontWeight.Bold))
            }

            var i = 0
            while (i < line.length) {
                if (i + 3 < line.length && line[i] == '*' && line[i + 1] == '*') {
                    val end = line.indexOf("**", startIndex = i + 2)
                    if (end != -1) {
                        val content = line.substring(i + 2, end)
                        pushStyle(SpanStyle(fontWeight = FontWeight.Bold))
                        append(content)
                        pop()
                        i = end + 2
                        continue
                    }
                }
                if (line[i] == '*' && (i == 0 || line[i - 1] != '*')) {
                    val end = line.indexOf('*', startIndex = i + 1)
                    if (end != -1) {
                        val content = line.substring(i + 1, end)
                        pushStyle(SpanStyle(fontStyle = FontStyle.Italic))
                        append(content)
                        pop()
                        i = end + 1
                        continue
                    }
                }
                append(line[i])
                i++
            }

            if (isHeading) {
                pop()
            }

            if (index != lines.lastIndex) {
                append('\n')
            }
        }
    }
}

@Composable
private fun DetailSection(
    title: String,
    icon: ImageVector? = null,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (icon != null) {
                    Icon(
                        icon,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            content()
        }
    }
}

@Composable
private fun LabelValue(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun ServiceStatusBar(status: String) {
    data class Step(val key: String, val label: String)
    val steps = listOf(
        Step("active", "Active"),
        Step("in_progress", "In Progress"),
        Step("completed", "Completed")
    )

    val currentIndex = when (status.lowercase()) {
        "active" -> 0
        "in_progress", "in progress" -> 1
        "completed" -> 2
        "cancelled" -> 1
        "expired" -> 1
        else -> 0
    }

    val isCancelled = status.lowercase() == "cancelled"
    val isExpired = status.lowercase() == "expired"

    val activeColor = HiveTheme.semanticColors.active
    val cancelledColor = HiveTheme.semanticColors.cancelled
    val expiredColor = HiveTheme.semanticColors.expired

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "SERVICE STATUS",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                steps.forEachIndexed { index, step ->
                    val isCompleted = (index < currentIndex || (status.lowercase() == "completed" && index == currentIndex)) && !isCancelled && !isExpired
                    val isCurrent = index == currentIndex && status.lowercase() != "completed"

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        // Circle icon
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(32.dp)
                                .then(
                                    if (isCompleted) Modifier.background(activeColor, CircleShape)
                                    else if (isCurrent && isCancelled) Modifier.background(cancelledColor, CircleShape)
                                    else if (isCurrent && isExpired) Modifier.background(expiredColor, CircleShape)
                                    else if (isCurrent) Modifier.border(2.dp, activeColor, CircleShape)
                                    else Modifier.border(2.dp, MaterialTheme.colorScheme.outlineVariant, CircleShape)
                                )
                        ) {
                            when {
                                isCompleted -> Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                isCurrent && isCancelled -> Text(
                                    text = "✕",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                                isCurrent && isExpired -> Text(
                                    text = "!",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                                else -> Text(
                                    text = "${index + 1}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (isCurrent) activeColor else MaterialTheme.colorScheme.outlineVariant,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        // Label
                        val labelText = when {
                            index == 1 && isCancelled -> "Cancelled"
                            index == 1 && isExpired -> "Expired"
                            else -> step.label
                        }
                        val labelColor = when {
                            isCurrent && isCancelled -> cancelledColor
                            isCurrent && isExpired -> expiredColor
                            isCurrent || isCompleted -> activeColor
                            else -> MaterialTheme.colorScheme.outlineVariant
                        }
                        Text(
                            text = labelText,
                            style = MaterialTheme.typography.labelSmall,
                            color = labelColor,
                            fontWeight = if (isCurrent || isCompleted) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }

                    // Connector line between steps
                    if (index < steps.size - 1) {
                        val lineColor = when {
                            index < currentIndex && isCancelled -> cancelledColor
                            index < currentIndex && isExpired -> expiredColor
                            index < currentIndex -> activeColor
                            else -> MaterialTheme.colorScheme.outlineVariant
                        }
                        Box(
                            modifier = Modifier
                                .weight(0.5f)
                                .height(2.dp)
                                .padding(top = 15.dp)
                                .background(lineColor)
                        )
                    }
                }
            }
        }
    }
}