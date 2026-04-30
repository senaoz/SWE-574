package com.hive.hive_app.ui.main

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.repository.WikidataTagSuggestion
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun CreateEventScreen(
    modifier: Modifier = Modifier,
    userLat: Double?,
    userLon: Double?,
    locationPermissionGranted: Boolean,
    onRequestLocationPermission: () -> Unit,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    viewModel: ForumViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var tagQuery by remember { mutableStateOf("") }
    var selectedTags by remember { mutableStateOf<List<WikidataTagSuggestion>>(emptyList()) }
    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var localError by remember { mutableStateOf<String?>(null) }
    var isRemote by remember { mutableStateOf(false) }

    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedTime by remember { mutableStateOf(LocalTime.of(19, 0)) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    var selectedLat by remember { mutableStateOf(userLat ?: 41.0082) }
    var selectedLon by remember { mutableStateOf(userLon ?: 28.9784) }
    var locationText by remember { mutableStateOf("") }
    var hasManualLocation by remember { mutableStateOf(false) }
    var showLocationPicker by remember { mutableStateOf(false) }

    val createEventState by viewModel.createEventState.collectAsState()
    val tagSuggestions by viewModel.tagSuggestions.collectAsState()
    val tagSearchLoading by viewModel.tagSearchLoading.collectAsState()
    val tagSearchError by viewModel.tagSearchError.collectAsState()

    if (showLocationPicker && !isRemote) {
        LocationPickerScreen(
            initialLat = selectedLat,
            initialLon = selectedLon,
            canUseMyLocation = locationPermissionGranted && userLat != null && userLon != null,
            myLat = userLat,
            myLon = userLon,
            onRequestLocationPermission = onRequestLocationPermission,
            onBack = { showLocationPicker = false },
            onSelected = { lat, lon, address ->
                selectedLat = lat
                selectedLon = lon
                locationText = address ?: "%.5f, %.5f".format(lat, lon)
                hasManualLocation = true
                showLocationPicker = false
            }
        )
        return
    }

    val eventAt = remember(selectedDate, selectedTime) {
        val date = selectedDate
        if (date == null) ""
        else LocalDateTime.of(date, selectedTime).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }
    val dateLabel = selectedDate?.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) ?: ""
    val timeLabel = selectedTime.format(DateTimeFormatter.ofPattern("HH:mm"))

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        CommonCreateHeader(title = "Create event", onBack = onBack)
        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = title,
            onValueChange = {
                title = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Title") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = description,
            onValueChange = {
                description = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Description") },
            minLines = 4,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Switch(checked = isRemote, onCheckedChange = { isRemote = it })
            Text("Remote / online event")
        }
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedButton(onClick = { showDatePicker = true }, modifier = Modifier.fillMaxWidth()) {
            Text(if (dateLabel.isBlank()) "Select date" else "Date: $dateLabel")
        }
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedButton(onClick = { showTimePicker = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Time: $timeLabel")
        }

        if (!isRemote) {
            Spacer(modifier = Modifier.height(12.dp))
            CommonSectionLabel("Location")
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = { showLocationPicker = true }, modifier = Modifier.weight(1f)) {
                    Text("Select location")
                }
                OutlinedButton(
                    onClick = {
                        if (locationPermissionGranted && userLat != null && userLon != null) {
                            selectedLat = userLat
                            selectedLon = userLon
                            hasManualLocation = true
                            scope.launch {
                                val addr = withContext(Dispatchers.IO) {
                                    reverseGeocodeAddress(context, userLat, userLon)
                                }
                                locationText = addr ?: "%.5f, %.5f".format(userLat, userLon)
                            }
                        } else {
                            onRequestLocationPermission()
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Use my location")
                }
            }
            if (locationText.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(locationText, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clickable { showLocationPicker = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { ctx ->
                            Configuration.getInstance().load(
                                ctx,
                                ctx.getSharedPreferences("osmdroid", android.content.Context.MODE_PRIVATE)
                            )
                            MapView(ctx).apply {
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
                                setMultiTouchControls(false)
                                controller.setZoom(15.0)
                                setOnTouchListener { _, _ -> true }
                            }
                        },
                        update = { map ->
                            map.controller.setCenter(GeoPoint(selectedLat, selectedLon))
                            map.invalidate()
                        }
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { showLocationPicker = true }
                    )

                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(bottom = 4.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        CommonTagSelectorSection(
            tagQuery = tagQuery,
            onTagQueryChange = {
                tagQuery = it
                viewModel.setTagSearchQuery(it)
            },
            tagSuggestions = tagSuggestions,
            tagSearchLoading = tagSearchLoading,
            tagSearchError = tagSearchError,
            selectedTags = selectedTags,
            onAddTag = {
                selectedTags = selectedTags + it
                tagQuery = ""
                viewModel.setTagSearchQuery("")
            },
            onRemoveTag = { suggestion ->
                selectedTags = selectedTags.filterNot { it.id == suggestion.id }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))
        CommonImagePickerSection(
            selectedImageUris = selectedImageUris,
            onImagesChanged = { selectedImageUris = it },
            enabled = !createEventState.isSubmitting
        )

        if (!localError.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(localError!!, color = MaterialTheme.colorScheme.error)
        }
        if (createEventState.error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(createEventState.error!!, color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                if (title.trim().length < 3) {
                    localError = "Title must be at least 3 characters"
                    return@Button
                }
                if (description.trim().isBlank()) {
                    localError = "Description is required"
                    return@Button
                }
                if (eventAt.isBlank()) {
                    localError = "Date and time are required"
                    return@Button
                }
                if (!isRemote && !hasManualLocation && locationText.isBlank()) {
                    localError = "Please choose a location for in-person events"
                    return@Button
                }
                localError = null
                viewModel.createEventRich(
                    title = title,
                    description = description,
                    eventAt = eventAt,
                    location = locationText.takeIf { it.isNotBlank() },
                    latitude = if (isRemote) null else selectedLat,
                    longitude = if (isRemote) null else selectedLon,
                    isRemote = isRemote,
                    tags = selectedTags,
                    imageUris = selectedImageUris
                ) { id ->
                    onCreated(id)
                }
            },
            enabled = !createEventState.isSubmitting,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (createEventState.isSubmitting) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text("Create event")
            }
        }
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        selectedDate = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate()
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showTimePicker) {
        val timePickerState = rememberTimePickerState(
            initialHour = selectedTime.hour,
            initialMinute = selectedTime.minute,
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            title = { Text("Select time") },
            text = { TimePicker(state = timePickerState) },
            confirmButton = {
                TextButton(onClick = {
                    selectedTime = LocalTime.of(timePickerState.hour, timePickerState.minute)
                    showTimePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) { Text("Cancel") }
            }
        )
    }
}
