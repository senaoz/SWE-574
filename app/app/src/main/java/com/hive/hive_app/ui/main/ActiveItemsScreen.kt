package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.util.formatApplicationDate
import com.hive.hive_app.util.formatServiceSchedulingDisplay
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveItemsScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveItemsViewModel = hiltViewModel(),
    onStartChat: ((String) -> Unit)? = null,
    onOpenUserProfile: ((String) -> Unit)? = null,
    onBack: (() -> Unit)? = null
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    var showCreateServiceScreen by remember { mutableStateOf(false) }
    var editServiceId by remember { mutableStateOf<String?>(null) }
    var manageRequestsServiceId by remember { mutableStateOf<String?>(null) }
    var completeServiceRatingArgs by remember { mutableStateOf<CompleteServiceRatingArgs?>(null) }
    val detailViewModel: ServiceDetailViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()

    completeServiceRatingArgs?.let { args ->
        key(args.transactionId) {
            CompleteServiceRatingScreen(
                args = args,
                onBack = { completeServiceRatingArgs = null },
                onSuccess = {
                    completeServiceRatingArgs = null
                    viewModel.load()
                },
                viewModel = viewModel
            )
        }
        return
    }

    manageRequestsServiceId?.let { mrId ->
        key(mrId) {
            ManageServiceScreen(
                serviceId = mrId,
                onBack = {
                    manageRequestsServiceId = null
                    viewModel.load()
                },
                onOpenUserProfile = onOpenUserProfile,
                onStartChat = onStartChat,
                onNavigateToCompleteRating = { args ->
                    completeServiceRatingArgs = args
                },
                onEditService = { sid ->
                    manageRequestsServiceId = null
                    editServiceId = sid
                    showCreateServiceScreen = true
                }
            )
        }
        return
    }

    if (showCreateServiceScreen) {
        CreateServiceScreen(
            modifier = modifier.fillMaxSize(),
            editServiceId = editServiceId,
            userLat = null,
            userLon = null,
            locationPermissionGranted = false,
            onRequestLocationPermission = { },
            onRefreshLocation = { },
            onBack = {
                showCreateServiceScreen = false
                editServiceId = null
            },
            onCreated = { serviceId ->
                showCreateServiceScreen = false
                editServiceId = null
                viewModel.load()
                selectedServiceId = serviceId
            }
        )
        return
    }

    if (selectedServiceId != null) {
        val id = selectedServiceId!!
        LaunchedEffect(id) { detailViewModel.load(id) }
        val detailState by detailViewModel.state.collectAsState()
        val detailCreator by detailViewModel.creator.collectAsState()
        val detailAcceptedUsers by detailViewModel.acceptedUsers.collectAsState()
        val detailLoading by detailViewModel.isLoading.collectAsState()
        val detailError by detailViewModel.error.collectAsState()
        val detailCreatorBadges by detailViewModel.creatorBadges.collectAsState()
        val detailCreatorRating by detailViewModel.creatorRating.collectAsState()
        val detailIsSaved by detailViewModel.isSaved.collectAsState()
        ServiceDetailScreen(
            service = detailState,
            creator = detailCreator,
            acceptedUsers = detailAcceptedUsers,
            isLoading = detailLoading,
            error = detailError,
            onBack = { selectedServiceId = null },
            viewModel = detailViewModel,
            modifier = modifier,
            creatorBadges = detailCreatorBadges,
            creatorRating = detailCreatorRating,
            isSaved = detailIsSaved,
            onStartChat = onStartChat,
            onOpenUserProfile = onOpenUserProfile,
            onManageJoinRequests = {
                manageRequestsServiceId = id
                selectedServiceId = null
            }
        )
        return
    }

    LaunchedEffect(Unit) { viewModel.load() }

    Scaffold(
        modifier = modifier,
        topBar = {
            if (onBack != null) {
                TopAppBar(
                    title = { Text("Active") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
    if (state.isLoading && state.myActiveServices.isEmpty() && state.applicationsSubmitted.isEmpty() && state.acceptedParticipation.isEmpty()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator()
        }
        return@Scaffold
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(innerPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "My active services",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
        if (state.myActiveServices.isEmpty()) {
            item {
                EmptySectionCard(
                    text = "You have no active offers or needs. Create a service from Discover to get started."
                )
            }
        } else {
            items(state.myActiveServices, key = { it._id }) { service ->
                val timeSlotText = formatServiceSchedulingDisplay(service)
                ActiveServiceCard(
                    service = service,
                    ownerName = null,
                    timeSlotText = timeSlotText,
                    onView = { selectedServiceId = service._id },
                    onMessage = null,
                    showOwner = false,
                    showCreationDateBottomLeft = true,
                    matchedUserAvatars = emptyList(),
                    manageRequestCount = state.joinRequestCountsByServiceId[service._id] ?: 0,
                    onManageRequests = { manageRequestsServiceId = service._id }
                )
            }
        }
        item {
            Text(
                "Applications I submitted",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
        item {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.myRequestsStatusFilter == null,
                    onClick = { viewModel.setMyRequestsStatusFilter(null) },
                    label = { Text("All") }
                )
                FilterChip(
                    selected = state.myRequestsStatusFilter == "pending",
                    onClick = { viewModel.setMyRequestsStatusFilter("pending") },
                    label = { Text("Pending (${state.pendingCount})") }
                )
                FilterChip(
                    selected = state.myRequestsStatusFilter == "rejected",
                    onClick = { viewModel.setMyRequestsStatusFilter("rejected") },
                    label = { Text("Rejected (${state.rejectedCount})") }
                )
            }
        }
        if (state.applicationsSubmitted.isEmpty()) {
            item {
                EmptySectionCard(
                    text = "There are no applications yet. Browse Discover or Map and apply to offer help or request a service."
                )
            }
        } else {
            items(state.applicationsSubmitted, key = { it._id }) { request ->
                val serviceTitle = state.applicationServiceTitles[request.serviceId] ?: "Service ${request.serviceId.take(8)}…"
                val ownerId = state.applicationServiceOwnerIds[request.serviceId]
                val ownerName = ownerId?.let { state.ownerNamesByUserId[it] }
                val timeSlotText = state.applicationServiceTimeSlots[request.serviceId]
                val metrics = state.applicationServiceMetrics[request.serviceId]
                ApplicationCard(
                    request = request,
                    serviceTitle = serviceTitle,
                    ownerName = ownerName,
                    timeSlotText = timeSlotText,
                    estimatedDurationHours = metrics?.estimatedDurationHours ?: 0.0,
                    maxParticipants = metrics?.maxParticipants ?: 1,
                    acceptedCount = metrics?.acceptedCount ?: 0,
                    onView = { selectedServiceId = request.serviceId },
                    onCancel = {
                        viewModel.cancelRequest(request._id) { ok, _ ->
                            if (!ok) viewModel.load()
                        }
                    }
                )
            }
        }
        item {
            Text(
                "Accepted participation",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
        if (state.acceptedParticipation.isEmpty()) {
            item {
                EmptySectionCard(
                    text = "No accepted participation yet. When your applications are approved, they will appear here."
                )
            }
        } else {
            items(state.acceptedParticipation, key = { it._id }) { service ->
                val transaction = state.acceptedServiceTransactions[service._id]
                val serviceInProgress = service.status?.lowercase() == "in_progress"
                val uid = state.currentUserId
                val canConfirmReceived = serviceInProgress &&
                    transaction != null &&
                    uid != null &&
                    when (uid) {
                        transaction.requesterId -> transaction.requesterConfirmed != true
                        transaction.providerId -> transaction.providerConfirmed != true
                        else -> false
                    }
                val transactionId = transaction?.id
                val ownerName = state.ownerNamesByUserId[service.userId]
                val timeSlotText = formatServiceSchedulingDisplay(service)
                val avatars = state.matchedUserProfilePicturesByServiceId[service._id].orEmpty()
                ActiveServiceCard(
                    service = service,
                    ownerName = ownerName,
                    timeSlotText = timeSlotText,
                    onView = { selectedServiceId = service._id },
                    onMessage = {
                        viewModel.startChatForAccepted(transactionId, service._id, service.userId) { roomId ->
                            roomId?.let { onStartChat?.invoke(it) }
                        }
                    },
                    showOwner = true,
                    showCreationDateBottomLeft = true,
                    matchedUserAvatars = avatars,
                    showConfirmReceived = canConfirmReceived,
                    onConfirmReceived = if (canConfirmReceived) {
                        val txn = transaction!!
                        val otherPartyId =
                            if (state.currentUserId == txn.providerId) txn.requesterId else txn.providerId
                        val otherDisplayName =
                            state.ownerNamesByUserId[otherPartyId] ?: ownerName ?: "Participant"
                        {
                            completeServiceRatingArgs = CompleteServiceRatingArgs(
                                transactionId = transactionId!!,
                                serviceTitle = service.title,
                                otherName = otherDisplayName,
                                creditsHours = txn.timebankHours,
                                ratedUserId = otherPartyId
                            )
                        }
                    } else null
                )
            }
        }
    } // end LazyColumn
    } // end Scaffold content
}

@Composable
private fun EmptySectionCard(text: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(16.dp)
        )
    }
}

private fun formatDuration(hours: Double): String =
    if (hours >= 1 && hours == hours.toLong().toDouble()) "${hours.toLong()}h" else "${hours}h"

@Composable
private fun TimeSlotWithCalendarIcon(slot: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = Icons.Default.CalendarToday,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = slot,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ActiveServiceCard(
    service: ServiceResponse,
    ownerName: String? = null,
    timeSlotText: String? = null,
    onView: () -> Unit,
    onMessage: (() -> Unit)?,
    showOwner: Boolean = true,
    showCreationDateBottomLeft: Boolean = false,
    matchedUserAvatars: List<String?> = emptyList(),
    showConfirmReceived: Boolean = false,
    onConfirmReceived: (() -> Unit)? = null,
    manageRequestCount: Int = 0,
    onManageRequests: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val max = service.maxParticipants ?: 1
    val acceptedCount = service.matchedUserIds?.size ?: 0
    val (statusIcon, statusLabel) = when (service.status?.lowercase()) {
        "active" -> Icons.Default.Schedule to "Active"
        "in_progress" -> Icons.Default.Timer to "In progress"
        "completed" -> Icons.Default.CheckCircle to "Completed"
        "cancelled" -> Icons.Default.Cancel to "Cancelled"
        "expired" -> Icons.Default.Cancel to "Expired"
        else -> Icons.Default.Schedule to (service.status ?: "Active")
    }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onView),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = service.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccessTime,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatDuration(service.estimatedDuration),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.People,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "$acceptedCount/$max",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            val showOwnerOrSlot = (showOwner && ownerName != null) || timeSlotText != null
            val showMetaBlock = matchedUserAvatars.isNotEmpty() || showOwnerOrSlot
            if (showMetaBlock) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (matchedUserAvatars.isNotEmpty()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            matchedUserAvatars.take(12).forEach { picUrl ->
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.surfaceVariant),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val req = buildImageRequest(context, picUrl)
                                    if (req != null) {
                                        AsyncImage(
                                            model = req,
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            modifier = Modifier.size(18.dp),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                    if (showOwnerOrSlot) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            if (showOwner && ownerName != null) {
                                Text(
                                    text = "Owner: $ownerName",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            timeSlotText?.let { slot ->
                                TimeSlotWithCalendarIcon(slot = slot)
                            }
                        }
                    }
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = statusIcon,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = statusLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (onManageRequests != null) {
                        OutlinedButton(onClick = onManageRequests) {
                            Text("Manage service ($manageRequestCount)")
                        }
                    }
                    if (onMessage != null) {
                        OutlinedButton(onClick = onMessage) { Text("Message") }
                    }
                    if (showConfirmReceived && onConfirmReceived != null) {
                        Button(onClick = onConfirmReceived) { Text("Confirm I received") }
                    }
                }
            }
            if (showCreationDateBottomLeft) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.Start
                ) {
                    Text(
                        text = formatApplicationDate(service.createdAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
                    )
                }
            }
        }
    }
}

@Composable
private fun ApplicationCard(
    request: JoinRequestResponse,
    serviceTitle: String,
    ownerName: String?,
    timeSlotText: String?,
    estimatedDurationHours: Double,
    maxParticipants: Int,
    acceptedCount: Int,
    onView: () -> Unit,
    onCancel: () -> Unit
) {
    val (statusIcon, statusLabel) = when (request.status.lowercase()) {
        "pending" -> Icons.Default.Schedule to "Pending"
        "approved" -> Icons.Default.CheckCircle to "Approved"
        "rejected" -> Icons.Default.Cancel to "Rejected"
        else -> Icons.Default.Schedule to request.status.replaceFirstChar { it.uppercase() }
    }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onView),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = serviceTitle,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccessTime,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatDuration(estimatedDurationHours),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.People,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "$acceptedCount/$maxParticipants",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            val showOwnerOrSlot = (ownerName != null) || (timeSlotText != null)
            if (showOwnerOrSlot) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    ownerName?.let { name ->
                        Text(
                            text = "Owner: $name",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    timeSlotText?.let { slot ->
                        TimeSlotWithCalendarIcon(slot = slot)
                    }
                }
            }
            request.message?.takeIf { it.isNotBlank() }?.let { msg ->
                Text(
                    text = "Your message:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 10.dp)
                )
                Text(
                    text = msg,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
            request.adminMessage?.takeIf { it.isNotBlank() }?.let { msg ->
                Text(
                    text = "Owner's message:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 6.dp)
                )
                Text(
                    text = msg,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = statusIcon,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = statusLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                if (request.status == "pending") {
                    OutlinedButton(onClick = onCancel) { Text("Cancel") }
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.Start
            ) {
                Text(
                    text = formatApplicationDate(request.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
                )
            }
        }
    }
}
