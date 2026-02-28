package com.hive.hive_app.ui.main

import android.content.Context
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Tag
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.ui.theme.HiveTheme
import com.hive.hive_app.ui.theme.SurfaceVariantLight
import com.hive.hive_app.util.formatDurationHours
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
    modifier: Modifier = Modifier
) {
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

                // Mock image placeholder (for future images)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceVariantLight),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Image,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "Image coming soon",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(12.dp)
                    )
                }

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
                                text = service.serviceType,
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

                    // Creator (on top of description)
                    DetailSection(title = "Creator", icon = Icons.Default.Person) {
                        Text(
                            text = creator?.fullName?.takeIf { it.isNotBlank() }
                                ?: creator?.username
                                ?: "User #${service.userId.take(8)}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // Description in a box
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = service.description,
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
                                    Text(
                                        text = user.fullName?.takeIf { it.isNotBlank() } ?: user.username,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
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

                    // Apply / Manage requests (FR-5)
                    if (viewModel != null && service.status in listOf("active", "in_progress")) {
                        Spacer(modifier = Modifier.height(12.dp))
                        if (!isOwner) {
                            if (myJoinRequest != null) {
                                StatusChip(status = myJoinRequest!!.status)
                            } else {
                                val buttonLabel = if (service.serviceType == "need") "Offer Help" else "Request Service"
                                Button(onClick = { showApplyDialog = true }) { Text(buttonLabel) }
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
    Surface(
        shape = RoundedCornerShape(percent = 50),
        color = bg.copy(alpha = 0.5f)
    ) {
        Text(
            text = status.replaceFirstChar { it.uppercase() },
            style = MaterialTheme.typography.labelMedium,
            color = onBg,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
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
