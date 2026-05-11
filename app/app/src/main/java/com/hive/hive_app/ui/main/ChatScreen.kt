@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.data.api.dto.ChatParticipant
import com.hive.hive_app.data.api.dto.ChatRoomResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.util.formatApplicationDate

@Composable
fun ChatScreen(
    modifier: Modifier = Modifier,
    viewModel: ChatViewModel = hiltViewModel(),
    initialRoomId: String? = null,
    onInitialRoomConsumed: () -> Unit = {},
    openCreateGroupSheet: Boolean = false,
    onCreateGroupSheetConsumed: () -> Unit = {},
    bottomBarPadding: Dp = 110.dp,
    onOpenUserProfile: (String) -> Unit = {},
    onOpenServiceDetail: (String) -> Unit = {}
) {
    var selectedRoom by remember { mutableStateOf<ChatRoomResponse?>(null) }
    val state by viewModel.state.collectAsState()

    LaunchedEffect(initialRoomId) {
        if (initialRoomId != null) {
            viewModel.openRoom(initialRoomId) { room ->
                if (room != null) {
                    viewModel.markRoomAsRead(room._id)
                }
                selectedRoom = room
                onInitialRoomConsumed()
            }
        }
    }
    LaunchedEffect(openCreateGroupSheet) {
        if (openCreateGroupSheet) {
            viewModel.showCreateGroupSheet()
            onCreateGroupSheetConsumed()
        }
    }

    if (selectedRoom != null) {
        val room = selectedRoom!!
        ChatRoomScreen(
            room = room,
            onBack = { selectedRoom = null },
            modifier = modifier,
            bottomBarPadding = bottomBarPadding,
            onOpenUserProfile = onOpenUserProfile,
            onOpenServiceDetail = onOpenServiceDetail
        )
        return
    }

    LaunchedEffect(Unit) { viewModel.loadRooms() }

    if (state.isCreateGroupSheetVisible) {
        CreateGroupChatSheet(
            state = state,
            onDismiss = viewModel::hideCreateGroupSheet,
            onNameChange = viewModel::updateCreateGroupName,
            onSearchChange = viewModel::updateParticipantSearchQuery,
            onToggleParticipant = viewModel::toggleParticipantSelection,
            onCreateClick = {
                viewModel.createGroupChat { room ->
                    selectedRoom = room
                }
            }
        )
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = bottomBarPadding),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            InboxHeaderCard(onCreateGroup = viewModel::showCreateGroupSheet)
        }

        item {
            OutlinedTextField(
                value = state.roomQuery,
                onValueChange = viewModel::setRoomQuery,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Search,
                        contentDescription = null
                    )
                },
                placeholder = { Text("Search chats or participants") }
            )
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                RoomFilterChip(
                    label = "All",
                    selected = state.activeFilter == ChatViewModel.RoomFilter.ALL,
                    onClick = { viewModel.setRoomFilter(ChatViewModel.RoomFilter.ALL) }
                )
                RoomFilterChip(
                    label = "Direct",
                    selected = state.activeFilter == ChatViewModel.RoomFilter.DIRECT,
                    onClick = { viewModel.setRoomFilter(ChatViewModel.RoomFilter.DIRECT) }
                )
                RoomFilterChip(
                    label = "Groups",
                    selected = state.activeFilter == ChatViewModel.RoomFilter.GROUP,
                    onClick = { viewModel.setRoomFilter(ChatViewModel.RoomFilter.GROUP) }
                )
            }
        }

        if (state.isLoading && state.rooms.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        } else if (state.error != null) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = state.error ?: "Something went wrong",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else if (state.visibleRooms.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                ) {
                    Text(
                        text = if (state.roomQuery.isBlank()) {
                            "No chat rooms yet. Start an exchange from Active or create a group chat."
                        } else {
                            "No chats match your search."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(state.visibleRooms, key = { it._id }) { room ->
                ChatRoomListItem(
                    room = room,
                    currentUserId = state.currentUserId,
                    lastMessage = state.roomLastMessages[room._id],
                    onClick = {
                        viewModel.markRoomAsRead(room._id)
                        selectedRoom = room
                    }
                )
            }
        }
    }
}

private fun chatParticipantInitials(p: ChatParticipant?): String {
    val name = p?.fullName?.takeIf { it.isNotBlank() } ?: p?.username ?: "?"
    return name.take(2).uppercase()
}

private fun userInitials(user: UserResponse): String {
    val value = user.fullName?.takeIf { it.isNotBlank() } ?: user.username
    return value.take(2).uppercase()
}

private fun userDisplayName(user: UserResponse): String {
    return user.fullName?.takeIf { it.isNotBlank() } ?: user.username
}

@Composable
private fun InboxHeaderCard(onCreateGroup: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "Messages",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Stay connected with direct and group conversations.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            Button(
                onClick = onCreateGroup,
                modifier = Modifier.padding(start = 12.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "Create Group Chat",
                    modifier = Modifier.padding(start = 6.dp)
                )
            }
        }
    }
}

@Composable
private fun RoomFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) }
    )
}

@Composable
private fun ChatRoomListItem(
    room: ChatRoomResponse,
    currentUserId: String?,
    lastMessage: ChatViewModel.RoomLastMessage?,
    onClick: () -> Unit
) {
    val isGroup = room.participantIds.size > 2
    val otherId = room.participantIds.firstOrNull { it != currentUserId }
    val otherParticipant = room.participants?.firstOrNull { it.userId == otherId }
        ?: room.participants?.firstOrNull { it.userId != currentUserId }
        ?: room.participants?.firstOrNull()
    val title = room.name?.takeIf { it.isNotBlank() }
        ?: otherParticipant?.fullName?.takeIf { it.isNotBlank() }
        ?: otherParticipant?.username
        ?: otherId?.let { "User ${it.take(8)}…" }
        ?: "Room ${room._id.take(8)}…"
    val profilePicUrl = otherParticipant?.profilePicture?.takeIf { it.isNotBlank() }
    val context = LocalContext.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (isGroup) {
                    GroupParticipantBubbles(
                        participants = room.participants.orEmpty(),
                        currentUserId = currentUserId,
                        modifier = Modifier.size(52.dp)
                    )
                } else if (!profilePicUrl.isNullOrBlank()) {
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
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val preview = lastMessage?.content?.trim().orEmpty()
                    if (preview.isNotEmpty()) {
                        Text(
                            text = listOfNotNull(lastMessage?.senderLabel, preview)
                                .joinToString(": "),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.95f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    if (isGroup) {
                        val names = room.participants
                            ?.filter { it.userId != currentUserId }
                            ?.mapNotNull { it.fullName?.takeIf(String::isNotBlank) ?: it.username }
                            ?.take(3)
                            ?.joinToString(", ")
                        if (!names.isNullOrBlank()) {
                            Text(
                                text = names,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.9f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = when {
                                room.transactionId != null -> Icons.Filled.Receipt
                                isGroup -> Icons.Filled.Groups
                                else -> Icons.Filled.Person
                            },
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        (lastMessage?.createdAt ?: room.lastMessageAt)?.let { at ->
                            Text(
                                text = formatApplicationDate(at),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
            val unread = lastMessage?.unreadCount ?: 0
            if (unread > 0) {
                Badge(
                    modifier = Modifier.align(Alignment.BottomStart),
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Text(
                        text = unread.toString(),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
            if (isGroup) {
                Row(
                    modifier = Modifier.align(Alignment.BottomEnd),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.People,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = room.participantIds.size.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun GroupParticipantBubbles(
    participants: List<ChatParticipant>,
    currentUserId: String?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    Box(modifier = modifier) {
        participants
            .filter { it.userId != currentUserId }
            .take(3)
            .forEachIndexed { index, participant ->
                val picUrl = participant.profilePicture?.takeIf { it.isNotBlank() }
                val offsetX = (index * 14).dp
                if (!picUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = buildImageRequest(context, picUrl),
                        contentDescription = null,
                        modifier = Modifier
                            .padding(start = offsetX)
                            .size(26.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .padding(start = offsetX)
                            .size(26.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.secondaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = chatParticipantInitials(participant),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
    }
}

@Composable
private fun CreateGroupChatSheet(
    state: ChatViewModel.ChatListState,
    onDismiss: () -> Unit,
    onNameChange: (String) -> Unit,
    onSearchChange: (String) -> Unit,
    onToggleParticipant: (UserResponse) -> Unit,
    onCreateClick: () -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Create Group Chat",
                style = MaterialTheme.typography.titleLarge
            )
            Text(
                text = "Choose up to 9 people. You will be included automatically.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp)
            )

            OutlinedTextField(
                value = state.createGroupName,
                onValueChange = onNameChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                singleLine = true,
                placeholder = { Text("Group name (optional)") }
            )

            OutlinedTextField(
                value = state.participantSearchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                singleLine = true,
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Search,
                        contentDescription = null
                    )
                },
                placeholder = { Text("Search participants") }
            )

            if (state.selectedParticipants.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    state.selectedParticipants.forEach { user ->
                        AssistChip(
                            onClick = { onToggleParticipant(user) },
                            label = { Text(userDisplayName(user)) },
                            trailingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Close,
                                    contentDescription = "Remove"
                                )
                            }
                        )
                    }
                }
            }

            if (state.isSearchingParticipants) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                }
            } else if (state.participantSearchQuery.isBlank()) {
                Text(
                    text = "Start typing to search users.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 12.dp)
                )
            } else if (state.candidateUsers.isEmpty()) {
                Text(
                    text = "No users found.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 12.dp)
                )
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 300.dp)
                        .padding(top = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    items(state.candidateUsers, key = { it._id }) { user ->
                        ParticipantResultRow(
                            user = user,
                            onClick = { onToggleParticipant(user) }
                        )
                        HorizontalDivider()
                    }
                }
            }

            state.participantSearchError?.let { error ->
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            state.createGroupError?.let { error ->
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Button(
                onClick = onCreateClick,
                enabled = state.selectedParticipants.isNotEmpty() && !state.isCreatingGroup,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 16.dp)
            ) {
                if (state.isCreatingGroup) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                    Text(
                        text = "Creating...",
                        modifier = Modifier.padding(start = 8.dp)
                    )
                } else {
                    Text("Create group chat (${state.selectedParticipants.size + 1})")
                }
            }
        }
    }
}

@Composable
private fun ParticipantResultRow(user: UserResponse, onClick: () -> Unit) {
    val context = LocalContext.current
    val profilePicture = user.profilePicture?.takeIf { it.isNotBlank() }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (!profilePicture.isNullOrBlank()) {
            AsyncImage(
                model = buildImageRequest(context, profilePicture),
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
                    text = userInitials(user),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
        Column(modifier = Modifier.padding(start = 12.dp)) {
            Text(
                text = userDisplayName(user),
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "@${user.username}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Box(modifier = Modifier.weight(1f))
        IconButton(onClick = onClick) {
            Icon(
                imageVector = Icons.Filled.Person,
                contentDescription = "Select participant"
            )
        }
    }
}
