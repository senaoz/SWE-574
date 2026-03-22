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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.util.formatApplicationDate
import java.util.Locale

private fun canStartService(service: com.hive.hive_app.data.api.dto.ServiceResponse?): Boolean =
    service?.status?.lowercase() == "active"

private val ManageServiceGreen = Color(0xFF388E3C)

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

@Composable
fun ManageServiceScreen(
    serviceId: String,
    onBack: () -> Unit,
    onOpenUserProfile: ((String) -> Unit)? = null,
    onStartChat: ((String) -> Unit)? = null,
    /** When set, opens full-screen rating after "Confirm completion" (e.g. from Active tab). */
    onNavigateToCompleteRating: ((CompleteServiceRatingArgs) -> Unit)? = null,
    viewModel: ManageServiceRequestsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showStartServiceConfirm by remember { mutableStateOf(false) }

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
                                if (onNavigateToCompleteRating != null &&
                                    canConfirmCompletion(state.service, state.transaction, state.currentUserId)
                                ) {
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
                                                    otherName = state.completionOtherUserName ?: "Participant",
                                                    creditsHours = txn.timebankHours,
                                                    ratedUserId = ratedUserId
                                                )
                                            )
                                        },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = if (canStartService(state.service)) 8.dp else 0.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = ManageServiceGreen,
                                            contentColor = Color.White
                                        )
                                    ) {
                                        Text("Confirm completion & rate")
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
    viewModel: ManageServiceRequestsViewModel = hiltViewModel()
) {
    ManageServiceScreen(
        serviceId = serviceId,
        onBack = onBack,
        onOpenUserProfile = onOpenUserProfile,
        onStartChat = onStartChat,
        onNavigateToCompleteRating = onNavigateToCompleteRating,
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
                modifier = profileRowModifier,
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "${row.badgesEarned}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
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
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(onClick = onMessage) { Text("Message") }
                if (req.status == "pending") {
                    Button(onClick = { pendingAction = "approved" }) { Text("Approve") }
                    OutlinedButton(onClick = { pendingAction = "rejected" }) { Text("Reject") }
                }
            }
        }
    }
}
