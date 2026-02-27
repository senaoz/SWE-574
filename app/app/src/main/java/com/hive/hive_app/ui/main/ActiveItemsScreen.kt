package com.hive.hive_app.ui.main

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.foundation.shape.RoundedCornerShape

@Composable
fun ActiveItemsScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveItemsViewModel = hiltViewModel()
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    val detailViewModel: ServiceDetailViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()

    if (selectedServiceId != null) {
        val id = selectedServiceId!!
        LaunchedEffect(id) { detailViewModel.load(id) }
        val detailState by detailViewModel.state.collectAsState()
        val detailCreator by detailViewModel.creator.collectAsState()
        val detailAcceptedUsers by detailViewModel.acceptedUsers.collectAsState()
        val detailLoading by detailViewModel.isLoading.collectAsState()
        val detailError by detailViewModel.error.collectAsState()
        ServiceDetailScreen(
            service = detailState,
            creator = detailCreator,
            acceptedUsers = detailAcceptedUsers,
            isLoading = detailLoading,
            error = detailError,
            onBack = { selectedServiceId = null },
            viewModel = detailViewModel,
            modifier = modifier
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
                ActiveServiceCard(
                    service = service,
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
                    selected = state.myRequestsStatusFilter == "approved",
                    onClick = { viewModel.setMyRequestsStatusFilter("approved") },
                    label = { Text("Approved (${state.approvedCount})") }
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
                ApplicationCard(
                    request = request,
                    serviceTitle = serviceTitle,
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
                ActiveServiceCard(
                    service = service,
                    onView = { selectedServiceId = service._id },
                    onMessage = { /* TODO: Message */ }
                )
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

@Composable
private fun ActiveServiceCard(
    service: ServiceResponse,
    onView: () -> Unit,
    onMessage: () -> Unit
) {
    val max = service.maxParticipants ?: 1
    val acceptedCount = service.matchedUserIds?.size ?: 0
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = service.title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "${service.serviceType} • ${service.status} • $acceptedCount / $max participants",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = onView) { Text("View") }
                OutlinedButton(onClick = onMessage) { Text("Message") }
            }
        }
    }
}

@Composable
private fun ApplicationCard(
    request: JoinRequestResponse,
    serviceTitle: String,
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
        modifier = Modifier.fillMaxWidth(),
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
            Row(
                modifier = Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(percent = 50),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f)
                ) {
                    Text(
                        text = "Application",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Surface(
                    shape = RoundedCornerShape(percent = 50),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
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
                    text = "Note: $msg",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = onView) { Text("View") }
                if (request.status == "pending") {
                    OutlinedButton(onClick = onCancel) { Text("Cancel") }
                }
            }
        }
    }
}
