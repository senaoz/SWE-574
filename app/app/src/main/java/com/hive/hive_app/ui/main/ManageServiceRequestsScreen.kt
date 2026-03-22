package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.util.formatApplicationDate
import java.util.Locale

private fun canStartService(service: com.hive.hive_app.data.api.dto.ServiceResponse?): Boolean =
    service?.status?.lowercase() == "active"

private fun canDeleteCancelEdit(service: com.hive.hive_app.data.api.dto.ServiceResponse?): Boolean {
    val s = service?.status?.lowercase() ?: return false
    return s == "active" || s == "in_progress"
}

/** Same lime accent as rating / completion flow (CompleteServiceRatingScreen). */
private val ManageServiceLime = Color(0xFFC6E600)
private val OnManageServiceLime = Color(0xFF2D3A00)

private fun canConfirmCompletion(
    service: com.hive.hive_app.data.api.dto.ServiceResponse?,
    txn: com.hive.hive_app.data.api.dto.TransactionResponse?,
    userId: String?
): Boolean {
    if (service == null || txn == null || userId == null) return false
    if (service.status?.lowercase() != "in_progress") return false
    return when (userId) {
        txn.requesterId -> txn.requesterConfirmed != true
        txn.providerId -> txn.providerConfirmed != true
        else -> false
    }
}

/** Current user already confirmed; waiting for the other party (see transaction flags in OpenAPI). */
private fun waitingForOtherToConfirm(
    service: com.hive.hive_app.data.api.dto.ServiceResponse?,
    txn: com.hive.hive_app.data.api.dto.TransactionResponse?,
    userId: String?
): Boolean {
    if (service == null || txn == null || userId == null) return false
    if (service.status?.lowercase() != "in_progress") return false
    val iConfirmed = when (userId) {
        txn.requesterId -> txn.requesterConfirmed == true
        txn.providerId -> txn.providerConfirmed == true
        else -> return false
    }
    if (!iConfirmed) return false
    val otherConfirmed = when (userId) {
        txn.requesterId -> txn.providerConfirmed == true
        txn.providerId -> txn.requesterConfirmed == true
        else -> false
    }
    return !otherConfirmed
}

/** Same mapping as [ServiceDetailScreen] creator badges. */
private val ReceiverConfirmedOverlay = Color(0xFF43A047).copy(alpha = 0.38f)

@Composable
private fun ReceiversAvatarRow(
    avatars: List<ReceiverAvatarUi>,
    onOpenUserProfile: ((String) -> Unit)?
) {
    val context = LocalContext.current
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .padding(top = 8.dp)
    ) {
        items(avatars, key = { it.userId }) { item ->
            val clickable = if (onOpenUserProfile != null) {
                Modifier.clickable { onOpenUserProfile(item.userId) }
            } else {
                Modifier
            }
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .then(clickable)
            ) {
                val img = buildImageRequest(context, item.profilePictureUrl)
                if (img != null) {
                    AsyncImage(
                        model = img,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(8.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (item.confirmed) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(ReceiverConfirmedOverlay)
                    )
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Confirmed",
                        modifier = Modifier
                            .align(Alignment.Center)
                            .size(22.dp),
                        tint = Color.White
                    )
                }
            }
        }
    }
}

private fun serviceRequestBadgeIcon(key: String?): ImageVector = when (key) {
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

@Composable
fun ManageServiceScreen(
    serviceId: String,
    onBack: () -> Unit,
    onOpenUserProfile: ((String) -> Unit)? = null,
    onStartChat: ((String) -> Unit)? = null,
    /** When set, opens full-screen rating after "Confirm completion" (e.g. from Active tab). */
    onNavigateToCompleteRating: ((CompleteServiceRatingArgs) -> Unit)? = null,
    /** Owner: open edit flow for this service (passes service id). */
    onEditService: ((String) -> Unit)? = null,
    viewModel: ManageServiceRequestsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showStartServiceConfirm by remember { mutableStateOf(false) }
    var showDeleteServiceDialog by remember { mutableStateOf(false) }
    var showCancelServiceDialog by remember { mutableStateOf(false) }

    if (showDeleteServiceDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteServiceDialog = false },
            title = { Text("Delete service") },
            text = { Text("This cannot be undone. Delete this service permanently?") },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteServiceDialog = false
                        viewModel.deleteService(serviceId) { ok, _ ->
                            if (ok) onBack()
                        }
                    }
                ) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteServiceDialog = false }) { Text("Back") }
            }
        )
    }
    if (showCancelServiceDialog) {
        AlertDialog(
            onDismissRequest = { showCancelServiceDialog = false },
            title = { Text("Cancel service") },
            text = { Text("Mark this service as cancelled? Participants will see it as cancelled.") },
            confirmButton = {
                Button(
                    onClick = {
                        showCancelServiceDialog = false
                        viewModel.cancelService(serviceId) { ok, _ ->
                            if (ok) onBack()
                        }
                    }
                ) { Text("Cancel service") }
            },
            dismissButton = {
                TextButton(onClick = { showCancelServiceDialog = false }) { Text("Back") }
            }
        )
    }

    if (showStartServiceConfirm) {
        AlertDialog(
            onDismissRequest = { showStartServiceConfirm = false },
            title = { Text("Start service") },
            text = {
                Text("Mark this service as started? Participants will see it as in progress.")
            },
            confirmButton = {
                Button(onClick = {
                    showStartServiceConfirm = false
                    viewModel.startService(serviceId) { }
                }) { Text("Start") }
            },
            dismissButton = {
                TextButton(onClick = { showStartServiceConfirm = false }) { Text("Cancel") }
            }
        )
    }

    LaunchedEffect(serviceId) {
        viewModel.load(serviceId)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
        }

        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }
            state.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = state.error ?: "",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            else -> {
                val pendingRows = state.requestRows.filter {
                    it.request.status.equals("pending", ignoreCase = true)
                }
                val participantRows = state.requestRows.filter {
                    it.request.status.equals("approved", ignoreCase = true)
                }
                val declinedRows = state.requestRows.filter {
                    it.request.status.equals("rejected", ignoreCase = true)
                }
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Requests",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }
                    if (pendingRows.isEmpty()) {
                        item {
                            Text(
                                text = "No pending requests.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        items(pendingRows, key = { it.request._id }) { row ->
                            ManageRequestCard(
                                row = row,
                                onApprove = { adminMsg ->
                                    viewModel.updateRequestStatus(
                                        row.request._id,
                                        "approved",
                                        adminMsg
                                    ) { }
                                },
                                onReject = { adminMsg ->
                                    viewModel.updateRequestStatus(
                                        row.request._id,
                                        "rejected",
                                        adminMsg
                                    ) { }
                                },
                                onOpenProfile = onOpenUserProfile?.let { cb ->
                                    { cb(row.request.userId) }
                                },
                                onMessage = {
                                    viewModel.startChatWithRequester(serviceId, row.request.userId) { roomId ->
                                        roomId?.let { onStartChat?.invoke(it) }
                                    }
                                }
                            )
                        }
                    }
                    item {
                        Text(
                            text = "Participants",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                        )
                    }
                    if (participantRows.isEmpty()) {
                        item {
                            Text(
                                text = "No participants yet. Approve a request above to add someone here.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        items(participantRows, key = { it.request._id }) { row ->
                            ManageRequestCard(
                                row = row,
                                onApprove = { },
                                onReject = { },
                                onOpenProfile = onOpenUserProfile?.let { cb ->
                                    { cb(row.request.userId) }
                                },
                                onMessage = {
                                    viewModel.startChatWithRequester(serviceId, row.request.userId) { roomId ->
                                        roomId?.let { onStartChat?.invoke(it) }
                                    }
                                }
                            )
                        }
                    }
                    if (declinedRows.isNotEmpty()) {
                        item {
                            Text(
                                text = "Declined",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                            )
                        }
                        items(declinedRows, key = { it.request._id }) { row ->
                            ManageRequestCard(
                                row = row,
                                onApprove = { },
                                onReject = { },
                                onOpenProfile = onOpenUserProfile?.let { cb ->
                                    { cb(row.request.userId) }
                                },
                                onMessage = {
                                    viewModel.startChatWithRequester(serviceId, row.request.userId) { roomId ->
                                        roomId?.let { onStartChat?.invoke(it) }
                                    }
                                }
                            )
                        }
                    }
                    item {
                        Text(
                            text = "Manage Service",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                        )
                    }
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                if (canStartService(state.service)) {
                                    Button(
                                        onClick = { showStartServiceConfirm = true },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Start service")
                                    }
                                }
                                if (canDeleteCancelEdit(state.service)) {
                                    if (canStartService(state.service)) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                    }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        OutlinedButton(
                                            onClick = { showDeleteServiceDialog = true },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(
                                                Icons.Default.Delete,
                                                contentDescription = null,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Delete", maxLines = 1, style = MaterialTheme.typography.labelLarge)
                                        }
                                        OutlinedButton(
                                            onClick = { showCancelServiceDialog = true },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(
                                                Icons.Default.Cancel,
                                                contentDescription = null,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Cancel", maxLines = 1, style = MaterialTheme.typography.labelLarge)
                                        }
                                        OutlinedButton(
                                            onClick = { onEditService?.invoke(serviceId) },
                                            enabled = onEditService != null,
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(
                                                Icons.Default.Edit,
                                                contentDescription = null,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Edit", maxLines = 1, style = MaterialTheme.typography.labelLarge)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (state.service?.status?.lowercase() == "in_progress") {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    val svc = state.service!!
                                    val matched = svc.matchedUserIds.orEmpty()
                                    val confirmedCount = svc.receiverConfirmedIds.orEmpty().size
                                    val totalReceivers =
                                        if (matched.isNotEmpty()) matched.size else (svc.maxParticipants ?: 1)
                                    Text(
                                        text = "Receivers: $confirmedCount/$totalReceivers Confirmed",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (state.receiverAvatars.isNotEmpty()) {
                                        ReceiversAvatarRow(
                                            avatars = state.receiverAvatars,
                                            onOpenUserProfile = onOpenUserProfile
                                        )
                                    }
                                    Text(
                                        text = "Provider: ${if (svc.providerConfirmed == true) "Confirmed" else "Pending"}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                    val completionWaiting = waitingForOtherToConfirm(
                        state.service,
                        state.transaction,
                        state.currentUserId
                    )
                    val completionCanMark = canConfirmCompletion(
                        state.service,
                        state.transaction,
                        state.currentUserId
                    )
                    val completionOtherName = state.completionOtherUserName ?: "the other participant"
                    val showCompletionCard = state.service?.status?.lowercase() == "in_progress" &&
                        state.transaction != null &&
                        (completionWaiting || (completionCanMark && onNavigateToCompleteRating != null))
                    if (showCompletionCard) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    if (completionWaiting) {
                                        Text(
                                            text = "Waiting for $completionOtherName to confirm completion.",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    } else if (completionCanMark && onNavigateToCompleteRating != null) {
                                        val svc = state.service!!
                                        val txn = state.transaction!!
                                        val uid = state.currentUserId!!
                                        val ratedUserId =
                                            if (uid == txn.providerId) txn.requesterId else txn.providerId
                                        Button(
                                            onClick = {
                                                onNavigateToCompleteRating(
                                                    CompleteServiceRatingArgs(
                                                        transactionId = txn.id,
                                                        serviceTitle = svc.title,
                                                        otherName = completionOtherName,
                                                        creditsHours = txn.timebankHours,
                                                        ratedUserId = ratedUserId
                                                    )
                                                )
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = ManageServiceLime,
                                                contentColor = OnManageServiceLime
                                            )
                                        ) {
                                            Text("Mark as completed")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** @deprecated Use [ManageServiceScreen] */
@Deprecated("Renamed to ManageServiceScreen", ReplaceWith("ManageServiceScreen"))
@Composable
fun ManageServiceRequestsScreen(
    serviceId: String,
    onBack: () -> Unit,
    onOpenUserProfile: ((String) -> Unit)? = null,
    onStartChat: ((String) -> Unit)? = null,
    onNavigateToCompleteRating: ((CompleteServiceRatingArgs) -> Unit)? = null,
    onEditService: ((String) -> Unit)? = null,
    viewModel: ManageServiceRequestsViewModel = hiltViewModel()
) {
    ManageServiceScreen(
        serviceId = serviceId,
        onBack = onBack,
        onOpenUserProfile = onOpenUserProfile,
        onStartChat = onStartChat,
        onNavigateToCompleteRating = onNavigateToCompleteRating,
        onEditService = onEditService,
        viewModel = viewModel
    )
}

@Composable
private fun ManageRequestCard(
    row: ServiceRequestRow,
    onApprove: (String?) -> Unit,
    onReject: (String?) -> Unit,
    onOpenProfile: (() -> Unit)?,
    onMessage: () -> Unit
) {
    val context = LocalContext.current
    var pendingAction by remember { mutableStateOf<String?>(null) }
    var badgeNameDialog by remember { mutableStateOf<String?>(null) }
    badgeNameDialog?.let { name ->
        AlertDialog(
            onDismissRequest = { badgeNameDialog = null },
            title = { Text("Badge") },
            text = { Text(name) },
            confirmButton = {
                TextButton(onClick = { badgeNameDialog = null }) { Text("OK") }
            }
        )
    }
    if (pendingAction != null) {
        val action = pendingAction!!
        var adminMsg by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { pendingAction = null },
            title = {
                Text(if (action == "approved") "Approve request" else "Reject request")
            },
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
                    val msg = adminMsg.takeIf { it.isNotBlank() }
                    if (action == "approved") onApprove(msg) else onReject(msg)
                    pendingAction = null
                }) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { pendingAction = null }) { Text("Cancel") }
            }
        )
    }

    val req = row.request
    val profileRowModifier = Modifier
        .fillMaxWidth()
        .then(
            if (onOpenProfile != null) Modifier.clickable { onOpenProfile() }
            else Modifier
        )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .then(profileRowModifier),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface),
                        contentAlignment = Alignment.Center
                    ) {
                        val img = buildImageRequest(context, row.profilePictureUrl)
                        if (img != null) {
                            AsyncImage(
                                model = img,
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(28.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = row.userName,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    Icons.Default.Star,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = Color(0xFFFFC107)
                                )
                                Text(
                                    text = row.averageRating?.let { String.format(Locale.US, "%.1f", it) }
                                        ?: "—",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "(${row.ratingTotal} ratings)",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                if (row.primaryBadgeKey != null) {
                    IconButton(
                        onClick = {
                            badgeNameDialog = row.primaryBadgeName
                                ?: row.primaryBadgeKey
                                ?: "Badge"
                        },
                        modifier = Modifier.padding(start = 4.dp)
                    ) {
                        Icon(
                            imageVector = serviceRequestBadgeIcon(row.primaryBadgeKey),
                            contentDescription = row.primaryBadgeName ?: row.primaryBadgeKey,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }

            Text(
                text = "Status: ${req.status.replaceFirstChar { it.uppercase() }} · ${formatApplicationDate(req.createdAt)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp)
            )
            req.message?.takeIf { it.isNotBlank() }?.let { msg ->
                Text(
                    text = "${row.applicantUsername}'s message:",
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
            if (req.status == "approved") {
                req.adminMessage?.takeIf { it.isNotBlank() }?.let { admin ->
                    Text(
                        text = "Your message:",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    Text(
                        text = admin,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (req.status == "pending") {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(onClick = { pendingAction = "approved" }) { Text("Approve") }
                        OutlinedButton(onClick = { pendingAction = "rejected" }) { Text("Reject") }
                    }
                }
                Spacer(modifier = Modifier.weight(1f))
                OutlinedButton(onClick = onMessage) { Text("Message") }
            }
        }
    }
}
