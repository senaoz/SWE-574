package com.hive.hive_app.ui.main

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.api.dto.CommentResponse
import com.hive.hive_app.data.api.dto.CommentUserEmbed
import com.hive.hive_app.ui.theme.HiveTheme
import com.hive.hive_app.ui.theme.SurfaceVariantLight
import com.hive.hive_app.util.formatDurationHours
import com.hive.hive_app.util.formatApplicationDate
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
    onOpenUserProfile: ((String) -> Unit)? = null
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
            val focusManager = LocalFocusManager.current
            var showApplyDialog by remember { mutableStateOf(false) }
            var showManageRequests by remember { mutableStateOf(false) }
            if (showApplyDialog && viewModel != null) {
                var message by remember { mutableStateOf("") }
                AlertDialog(
                    onDismissRequest = { showApplyDialog = false },
                    title = { Text("Apply") },
                    text = {
                        Column {
                            Text("Add an optional message for the owner.")
                            OutlinedTextField(
                                value = message,
                                onValueChange = { message = it },
                                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                                placeholder = { Text("Message (optional)") },
                                minLines = 2
                            )
                        }
                    },
                    confirmButton = {
                        Button(onClick = {
                            viewModel.createJoinRequest(service._id, message.takeIf { it.isNotBlank() }) { _, _ ->
                                showApplyDialog = false
                            }
                        }) { Text("Submit") }
                    },
                    dismissButton = { TextButton(onClick = { showApplyDialog = false }) { Text("Cancel") } }
                )
            }
            if (showManageRequests && viewModel != null) {
                ManageRequestsSheet(
                    requests = joinRequests,
                    onDismiss = { showManageRequests = false },
                    onApprove = { req, adminMsg ->
                        viewModel.updateRequestStatus(req._id, "approved", adminMsg) { showManageRequests = false }
                    },
                    onReject = { req, adminMsg ->
                        viewModel.updateRequestStatus(req._id, "rejected", adminMsg) { showManageRequests = false }
                    }
                )
            }
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
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
                            AsyncImage(
                                model = url,
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { expandedImageUrl = url }
                            )
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
                                    color = MaterialTheme.colorScheme.onSurface
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
                            Spacer(modifier = Modifier.weight(1f))
                            if (!creatorBadges?.badges.isNullOrEmpty()) {
                                Row(
                                    modifier = Modifier.padding(start = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    creatorBadges?.badges?.filter { it.earned }?.take(5)?.forEach { badge ->
                                        Icon(
                                            imageVector = creatorBadgeIcon(badge.key),
                                            contentDescription = badge.name ?: badge.key,
                                            modifier = Modifier.size(20.dp),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
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

                    // Capacity & accepted
                    DetailSection(title = "Capacity") {
                        val max = service.maxParticipants ?: 1
                        val acceptedCount = service.matchedUserIds?.size ?: 0
                        Text(
                            text = "$acceptedCount / $max participants",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
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
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = user.fullName?.takeIf { it.isNotBlank() } ?: user.username,
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
                                            text = tag.label ?: tag.name ?: tag.id ?: "",
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
                            service.specificDate?.let { LabelValue("Date", it) }
                            service.specificTime?.let { LabelValue("Time", it) }
                            service.openAvailability?.let { LabelValue("Availability", it) }
                            service.deadline?.let { LabelValue("Deadline", it) }
                            LabelValue("Duration", formatDurationHours(service.estimatedDuration))
                            if (service.schedulingType == null && service.specificDate == null &&
                                service.specificTime == null && service.openAvailability == null &&
                                service.deadline == null
                            ) {
                                Text(
                                    text = "No specific schedule set",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

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
                                        ServiceCommentItem(comment = comment)
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

                    // Apply / Manage requests (FR-5)
                    if (viewModel != null && service.status in listOf("active", "in_progress")) {
                        Spacer(modifier = Modifier.height(12.dp))
                        if (!isOwner) {
                            if (myJoinRequest != null) {
                                StatusChip(status = myJoinRequest!!.status)
                            } else {
                                val buttonLabel = if (service.serviceType == "need") "Offer Help" else "Request Service"
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(onClick = { showApplyDialog = true }) { Text(buttonLabel) }
                                    if (creator != null && onStartChat != null) {
                                        OutlinedButton(onClick = {
                                            viewModel.startChat(service._id, creator._id) { result ->
                                                result.getOrNull()?.let { roomId -> onStartChat(roomId) }
                                            }
                                        }) {
                                            Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.size(8.dp))
                                            Text("Start Chat")
                                        }
                                    }
                                }
                                applyMessage?.let { msg ->
                                    Text(
                                        text = msg,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }
                            }
                        } else {
                            Button(onClick = { showManageRequests = true }) {
                                Text("Manage join requests (${joinRequests.size})")
                            }
                        }
                    }

                    // Meta (created / updated)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Created ${service.createdAt}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    // Location at bottom with map
                    Spacer(modifier = Modifier.height(16.dp))
                    DetailSection(title = "Location", icon = Icons.Default.LocationOn) {
                        val loc = service.location
                        Text(
                            text = loc.address?.takeIf { it.isNotBlank() }
                                ?: "Approximate: %.4f, %.4f".format(loc.latitude, loc.longitude),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 12.dp)
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
            }
        }
    }
}

@Composable
private fun ServiceCommentItem(comment: CommentResponse) {
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
                    text = serviceCommentInitials(comment.user),
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

private fun creatorBadgeIcon(key: String?): ImageVector = when (key) {
    "newcomer" -> Icons.Default.Person
    "profile_complete" -> Icons.Default.Person
    "tagged", "well_tagged" -> Icons.Default.Label
    "rated" -> Icons.Default.Star
    "popular" -> Icons.Default.TrendingUp
    "community_favorite" -> Icons.Default.Favorite
    "helper", "helper_hero", "master_helper" -> Icons.Default.School
    "generous_giver" -> Icons.Default.Schedule
    else -> Icons.Default.Star
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
private fun ManageRequestsSheet(
    requests: List<JoinRequestResponse>,
    onDismiss: () -> Unit,
    onApprove: (JoinRequestResponse, String?) -> Unit,
    onReject: (JoinRequestResponse, String?) -> Unit
) {
    var pendingAction by remember { mutableStateOf<Pair<JoinRequestResponse, String>?>(null) }
    if (pendingAction != null) {
        val (req, action) = pendingAction!!
        var adminMsg by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { pendingAction = null },
            title = { Text(if (action == "approved") "Approve request" else "Reject request") },
            text = {
                OutlinedTextField(
                    value = adminMsg,
                    onValueChange = { adminMsg = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Message to applicant (optional)") },
                    minLines = 2
                )
            },
            confirmButton = {
                Button(onClick = {
                    if (action == "approved") onApprove(req, adminMsg.takeIf { it.isNotBlank() })
                    else onReject(req, adminMsg.takeIf { it.isNotBlank() })
                    pendingAction = null
                }) { Text("Confirm") }
            },
            dismissButton = { TextButton(onClick = { pendingAction = null }) { Text("Cancel") } }
        )
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Join requests") },
        text = {
            if (requests.isEmpty()) {
                Text("No join requests yet.")
            } else {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(requests, key = { it._id }) { req ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Request ${req._id.take(8)}… • ${req.status}", style = MaterialTheme.typography.titleSmall)
                                req.message?.takeIf { it.isNotBlank() }?.let {
                                    Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                                }
                                if (req.status == "pending") {
                                    Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(onClick = { pendingAction = req to "approved" }) { Text("Approve") }
                                        OutlinedButton(onClick = { pendingAction = req to "rejected" }) { Text("Reject") }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = { Button(onClick = onDismiss) { Text("Close") } }
    )
}
