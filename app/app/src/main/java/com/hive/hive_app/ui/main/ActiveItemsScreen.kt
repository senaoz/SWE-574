package com.hive.hive_app.ui.main

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
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
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.util.formatApplicationDate
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton

private data class ConfirmCompletionData(
    val transactionId: String,
    val serviceTitle: String,
    val otherName: String,
    val creditsHours: Double,
    val ratedUserId: String
)

private val FEEDBACK_TAGS = listOf(
    "Clear Communicator", "Prepared", "Organized", "Responsible", "Trustworthy",
    "Helpful", "Kind", "Respectful", "Flexible", "Patient", "Reliable",
    "Collaborative", "Understanding", "Appreciative", "Easy to Work With"
)

@Composable
fun ActiveItemsScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveItemsViewModel = hiltViewModel(),
    onStartChat: ((String) -> Unit)? = null,
    onOpenUserProfile: ((String) -> Unit)? = null
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    var confirmCompletionData by remember { mutableStateOf<ConfirmCompletionData?>(null) }
    val detailViewModel: ServiceDetailViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()

    confirmCompletionData?.let { data ->
        ConfirmServiceCompletionDialog(
            serviceTitle = data.serviceTitle,
            otherName = data.otherName,
            creditsHours = data.creditsHours,
            onDismiss = { confirmCompletionData = null },
            onConfirm = { confirmed, score, feedbackTags, comment ->
                if (confirmed && score in 1..5) {
                    viewModel.confirmAndRate(data.transactionId, data.ratedUserId, score, feedbackTags, comment) { ok, _ ->
                        if (ok) confirmCompletionData = null
                    }
                }
            }
        )
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
            onOpenUserProfile = onOpenUserProfile
        )
        return
    }

    LaunchedEffect(Unit) { viewModel.load() }

    if (state.isLoading && state.myActiveServices.isEmpty() && state.applicationsSubmitted.isEmpty() && state.acceptedParticipation.isEmpty()) {
        Column(
            modifier = modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator()
        }
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
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
                val ownerName = state.ownerNamesByUserId[service.userId]
                val timeSlotText = formatServiceTimeSlot(service)
                ActiveServiceCard(
                    service = service,
                    ownerName = ownerName,
                    timeSlotText = timeSlotText,
                    onView = { selectedServiceId = service._id },
                    onMessage = { /* TODO: Message */ }
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
                ApplicationCard(
                    request = request,
                    serviceTitle = serviceTitle,
                    ownerName = ownerName,
                    timeSlotText = timeSlotText,
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
                val canConfirmReceived = serviceInProgress &&
                    transaction != null &&
                    transaction.requesterId == state.currentUserId &&
                    transaction.requesterConfirmed != true
                val transactionId = transaction?.id
                val ownerName = state.ownerNamesByUserId[service.userId]
                val timeSlotText = formatServiceTimeSlot(service)
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
                    showConfirmReceived = canConfirmReceived,
                    onConfirmReceived = if (canConfirmReceived) {
                        val txn = transaction!!
                        {
                            confirmCompletionData = ConfirmCompletionData(
                                transactionId = transactionId!!,
                                serviceTitle = service.title,
                                otherName = ownerName ?: "Unknown",
                                creditsHours = txn.timebankHours,
                                ratedUserId = if (state.currentUserId == txn.providerId) txn.requesterId else txn.providerId
                            )
                        }
                    } else null
                )
            }
        }
    }
}

@Composable
private fun ConfirmServiceCompletionDialog(
    serviceTitle: String,
    otherName: String,
    creditsHours: Double,
    onDismiss: () -> Unit,
    onConfirm: (confirmed: Boolean, score: Int, feedbackTags: List<String>, comment: String?) -> Unit
) {
    var confirmed by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }
    var selectedTags by remember { mutableStateOf(setOf<String>()) }
    var comment by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(scrollState)
            ) {
                Text(
                    text = "Confirm Service Completion",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(text = "Service: $serviceTitle", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 12.dp))
                Text(text = "With: $otherName", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(text = "Credits: ${if (creditsHours == 1.0) "1 hour" else "$creditsHours hours"}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)

                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 16.dp)) {
                    Checkbox(checked = confirmed, onCheckedChange = { confirmed = it })
                    Text(text = "I confirm that the service was completed as agreed.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                }
                Surface(
                    modifier = Modifier.padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                        Text(
                            text = "Once confirmed, the time credits will be transferred and this action cannot be undone.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }

                Text(text = "Rate this exchange*", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 16.dp))
                Row(modifier = Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    (1..5).forEach { s ->
                        IconButton(onClick = { score = s }) {
                            Icon(
                                imageVector = if (s <= score) Icons.Filled.Star else Icons.Outlined.Star,
                                contentDescription = "$s stars",
                                tint = if (s <= score) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                        }
                    }
                }

                Text(text = "Feedback*", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 12.dp))
                FlowRow(
                    modifier = Modifier.padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FEEDBACK_TAGS.forEach { tag ->
                        FilterChip(
                            selected = tag in selectedTags,
                            onClick = { selectedTags = if (tag in selectedTags) selectedTags - tag else selectedTags + tag },
                            label = { Text(tag) }
                        )
                    }
                }

                Text(text = "Additional Comments (Optional)", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 12.dp))
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    placeholder = { Text("How was your experience?") },
                    minLines = 2,
                    shape = RoundedCornerShape(12.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    val canSubmit = confirmed && score in 1..5 && selectedTags.isNotEmpty()
                    Button(
                        onClick = {
                            if (canSubmit) {
                                onConfirm(confirmed, score, selectedTags.toList(), comment.takeIf { it.isNotBlank() })
                            }
                        },
                        enabled = canSubmit,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("Confirm & Rate", modifier = Modifier.padding(start = 4.dp))
                    }
                }
            }
        }
    }
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

private fun formatServiceTimeSlot(service: ServiceResponse): String? {
    val date = service.specificDate
    val time = service.specificTime
    val open = service.openAvailability
    return when {
        !date.isNullOrBlank() && !time.isNullOrBlank() -> "$date at $time"
        !date.isNullOrBlank() -> date
        !open.isNullOrBlank() -> "Open: $open"
        else -> null
    }
}

private fun formatDuration(hours: Double): String =
    if (hours >= 1 && hours == hours.toLong().toDouble()) "${hours.toLong()}h" else "${hours}h"

@Composable
private fun ActiveServiceCard(
    service: ServiceResponse,
    ownerName: String? = null,
    timeSlotText: String? = null,
    onView: () -> Unit,
    onMessage: () -> Unit,
    showConfirmReceived: Boolean = false,
    onConfirmReceived: (() -> Unit)? = null
) {
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
            if (ownerName != null || timeSlotText != null) {
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ownerName?.let { name ->
                        Text(
                            text = "Owner: $name",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    timeSlotText?.let { slot ->
                        Text(
                            text = slot,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
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
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onMessage) { Text("Message") }
                    if (showConfirmReceived && onConfirmReceived != null) {
                        Button(onClick = onConfirmReceived) { Text("Confirm I received") }
                    }
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
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = serviceTitle,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = formatApplicationDate(request.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (ownerName != null || timeSlotText != null) {
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ownerName?.let { name ->
                        Text(
                            text = "Owner: $name",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    timeSlotText?.let { slot ->
                        Text(
                            text = slot,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            Surface(
                shape = RoundedCornerShape(percent = 50),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f),
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Text(
                    text = "Application",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
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
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
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
                if (request.status == "pending") {
                    OutlinedButton(onClick = onCancel) { Text("Cancel") }
                }
            }
        }
    }
}
