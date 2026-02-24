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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
                        Surface(
                            shape = RoundedCornerShape(percent = 50),
                            color = HiveTheme.semanticColors.category.copy(alpha = 0.4f)
                        ) {
                            Text(
                                text = service.category,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
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
