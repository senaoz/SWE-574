package com.hive.hive_app.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.hive.hive_app.data.api.dto.ServiceResponse
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

private fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val r = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c
}

@Composable
fun MapScreen(
    modifier: Modifier = Modifier,
    viewModel: MapViewModel = androidx.hilt.navigation.compose.hiltViewModel(),
    onServiceSelected: ((String) -> Unit)? = null
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    val detailViewModel: ServiceDetailViewModel = androidx.hilt.navigation.compose.hiltViewModel()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
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
            modifier = modifier
        )
        return
    }

    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
    ) { granted ->
        viewModel.setLocationPermissionGranted(granted)
    }

    LaunchedEffect(Unit) {
        val granted = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        viewModel.setLocationPermissionGranted(granted)
        if (!granted) {
            permissionLauncher.launch(android.Manifest.permission.ACCESS_COARSE_LOCATION)
        }
    }

    LaunchedEffect(state.locationPermissionGranted) {
        if (state.locationPermissionGranted) viewModel.refreshLocation()
        else viewModel.loadServices()
    }

    var mapView by remember { mutableStateOf<MapView?>(null) }
    var showListView by remember { mutableStateOf(false) }
    val listServices = remember(state.services, state.userLat, state.userLon) {
        val lat = state.userLat
        val lon = state.userLon
        if (lat != null && lon != null) {
            state.services.sortedBy { service ->
                service.location?.let { loc ->
                    distanceKm(lat, lon, loc.latitude, loc.longitude)
                } ?: Double.MAX_VALUE
            }
        } else state.services
    }

    Column(modifier = modifier.fillMaxSize()) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 4.dp,
            tonalElevation = 1.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    horizontalArrangement = Arrangement.spacedBy(0.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(topStart = 10.dp, bottomStart = 10.dp))
                            .background(
                                if (showListView) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable { showListView = true }
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.List,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = if (showListView) MaterialTheme.colorScheme.onPrimary
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "List",
                            style = MaterialTheme.typography.labelLarge,
                            color = if (showListView) MaterialTheme.colorScheme.onPrimary
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(start = 6.dp)
                        )
                    }
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(topEnd = 10.dp, bottomEnd = 10.dp))
                            .background(
                                if (!showListView) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable { showListView = false }
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Place,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = if (!showListView) MaterialTheme.colorScheme.onPrimary
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "Map",
                            style = MaterialTheme.typography.labelLarge,
                            color = if (!showListView) MaterialTheme.colorScheme.onPrimary
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(start = 6.dp)
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FilterChip(
                        selected = state.filterType == null,
                        onClick = { viewModel.setFilterType(null) },
                        label = { Text("All") }
                    )
                    FilterChip(
                        selected = state.filterType == "offer",
                        onClick = { viewModel.setFilterType("offer") },
                        label = { Text("Offers (${state.offerCount})") }
                    )
                    FilterChip(
                        selected = state.filterType == "need",
                        onClick = { viewModel.setFilterType("need") },
                        label = { Text("Needs (${state.needCount})") }
                    )
                    if (state.locationPermissionGranted) {
                        FilterChip(
                            selected = state.sortByDistance,
                            onClick = { viewModel.setSortByDistance(!state.sortByDistance) },
                            label = { Text("Near me") }
                        )
                    }
                }
            }
        }
        if (state.error != null) {
            Card(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Text(
                    state.error!!,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
        if (showListView) {
            if (state.isLoading && state.services.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(listServices, key = { it._id }) { service ->
                        val distKm = if (state.userLat != null && state.userLon != null && service.location != null)
                            distanceKm(state.userLat!!, state.userLon!!, service.location.latitude, service.location.longitude)
                        else null
                        MapServiceCard(
                            service = service,
                            distanceKm = distKm,
                            onClick = {
                                if (onServiceSelected != null) onServiceSelected.invoke(service._id)
                                else selectedServiceId = service._id
                            }
                        )
                    }
                }
            }
        } else {
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                factory = {
                    Configuration.getInstance().load(it, it.getSharedPreferences("osmdroid", android.content.Context.MODE_PRIVATE))
                    MapView(it).apply {
                        id = android.R.id.content
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
                        controller.setZoom(10.0)
                        mapView = this
                    }
                },
                modifier = Modifier.fillMaxSize(),
                update = { map ->
                    mapView = map
                    map.overlays.clear()
                    if (state.userLat != null && state.userLon != null) {
                        val myIcon = ContextCompat.getDrawable(context, com.hive.hive_app.R.drawable.ic_my_location)
                        val userMarker = Marker(map).apply {
                            position = GeoPoint(state.userLat!!, state.userLon!!)
                            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            setIcon(myIcon)
                            title = "You"
                        }
                        map.overlays.add(userMarker)
                    }
                    val pinOffer = ContextCompat.getDrawable(context, com.hive.hive_app.R.drawable.ic_map_pin_offer)?.mutate()
                    val pinNeed = ContextCompat.getDrawable(context, com.hive.hive_app.R.drawable.ic_map_pin_need)?.mutate()
                    state.services.forEach { service ->
                        service.location ?: return@forEach
                        val icon = if (service.serviceType == "offer") pinOffer?.constantState?.newDrawable()?.mutate() ?: pinOffer else pinNeed?.constantState?.newDrawable()?.mutate() ?: pinNeed
                        val marker = Marker(map).apply {
                            position = GeoPoint(service.location.latitude, service.location.longitude)
                            setAnchor(Marker.ANCHOR_BOTTOM, Marker.ANCHOR_CENTER)
                            setIcon(icon)
                            title = service.title
                            snippet = service.category
                            setOnMarkerClickListener { _, _ ->
                                if (onServiceSelected != null) onServiceSelected.invoke(service._id)
                                else selectedServiceId = service._id
                                true
                            }
                        }
                        map.overlays.add(marker)
                    }
                    when {
                        state.userLat != null && state.userLon != null -> {
                            map.controller.setCenter(GeoPoint(state.userLat!!, state.userLon!!))
                            if (state.sortByDistance) map.controller.setZoom(15.0)
                            else if (state.services.isEmpty()) map.controller.setZoom(12.0)
                        }
                        state.services.isNotEmpty() -> {
                            val points = state.services.mapNotNull { it.location?.let { loc -> GeoPoint(loc.latitude, loc.longitude) } }
                            if (points.size == 1) {
                                map.controller.setCenter(points[0])
                                map.controller.setZoom(14.0)
                            } else {
                                val box = BoundingBox.fromGeoPoints(points)
                                map.zoomToBoundingBox(box, false, 100)
                            }
                        }
                        else -> {
                            map.controller.setCenter(GeoPoint(39.0, 32.0))
                            map.controller.setZoom(4.0)
                        }
                    }
                    map.invalidate()
                }
            )
            val mapViewRef = mapView
            DisposableEffect(lifecycleOwner) {
                val observer = LifecycleEventObserver { _, event ->
                    when (event) {
                        Lifecycle.Event.ON_RESUME -> mapViewRef?.onResume()
                        Lifecycle.Event.ON_PAUSE -> mapViewRef?.onPause()
                        else -> {}
                    }
                }
                lifecycleOwner.lifecycle.addObserver(observer)
                onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
            }
            if (state.isLoading && state.services.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
        }
    }
}

@Composable
private fun MapServiceCard(
    service: ServiceResponse,
    distanceKm: Double?,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = service.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = service.description.take(120) + if (service.description.length > 120) "…" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = service.serviceType,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (distanceKm != null) {
                        Text(
                            text = "~${"%.1f".format(distanceKm)} km",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = "${com.hive.hive_app.util.formatDurationHours(service.estimatedDuration)} • ${service.status}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
