package com.hive.hive_app.ui.main

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.util.formatDurationHours
import androidx.compose.foundation.clickable

@Composable
fun DiscoverScreen(
    modifier: Modifier = Modifier,
    viewModel: DiscoverViewModel = hiltViewModel()
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    val detailViewModel: ServiceDetailViewModel = hiltViewModel()
    val context = LocalContext.current

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

    val state by viewModel.state.collectAsState()
    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
    ) { viewModel.setLocationPermissionGranted(it) }

    LaunchedEffect(Unit) {
        if (state.services.isEmpty() && !state.isLoading) viewModel.loadServices()
    }

    LaunchedEffect(Unit) {
        val granted = androidx.core.content.ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        viewModel.setLocationPermissionGranted(granted)
        if (!granted) {
            permissionLauncher.launch(android.Manifest.permission.ACCESS_COARSE_LOCATION)
        }
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Search bar
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = { viewModel.setSearchQuery(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Search services…") },
            leadingIcon = {
                Icon(
                    Icons.Default.Search,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { /* filter is live */ }),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                cursorColor = MaterialTheme.colorScheme.primary,
                focusedLeadingIconColor = MaterialTheme.colorScheme.primary
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(percent = 50)
        )

        // Service type filter
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                "Service type",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.filterType == null,
                    onClick = { viewModel.setFilter(null) },
                    label = { Text("All") }
                )
                FilterChip(
                    selected = state.filterType == "offer",
                    onClick = { viewModel.setFilter("offer") },
                    label = { Text("Offers") }
                )
                FilterChip(
                    selected = state.filterType == "need",
                    onClick = { viewModel.setFilter("need") },
                    label = { Text("Needs") }
                )
            }
        }

        // Sort by button (opens dropdown)
        var sortMenuExpanded by remember { mutableStateOf(false) }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            OutlinedButton(
                onClick = { sortMenuExpanded = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Sort by: ${state.sortOrder.label}")
                Icon(
                    Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
            DropdownMenu(
                expanded = sortMenuExpanded,
                onDismissRequest = { sortMenuExpanded = false },
                shape = RoundedCornerShape(12.dp)
            ) {
                DiscoverSortOrder.entries.forEach { order ->
                    DropdownMenuItem(
                        text = { Text(order.label) },
                        onClick = {
                            viewModel.setSortOrder(order)
                            sortMenuExpanded = false
                        }
                    )
                }
            }
        }

        if (state.isLoading && state.services.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        } else if (state.error != null && state.services.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    state.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        } else {
            val listState = rememberLazyListState()
            LaunchedEffect(state.sortOrder) {
                if (state.displayedServices.isNotEmpty()) {
                    listState.animateScrollToItem(0)
                }
            }
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(
                    items = state.displayedServices,
                    key = { it._id }
                ) { service ->
                    val distanceKm = viewModel.distanceToService(service)
                    DiscoverServiceCard(
                        service = service,
                        distanceKm = distanceKm,
                        onClick = { selectedServiceId = service._id }
                    )
                }
            }
        }
    }
}

@Composable
private fun DiscoverServiceCard(
    service: ServiceResponse,
    distanceKm: Double?,
    onClick: () -> Unit
) {
    val accepted = service.matchedUserIds?.size ?: 0
    val max = service.maxParticipants ?: 1
    val capacityText = "$accepted/$max"
    val locationText = service.location?.address?.takeIf { it.isNotBlank() }
        ?: service.location?.let { "%.4f, %.4f".format(it.latitude, it.longitude) }
        ?: "—"

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
            verticalArrangement = Arrangement.spacedBy(6.dp)
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
            Text(
                text = locationText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = service.serviceType,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = capacityText,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDurationHours(service.estimatedDuration) + " • " + service.status,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (distanceKm != null) {
                    Text(
                        text = "~${"%.1f".format(distanceKm)} km",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
