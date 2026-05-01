package com.hive.hive_app.ui.main

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.platform.LocalContext
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.ChatParticipant
import com.hive.hive_app.data.api.dto.MessageResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.text.SimpleDateFormat
import java.util.Locale

private const val CHAT_POLL_INTERVAL_MS = 3000L

@Composable
fun ChatRoomScreen(
    room: ChatRoomResponse,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    onOpenUserProfile: (String) -> Unit = {},
    onOpenServiceDetail: (String) -> Unit = {},
    viewModel: ChatRoomViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showParticipantsSheet by remember { mutableStateOf(false) }
    // Allow sending in all chats (including transaction); backend enforces rules if needed
    val canSend = true

    LaunchedEffect(room._id) { viewModel.loadMessages(room._id, room) }
    LaunchedEffect(room._id) {
        while (true) {
            delay(CHAT_POLL_INTERVAL_MS)
            viewModel.refreshMessages(room._id)
        }
    }

    val otherId = room.participantIds.firstOrNull { it != state.currentUserId }
    val otherParticipant = room.participants?.firstOrNull { it.userId == otherId }
        ?: room.participants?.firstOrNull { it.userId != state.currentUserId }
        ?: room.participants?.firstOrNull()
    val otherName = state.otherUser?.fullName?.takeIf { it.isNotBlank() }
        ?: state.otherUser?.username
        ?: otherParticipant?.fullName?.takeIf { it.isNotBlank() }
        ?: otherParticipant?.username
        ?: "Chat"
    val otherInitials = otherName.take(2).uppercase()
    val context = LocalContext.current
    val isGroupChat = room.participantIds.size > 2
    val groupParticipants = room.participants
        ?.filter { it._id != state.currentUserId }
        ?.take(3)
        .orEmpty()

    Column(
        modifier = modifier
            .fillMaxSize()
            .imePadding()
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                if (isGroupChat) {
                    GroupHeaderAvatars(participants = groupParticipants, modifier = Modifier.size(42.dp))
                } else {
                    val profilePicUrl = state.otherUser?.profilePicture?.takeIf { it.isNotBlank() }
                        ?: otherParticipant?.profilePicture?.takeIf { it.isNotBlank() }
                    if (!profilePicUrl.isNullOrBlank()) {
                        coil.compose.AsyncImage(
                            model = buildImageRequest(context, profilePicUrl),
                            contentDescription = null,
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = otherInitials,
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 10.dp)
                        .clickable {
                            val resolvedProfileId = state.otherUser?._id ?: otherParticipant?.userId
                            if (!isGroupChat && !resolvedProfileId.isNullOrBlank()) {
                                onOpenUserProfile(resolvedProfileId)
                            } else if (isGroupChat) {
                                showParticipantsSheet = true
                            }
                        }
                ) {
                    Text(
                        text = room.name ?: otherName,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = if (room.participantIds.size > 2) {
                            "${room.participantIds.size} participants"
                        } else {
                            otherName
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (!canSend) {
                    Text(
                        text = "Exchange completed",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        if (showParticipantsSheet && isGroupChat) {
            ParticipantsBottomSheet(
                participants = room.participants.orEmpty(),
                onDismiss = { showParticipantsSheet = false },
                onParticipantClick = { participantId ->
                    showParticipantsSheet = false
                    onOpenUserProfile(participantId)
                }
            )
        }

        TransactionServiceCard(
            transactionId = room.transactionId ?: room.transaction?._id,
            transactionServiceId = state.transaction?.serviceId,
            service = state.transactionService,
            onOpenServiceDetail = onOpenServiceDetail
        )

        if (state.isLoading && state.messages.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Column
        }

        state.error?.let { error ->
            Box(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
            return@Column
        }

        val canConfirm = viewModel.canConfirmCompletion()
        val exchangeCompleted = viewModel.isExchangeCompleted(room)
        val showRate = exchangeCompleted && !state.alreadyRatedTransaction && viewModel.otherUserIdForRating() != null

        if (canConfirm || showRate) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    if (canConfirm) {
                        Text(
                            text = "Confirm that this exchange is complete. Both you and the other party need to confirm.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Button(
                            onClick = {
                                viewModel.confirmCompletion(room) { ok, msg ->
                                    if (!ok) { /* TODO: show snackbar */ }
                                }
                            },
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            Text("Confirm completion")
                        }
                    }
                    if (showRate && !canConfirm) {
                        Text(
                            text = "You can rate $otherName once both you and the other party have confirmed this exchange.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        RateSection(
                            onSubmit = { score, comment ->
                                viewModel.submitRating(room, score, comment) { ok, _ ->
                                    if (!ok) { /* TODO: show snackbar */ }
                                }
                            }
                        )
                    }
                }
            }
        }

        val listState = rememberLazyListState()
        LaunchedEffect(state.messages.size) {
            if (state.messages.isNotEmpty()) {
                listState.animateScrollToItem(state.messages.lastIndex)
            }
        }
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            state = listState,
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            itemsIndexed(state.messages, key = { _, message -> message._id }) { index, msg ->
                val previousMessage = state.messages.getOrNull(index - 1)
                val currentDate = messageDate(msg.createdAt)
                val previousDate = messageDate(previousMessage?.createdAt)
                val showDaySeparator = currentDate != null && currentDate != previousDate
                if (showDaySeparator) {
                    DaySeparator(date = currentDate!!)
                }
                MessageBubble(
                    message = msg,
                    isFromCurrentUser = msg.senderId == state.currentUserId
                )
            }
        }

        if (canSend) {
            MessageInput(
                onSend = { text ->
                    viewModel.sendMessage(
                        roomId = room._id,
                        content = text,
                        onSent = { },
                        onError = { }
                    )
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ParticipantsBottomSheet(
    participants: List<ChatParticipant>,
    onDismiss: () -> Unit,
    onParticipantClick: (String) -> Unit
) {
    val context = LocalContext.current
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Participants",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "${participants.size} members",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 10.dp)
            )
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(participants, key = { it._id ?: it.username ?: it.hashCode().toString() }) { participant ->
                    val participantId = participant.userId
                    val name = participant.fullName?.takeIf { it.isNotBlank() } ?: participant.username ?: "Unknown user"
                    val profilePic = participant.profilePicture?.takeIf { it.isNotBlank() }
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !participantId.isNullOrBlank()) {
                                if (!participantId.isNullOrBlank()) {
                                    onParticipantClick(participantId)
                                }
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            if (!profilePic.isNullOrBlank()) {
                                coil.compose.AsyncImage(
                                    model = buildImageRequest(context, profilePic),
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = name.take(2).uppercase(),
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                participant.username?.let { username ->
                                    Text(
                                        text = "@$username",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Icon(
                                imageVector = Icons.Filled.Person,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionServiceCard(
    transactionId: String?,
    transactionServiceId: String?,
    service: ServiceResponse?,
    onOpenServiceDetail: (String) -> Unit
) {
    if (transactionId.isNullOrBlank()) return
    val serviceId = service?._id ?: transactionServiceId
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .clickable(enabled = !serviceId.isNullOrBlank()) {
                if (!serviceId.isNullOrBlank()) {
                    onOpenServiceDetail(serviceId)
                }
            },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f)
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = "Service details",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (service != null) {
                Text(
                    text = service.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 6.dp)
                )
                Text(
                    text = service.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp)
                )
                Text(
                    text = "${service.category ?: "General"} • ${service.estimatedDuration}h",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Text(
                    text = "Tap to view service",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 6.dp)
                )
            } else {
                Text(
                    text = "Loading service information...",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }
        }
    }
}

@Composable
private fun MessageBubble(
    message: MessageResponse,
    isFromCurrentUser: Boolean
) {
    val backgroundColor = if (isFromCurrentUser)
        MaterialTheme.colorScheme.primaryContainer
    else
        MaterialTheme.colorScheme.surfaceVariant
    val color = if (isFromCurrentUser)
        MaterialTheme.colorScheme.onPrimaryContainer
    else
        MaterialTheme.colorScheme.onSurfaceVariant
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isFromCurrentUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Bottom
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(0.82f),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isFromCurrentUser) 16.dp else 4.dp,
                bottomEnd = if (isFromCurrentUser) 4.dp else 16.dp
            ),
            colors = CardDefaults.cardColors(containerColor = backgroundColor)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                if (!isFromCurrentUser && message.sender?.username != null) {
                    Text(
                        text = message.sender.username,
                        style = MaterialTheme.typography.labelSmall,
                        color = color.copy(alpha = 0.8f)
                    )
                } else if (isFromCurrentUser) {
                    Text(
                        text = "You",
                        style = MaterialTheme.typography.labelSmall,
                        color = color.copy(alpha = 0.8f)
                    )
                }
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = color
                )
                Text(
                    text = formatMessageTime(message.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = color.copy(alpha = 0.7f),
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}

@Composable
private fun DaySeparator(date: LocalDate) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)
            )
        ) {
            Text(
                text = date.format(DateTimeFormatter.ofPattern("EEE, MMM d", Locale.US)),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
private fun GroupHeaderAvatars(
    participants: List<ChatParticipant>,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    Box(modifier = modifier) {
        participants.take(3).forEachIndexed { index, participant ->
            val offsetX = (index * 12).dp
            val pic = participant.profilePicture?.takeIf { it.isNotBlank() }
            if (!pic.isNullOrBlank()) {
                coil.compose.AsyncImage(
                    model = buildImageRequest(context, pic),
                    contentDescription = null,
                    modifier = Modifier
                        .padding(start = offsetX)
                        .size(24.dp)
                        .clip(CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .padding(start = offsetX)
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    val name = participant.fullName?.takeIf { it.isNotBlank() } ?: participant.username ?: "?"
                    Text(
                        text = name.take(1).uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

private fun messageDate(isoDate: String?): LocalDate? {
    if (isoDate.isNullOrBlank()) return null
    return runCatching {
        val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(isoDate.take(19))
        if (parsed != null) {
            val cal = java.util.Calendar.getInstance().apply { time = parsed }
            LocalDate.of(cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH) + 1, cal.get(java.util.Calendar.DAY_OF_MONTH))
        } else {
            null
        }
    }.getOrNull()
}

@Composable
private fun MessageInput(onSend: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
        ),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Write a message") },
                maxLines = 4
            )
            Spacer(modifier = Modifier.width(4.dp))
            IconButton(
                onClick = {
                    if (text.isNotBlank()) {
                        onSend(text)
                        text = ""
                    }
                }
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send"
                )
            }
        }
    }
}

@Composable
private fun RateSection(onSubmit: (score: Int, comment: String?) -> Unit) {
    var score by remember { mutableStateOf(0) }
    var comment by remember { mutableStateOf("") }
    Row(
        modifier = Modifier.padding(top = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        (1..5).forEach { s ->
            IconButton(onClick = { score = s }) {
                Icon(
                    imageVector = if (s <= score) Icons.Filled.Star else Icons.Outlined.Star,
                    contentDescription = "$s star(s)",
                    tint = if (s <= score) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                )
            }
        }
        Button(
            onClick = { if (score in 1..5) onSubmit(score, comment.takeIf { it.isNotBlank() }) },
            modifier = Modifier.padding(start = 8.dp)
        ) {
            Text("Submit rating")
        }
    }
    OutlinedTextField(
        value = comment,
        onValueChange = { comment = it },
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        placeholder = { Text("Optional comment") },
        maxLines = 2
    )
}

private fun formatMessageTime(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    return try {
        val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        val date = input.parse(isoDate.take(19))
        if (date != null) {
            SimpleDateFormat("HH:mm", Locale.US).format(date)
        } else isoDate.take(16)
    } catch (_: Exception) {
        isoDate.take(16)
    }
}
