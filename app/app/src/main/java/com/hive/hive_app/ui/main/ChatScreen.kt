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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.data.api.dto.ChatParticipant
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.util.formatApplicationDate

@Composable
fun ChatScreen(
    modifier: Modifier = Modifier,
    viewModel: ChatViewModel = hiltViewModel(),
    initialRoomId: String? = null,
    onInitialRoomConsumed: () -> Unit = {}
) {
    var selectedRoom by remember { mutableStateOf<ChatRoomResponse?>(null) }
    val state by viewModel.state.collectAsState()

    LaunchedEffect(initialRoomId) {
        if (initialRoomId != null) {
            viewModel.openRoom(initialRoomId) { room ->
                selectedRoom = room
                onInitialRoomConsumed()
            }
        }
    }

    if (selectedRoom != null) {
        val room = selectedRoom!!
        ChatRoomScreen(
            room = room,
            onBack = { selectedRoom = null },
            modifier = modifier
        )
        return
    }

    LaunchedEffect(Unit) { viewModel.loadRooms() }

    if (state.isLoading && state.rooms.isEmpty()) {
        Column(
            modifier = modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator()
        }
        return
    }

    state.error?.let { error ->
        Column(
            modifier = modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error
            )
        }
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Chat",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
        if (state.rooms.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Text(
                        text = "No chat rooms yet. Start an exchange from Active to message with others.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(state.rooms, key = { it._id }) { room ->
                ChatRoomListItem(
                    room = room,
                    currentUserId = state.currentUserId,
                    onClick = { selectedRoom = room }
                )
            }
        }
    }
}

private fun chatParticipantInitials(p: ChatParticipant?): String {
    val name = p?.fullName?.takeIf { it.isNotBlank() } ?: p?.username ?: "?"
    return name.take(2).uppercase()
}

@Composable
private fun ChatRoomListItem(
    room: ChatRoomResponse,
    currentUserId: String?,
    onClick: () -> Unit
) {
    // Resolve the *other* user (not current): use participant_ids so we don't show ourselves
    val otherId = room.participantIds.firstOrNull { it != currentUserId }
    val otherParticipant = room.participants?.firstOrNull { it._id == otherId }
        ?: room.participants?.firstOrNull { it._id != currentUserId }
        ?: room.participants?.firstOrNull()
    val title = room.name
        ?: otherParticipant?.fullName?.takeIf { it.isNotBlank() }
        ?: otherParticipant?.username
        ?: otherId?.let { "User ${it.take(8)}…" }
        ?: "Chat ${room._id.take(8)}…"
    val subtitle = room.transactionId?.let { "Transaction" } ?: "Chat"
    val profilePicUrl = otherParticipant?.profilePicture?.takeIf { it.isNotBlank() }
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (!profilePicUrl.isNullOrBlank()) {
                AsyncImage(
                    model = buildImageRequest(context, profilePicUrl),
                    contentDescription = null,
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
                        text = chatParticipantInitials(otherParticipant),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                room.lastMessageAt?.let { at ->
                    Text(
                        text = "Last message: ${formatApplicationDate(at)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}
