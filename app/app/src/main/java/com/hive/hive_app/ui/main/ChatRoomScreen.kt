package com.hive.hive_app.ui.main

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.MessageResponse
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun ChatRoomScreen(
    room: ChatRoomResponse,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ChatRoomViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val canSend = !viewModel.isExchangeCompleted(room)

    LaunchedEffect(room._id) { viewModel.loadMessages(room._id, room) }

    val otherParticipant = room.participants?.firstOrNull { it._id != state.currentUserId }
        ?: room.participants?.firstOrNull()
    val otherName = state.otherUser?.fullName?.takeIf { it.isNotBlank() }
        ?: state.otherUser?.username
        ?: otherParticipant?.fullName?.takeIf { it.isNotBlank() }
        ?: otherParticipant?.username
        ?: "Chat"
    val otherInitials = otherName.take(2).uppercase()

    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            if (state.otherUser?.profilePicture?.isNotBlank() == true) {
                val context = androidx.compose.ui.platform.LocalContext.current
                coil.compose.AsyncImage(
                    model = buildImageRequest(context, state.otherUser!!.profilePicture),
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
                        text = otherInitials,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 8.dp)
            ) {
                Text(
                    text = room.name ?: otherName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (room.participants != null && room.participants!!.size > 1) {
                    Text(
                        text = otherName,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            if (!canSend) {
                Text(
                    text = "Exchange completed",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

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
            items(state.messages, key = { it._id }) { msg ->
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
        horizontalArrangement = if (isFromCurrentUser) Arrangement.End else Arrangement.Start
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(0.85f),
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
private fun MessageInput(onSend: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
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
            placeholder = { Text("Message") },
            maxLines = 4
        )
        IconButton(
            onClick = {
                if (text.isNotBlank()) {
                    onSend(text)
                    text = ""
                }
            }
        ) {
            Icon(
                Icons.Filled.Send,
                contentDescription = "Send"
            )
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
            val now = System.currentTimeMillis()
            val diff = now - date.time
            when {
                diff < 60_000 -> "Just now"
                diff < 3600_000 -> "${diff / 60_000}m ago"
                else -> SimpleDateFormat("MMM d, HH:mm", Locale.US).format(date)
            }
        } else isoDate.take(16)
    } catch (_: Exception) {
        isoDate.take(16)
    }
}
