package com.hive.hive_app.ui.main

import android.content.Context
import android.location.Geocoder
import android.net.Uri
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Videocam
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.SelectableChipColors
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.foundation.focusable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import coil.compose.AsyncImage
import coil.request.ImageRequest
import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.rememberDatePickerState
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import android.view.MotionEvent
import java.io.IOException
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.hive.hive_app.data.api.dto.LocationDto
import com.hive.hive_app.data.api.dto.RecurringPatternDto
import com.hive.hive_app.data.api.dto.TagDto
import com.hive.hive_app.data.repository.WikidataTagSuggestion
import com.hive.hive_app.ui.theme.Lime500
import com.hive.hive_app.ui.theme.Lime50

private const val FALLBACK_LAT = 41.0082
private const val FALLBACK_LON = 28.9784

/** Matches backend `scheduling_type` values. */
private enum class SchedulingMode {
    SPECIFIC,
    RECURRING,
    OPEN
}

private val weekDaysOrdered = listOf(
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
)

private fun halfHourTimes24h(): List<String> = buildList(48) {
    for (h in 0..23) {
        add("%02d:%02d".format(h, 0))
        add("%02d:%02d".format(h, 30))
    }
}

private fun ordinalSuffix(day: Int): String = when {
    day % 100 in 11..13 -> "th"
    day % 10 == 1 -> "st"
    day % 10 == 2 -> "nd"
    day % 10 == 3 -> "rd"
    else -> "th"
}

private fun formatPrettyDate(localDate: LocalDate): String =
    "${localDate.format(DateTimeFormatter.ofPattern("MMMM d"))}${ordinalSuffix(localDate.dayOfMonth)}"

private fun parseHHmm(time: String): Pair<Int, Int> {
    val parts = time.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 9
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    return h.coerceIn(0, 23) to m.coerceIn(0, 59)
}

/** Selected chips use app lime (Lime50 fill, Lime500 label/icons). */
@Composable
private fun hiveLimeFilterChipColors(): SelectableChipColors =
    FilterChipDefaults.filterChipColors(
        selectedContainerColor = Lime50,
        selectedLabelColor = Lime500,
        selectedLeadingIconColor = Lime500
    )

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateServiceScreen(
    modifier: Modifier = Modifier,
    /** When set, form loads this service and submit calls [CreateServiceViewModel.updateService]. */
    editServiceId: String? = null,
    userLat: Double?,
    userLon: Double?,
    locationPermissionGranted: Boolean,
    onRequestLocationPermission: () -> Unit,
    onRefreshLocation: () -> Unit,
    onBack: () -> Unit,
    onCreated: (serviceId: String) -> Unit,
    viewModel: CreateServiceViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var serviceType by remember { mutableStateOf("offer") }
    var isRemote by remember { mutableStateOf(false) }

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var tagQuery by remember { mutableStateOf("") }
    var selectedTags by remember { mutableStateOf<List<WikidataTagSuggestion>>(emptyList()) }
    var estimatedDurationText by remember { mutableStateOf("1") }
    var maxParticipantsText by remember { mutableStateOf("1") }

    var schedulingMode by remember { mutableStateOf(SchedulingMode.SPECIFIC) }
    var specificDateMillis by remember { mutableStateOf<Long?>(null) }
    var specificTimeHHmm by remember { mutableStateOf("09:00") }
    var recurringDays by remember { mutableStateOf<Set<String>>(emptySet()) }
    var recurringTimeHHmm by remember { mutableStateOf("09:00") }
    var showDatePicker by remember { mutableStateOf(false) }
    var timeSlotDialogFor by remember { mutableStateOf<SchedulingMode?>(null) }
    var openAvailabilityText by remember { mutableStateOf("") }

    // Tap-to-pick location on map (specific location).
    var selectedLat by remember { mutableStateOf(userLat ?: FALLBACK_LAT) }
    var selectedLon by remember { mutableStateOf(userLon ?: FALLBACK_LON) }

    var locationNameText by remember { mutableStateOf("") }

    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var existingServerImageUrls by remember(editServiceId) { mutableStateOf<List<String>>(emptyList()) }
    var localError by remember { mutableStateOf<String?>(null) }

    val isLoading by viewModel.isLoading.collectAsState()
    val vmError by viewModel.error.collectAsState()

    val tagSuggestions by viewModel.tagSuggestions.collectAsState()
    val tagSearchLoading by viewModel.tagSearchLoading.collectAsState()
    val tagSearchError by viewModel.tagSearchError.collectAsState()

    val todayLocalDate = remember { LocalDate.now() }
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = specificDateMillis,
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                val picked = Instant.ofEpochMilli(utcTimeMillis)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                return !picked.isBefore(todayLocalDate)
            }
        }
    )

    val pickImagesLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (!uris.isNullOrEmpty()) {
            selectedImageUris = selectedImageUris + uris
        }
    }

    // Refresh GPS when opening Create service so Location name can geocode from latest coords.
    LaunchedEffect(Unit) {
        onRefreshLocation()
    }

    // Sync map + Location name from user's coordinates (geocoded address, not placeholder text).
    LaunchedEffect(userLat, userLon, isRemote, editServiceId) {
        if (editServiceId != null) return@LaunchedEffect
        if (userLat == null || userLon == null) return@LaunchedEffect
        selectedLat = userLat
        selectedLon = userLon
        if (locationNameText.isNotBlank()) return@LaunchedEffect
        val resolved = withContext(Dispatchers.IO) {
            reverseGeocodeAddress(context, userLat, userLon)
        }
        if (locationNameText.isNotBlank()) return@LaunchedEffect
        locationNameText = resolved ?: "%.5f, %.5f".format(userLat, userLon)
    }

    // Throttle OSMDroid overlay updates: AndroidView `update` runs every recomposition; redrawing the map
    // on every keystroke (e.g. Title) steals focus from TextFields. Only refresh when location/type changes.
    val mapOverlayLastKey = remember { object { var value: String? = null } }
    LaunchedEffect(isRemote) {
        if (!isRemote) mapOverlayLastKey.value = null
    }

    LaunchedEffect(editServiceId) {
        val id = editServiceId ?: return@LaunchedEffect
        val svc = viewModel.fetchServiceForEdit(id) ?: run {
            localError = "Could not load service"
            return@LaunchedEffect
        }
        localError = null
        serviceType = svc.serviceType
        isRemote = svc.isRemote
        title = svc.title
        description = svc.description
        selectedTags = svc.tags.map { t ->
            WikidataTagSuggestion(
                id = (t.entityId ?: t.id).orEmpty(),
                label = t.label ?: t.name ?: ""
            )
        }.filter { it.id.isNotBlank() }
        val d = svc.estimatedDuration
        estimatedDurationText = if (d % 1.0 == 0.0) d.toInt().toString() else d.toString()
        maxParticipantsText = (svc.maxParticipants ?: 1).toString()
        schedulingMode = when (svc.schedulingType?.lowercase()) {
            "specific" -> SchedulingMode.SPECIFIC
            "recurring" -> SchedulingMode.RECURRING
            else -> SchedulingMode.OPEN
        }
        svc.specificDate?.let { dateStr ->
            try {
                val ld = LocalDate.parse(dateStr)
                specificDateMillis = ld.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
            } catch (_: Exception) {
            }
        }
        specificTimeHHmm = svc.specificTime?.takeIf { it.isNotBlank() } ?: "09:00"
        recurringDays = svc.recurringPattern?.days?.toSet() ?: emptySet()
        recurringTimeHHmm = svc.recurringPattern?.time?.takeIf { it.isNotBlank() } ?: "09:00"
        openAvailabilityText = svc.openAvailability ?: ""
        selectedLat = svc.location.latitude
        selectedLon = svc.location.longitude
        locationNameText = svc.location.address?.takeIf { it.isNotBlank() }
            ?: "%.5f, %.5f".format(svc.location.latitude, svc.location.longitude)
        existingServerImageUrls = svc.imageUrls.orEmpty()
        selectedImageUris = emptyList()
        mapOverlayLastKey.value = null
    }

    val specificDateLabel = specificDateMillis?.let {
        val localDate = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).toLocalDate()
        formatPrettyDate(localDate)
    } ?: ""

    val offerNeedTitleExample = if (serviceType == "offer") {
        "Offer help (e.g. tutor math, lend tools)"
    } else {
        "Request help (e.g. need tutoring, need plumbing)"
    }

    val offerNeedDescriptionExample = if (serviceType == "offer") {
        "What can you do? Include details, availability, and any requirements."
    } else {
        "What do you need? Describe the scope and your best times."
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Top bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(
                    text = if (editServiceId != null) "Edit service" else "Create service",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Service type
            Text(
                text = "Type",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = serviceType == "offer",
                    onClick = { serviceType = "offer" },
                    label = { Text("Offer") },
                    colors = hiveLimeFilterChipColors()
                )
                FilterChip(
                    selected = serviceType == "need",
                    onClick = { serviceType = "need" },
                    label = { Text("Need") },
                    colors = hiveLimeFilterChipColors()
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Remote / In person
            Text(
                text = "Delivery mode",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = isRemote,
                    onClick = { isRemote = true },
                    label = { Text("Remote") },
                    leadingIcon = {
                        Icon(
                            Icons.Outlined.Videocam,
                            contentDescription = null,
                            modifier = Modifier.size(FilterChipDefaults.IconSize)
                        )
                    },
                    colors = hiveLimeFilterChipColors()
                )
                FilterChip(
                    selected = !isRemote,
                    onClick = { isRemote = false },
                    label = { Text("In Person") },
                    leadingIcon = {
                        Icon(
                            Icons.Outlined.Groups,
                            contentDescription = null,
                            modifier = Modifier.size(FilterChipDefaults.IconSize)
                        )
                    },
                    colors = hiveLimeFilterChipColors()
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Title") },
                placeholder = { Text(offerNeedTitleExample) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            val descTrimmedLen = description.trim().length
            val descTooShort = descTrimmedLen in 1..9
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Description") },
                    placeholder = { Text(offerNeedDescriptionExample) },
                    isError = descTooShort,
                    minLines = 3,
                    shape = RoundedCornerShape(12.dp)
                )
                Text(
                    text = "${description.length} characters",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (descTrimmedLen < 10) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = 16.dp, bottom = 10.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Tags (Wikidata)",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = tagQuery,
                onValueChange = {
                    tagQuery = it
                    viewModel.setTagSearchQuery(it)
                },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Search tags") },
                placeholder = { Text("Start typing (e.g. photography)") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            if (tagSearchLoading) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Searching…",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (tagSearchError != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = tagSearchError!!,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            if (tagSuggestions.isNotEmpty() && tagQuery.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 220.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        tagSuggestions.forEach { suggestion ->
                            val alreadySelected = selectedTags.any { it.id == suggestion.id }
                            TextButton(
                                onClick = {
                                    if (!alreadySelected) selectedTags = selectedTags + suggestion
                                    tagQuery = ""
                                    viewModel.setTagSearchQuery("")
                                },
                                enabled = !isLoading && !alreadySelected
                            ) {
                                Text(
                                    text = suggestion.label,
                                    maxLines = 1,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            if (selectedTags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    selectedTags.forEach { suggestion ->
                        FilterChip(
                            selected = true,
                            onClick = { selectedTags = selectedTags.filterNot { it.id == suggestion.id } },
                            label = { Text(suggestion.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = Color.White,
                                labelColor = Lime500,
                                iconColor = Lime500,
                                selectedContainerColor = Color.White,
                                selectedLabelColor = Lime500,
                                selectedLeadingIconColor = Lime500
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = true,
                                borderColor = Lime500,
                                selectedBorderColor = Lime500
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = estimatedDurationText,
                    onValueChange = { estimatedDurationText = it },
                    modifier = Modifier.weight(1f),
                    label = { Text("Estimated duration (hours)") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = maxParticipantsText,
                    onValueChange = { maxParticipantsText = it },
                    modifier = Modifier.weight(1f),
                    label = { Text("Max participants") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Scheduling type (matches backend scheduling_type)
            Text(
                text = "Scheduling",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = schedulingMode == SchedulingMode.SPECIFIC,
                    onClick = { schedulingMode = SchedulingMode.SPECIFIC },
                    label = { Text("Specific date & time") },
                    colors = hiveLimeFilterChipColors()
                )
                FilterChip(
                    selected = schedulingMode == SchedulingMode.RECURRING,
                    onClick = { schedulingMode = SchedulingMode.RECURRING },
                    label = { Text("Recurring pattern") },
                    colors = hiveLimeFilterChipColors()
                )
                FilterChip(
                    selected = schedulingMode == SchedulingMode.OPEN,
                    onClick = { schedulingMode = SchedulingMode.OPEN },
                    label = { Text("Open availability") },
                    colors = hiveLimeFilterChipColors()
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            when (schedulingMode) {
                SchedulingMode.SPECIFIC -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickableNoRipple { showDatePicker = true }
                    ) {
                        OutlinedTextField(
                            value = specificDateLabel,
                            onValueChange = {},
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Date") },
                            placeholder = { Text("Select a date") },
                            singleLine = true,
                            readOnly = true,
                            enabled = false,
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickableNoRipple { timeSlotDialogFor = SchedulingMode.SPECIFIC }
                    ) {
                        OutlinedTextField(
                            value = specificTimeHHmm,
                            onValueChange = {},
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Time") },
                            placeholder = { Text("HH:mm") },
                            singleLine = true,
                            readOnly = true,
                            enabled = false,
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
                SchedulingMode.RECURRING -> {
                    Text(
                        text = "Repeat on",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        weekDaysOrdered.forEach { day ->
                            val selected = day in recurringDays
                            FilterChip(
                                selected = selected,
                                onClick = {
                                    recurringDays = if (selected) recurringDays - day else recurringDays + day
                                },
                                label = { Text(day.take(3)) },
                                colors = hiveLimeFilterChipColors()
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickableNoRipple { timeSlotDialogFor = SchedulingMode.RECURRING }
                    ) {
                        OutlinedTextField(
                            value = recurringTimeHHmm,
                            onValueChange = {},
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Time") },
                            placeholder = { Text("Select a time") },
                            singleLine = true,
                            readOnly = true,
                            enabled = false,
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
                SchedulingMode.OPEN -> {
                    OutlinedTextField(
                        value = openAvailabilityText,
                        onValueChange = { openAvailabilityText = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Describe your availability") },
                        placeholder = { Text("e.g. weekday evenings, weekends…") },
                        minLines = 3,
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (!isRemote) {
                // Map location selection (specific location)
                Text(
                    text = "Specific location",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))

                val canUseMyLocation = locationPermissionGranted && userLat != null && userLon != null

                OutlinedTextField(
                    value = locationNameText,
                    onValueChange = { locationNameText = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Location name") },
                    placeholder = { Text("Tap the map or use my location") },
                    singleLine = false,
                    minLines = 1,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = {
                            if (!canUseMyLocation) {
                                onRequestLocationPermission()
                                onRefreshLocation()
                                return@OutlinedButton
                            }
                            selectedLat = userLat!!
                            selectedLon = userLon!!

                            scope.launch {
                                val resolved = withContext(Dispatchers.IO) {
                                    reverseGeocodeAddress(context, selectedLat, selectedLon)
                                }
                                locationNameText = resolved ?: "%.5f, %.5f".format(selectedLat, selectedLon)
                            }
                        },
                        enabled = !isLoading
                    ) {
                        Text("Use my location")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                val offerPin = context.getDrawable(com.hive.hive_app.R.drawable.ic_map_pin_offer)
                val needPin = context.getDrawable(com.hive.hive_app.R.drawable.ic_map_pin_need)

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    AndroidView(
                        modifier = Modifier
                            .fillMaxSize()
                            .focusable(false),
                        factory = { ctx ->
                            Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
                            MapView(ctx).apply {
                                isFocusable = false
                                isFocusableInTouchMode = false
                                setTileSource(
                                    org.osmdroid.tileprovider.tilesource.XYTileSource(
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
                                controller.setZoom(14.0)
                            }.also { map ->
                                map.setOnTouchListener { _, event ->
                                    if (event.action == MotionEvent.ACTION_UP) {
                                        val projected = map.projection
                                        val geoPoint = projected.fromPixels(event.x.toInt(), event.y.toInt())
                                        selectedLat = geoPoint.latitude
                                        selectedLon = geoPoint.longitude
                                        locationNameText = "%.5f, %.5f".format(selectedLat, selectedLon)

                                        scope.launch {
                                            val resolved = withContext(Dispatchers.IO) {
                                                reverseGeocodeAddress(context, selectedLat, selectedLon)
                                            }
                                            if (resolved != null) locationNameText = resolved
                                        }

                                        map.invalidate()
                                        true
                                    } else {
                                        false
                                    }
                                }
                            }
                        },
                        update = { map ->
                            val key = "${selectedLat}_${selectedLon}_$serviceType"
                            if (mapOverlayLastKey.value == key) return@AndroidView
                            mapOverlayLastKey.value = key

                            val markerIcon = if (serviceType == "offer") offerPin else needPin
                            map.overlays.clear()

                            val marker = Marker(map).apply {
                                position = GeoPoint(selectedLat, selectedLon)
                                setAnchor(Marker.ANCHOR_BOTTOM, Marker.ANCHOR_CENTER)
                                if (markerIcon != null) setIcon(markerIcon.mutate())
                                // No map marker title - location should only be in the textbox.
                                title = ""
                            }
                            map.overlays.add(marker)

                            map.controller.setCenter(GeoPoint(selectedLat, selectedLon))
                            map.invalidate()
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Images
            Text(
                text = "Images",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { pickImagesLauncher.launch("image/*") },
                    enabled = !isLoading
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add images")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add images")
                }
                if (selectedImageUris.isNotEmpty()) {
                    OutlinedButton(
                        onClick = { selectedImageUris = emptyList() },
                        enabled = !isLoading,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Clear new (${selectedImageUris.size})")
                    }
                }
            }

            if (existingServerImageUrls.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(existingServerImageUrls, key = { it }) { url ->
                        Box(modifier = Modifier.size(72.dp)) {
                            AsyncImage(
                                model = ImageRequest.Builder(context).data(url).crossfade(true).build(),
                                contentDescription = "Existing image",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                            )
                            IconButton(
                                onClick = {
                                    existingServerImageUrls = existingServerImageUrls.filterNot { it == url }
                                },
                                enabled = !isLoading,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(28.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Close,
                                    contentDescription = "Remove image",
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }

            if (selectedImageUris.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(selectedImageUris, key = { it.toString() }) { uri ->
                        AsyncImage(
                            model = ImageRequest.Builder(context).data(uri).crossfade(true).build(),
                            contentDescription = "Selected image",
                            modifier = Modifier
                                .size(72.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                        )
                    }
                }
            }

            if (localError != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(localError!!, color = MaterialTheme.colorScheme.error)
            }
            if (vmError != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(vmError!!, color = MaterialTheme.colorScheme.error)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    localError = null

                    val parsedDuration = estimatedDurationText.trim().toDoubleOrNull()
                    if (title.isBlank()) {
                        localError = "Title is required"
                        return@Button
                    }
                    if (description.isBlank()) {
                        localError = "Description is required"
                        return@Button
                    }
                    if (description.trim().length <= 10) {
                        localError = "Description must be more than 10 characters"
                        return@Button
                    }
                    if (parsedDuration == null || parsedDuration <= 0.0) {
                        localError = "Estimated duration must be a positive number"
                        return@Button
                    }
                    val maxParticipants = maxParticipantsText.trim().toIntOrNull()
                    if (maxParticipants == null || maxParticipants <= 0) {
                        localError = "Max participants must be at least 1"
                        return@Button
                    }

                    val tags = selectedTags.map {
                        TagDto(
                            entityId = it.id,
                            label = it.label,
                            aliases = emptyList()
                        )
                    }

                    val location = LocationDto(
                        latitude = selectedLat,
                        longitude = selectedLon,
                        address = locationNameText.takeIf { it.isNotBlank() }
                    )

                    when (schedulingMode) {
                        SchedulingMode.SPECIFIC -> {
                            if (specificDateMillis == null) {
                                localError = "Select a date for the service"
                                return@Button
                            }
                        }
                        SchedulingMode.RECURRING -> {
                            if (recurringDays.isEmpty()) {
                                localError = "Select at least one weekday"
                                return@Button
                            }
                        }
                        SchedulingMode.OPEN -> {
                            if (openAvailabilityText.isBlank()) {
                                localError = "Describe your open availability"
                                return@Button
                            }
                        }
                    }

                    val schedulingTypeStr = when (schedulingMode) {
                        SchedulingMode.SPECIFIC -> "specific"
                        SchedulingMode.RECURRING -> "recurring"
                        SchedulingMode.OPEN -> "open"
                    }
                    val specificDateStr = if (schedulingMode == SchedulingMode.SPECIFIC) {
                        specificDateMillis?.let {
                            val localDate = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).toLocalDate()
                            localDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                        }
                    } else null
                    val specificTimeStr =
                        if (schedulingMode == SchedulingMode.SPECIFIC) specificTimeHHmm else null
                    val recurringPatternDto = if (schedulingMode == SchedulingMode.RECURRING) {
                        RecurringPatternDto(
                            days = weekDaysOrdered.filter { it in recurringDays },
                            time = recurringTimeHHmm
                        )
                    } else null
                    val openAvailStr =
                        if (schedulingMode == SchedulingMode.OPEN) openAvailabilityText.trim() else null

                    val editId = editServiceId
                    if (editId != null) {
                        viewModel.updateService(
                            serviceId = editId,
                            existingImageUrls = existingServerImageUrls,
                            title = title.trim(),
                            description = description.trim(),
                            category = null,
                            tags = tags,
                            estimatedDuration = parsedDuration,
                            location = location,
                            deadline = null,
                            isRemote = isRemote,
                            imageUris = selectedImageUris,
                            schedulingType = schedulingTypeStr,
                            specificDate = specificDateStr,
                            specificTime = specificTimeStr,
                            recurringPattern = recurringPatternDto,
                            openAvailability = openAvailStr,
                            onResult = { success, err ->
                                if (success) onCreated(editId)
                                else localError = err ?: "Failed to update service"
                            }
                        )
                    } else {
                        viewModel.createService(
                            title = title.trim(),
                            description = description.trim(),
                            category = null,
                            tags = tags,
                            estimatedDuration = parsedDuration,
                            location = location,
                            serviceType = serviceType,
                            maxParticipants = maxParticipants,
                            deadline = null,
                            isRemote = isRemote,
                            imageUris = selectedImageUris,
                            schedulingType = schedulingTypeStr,
                            specificDate = specificDateStr,
                            specificTime = specificTimeStr,
                            recurringPattern = recurringPatternDto,
                            openAvailability = openAvailStr,
                            onResult = { success, created, err ->
                                if (success && created != null) onCreated(created._id)
                                else localError = err ?: "Failed to create service"
                            }
                        )
                    }
                },
                enabled = !isLoading && selectedTags.isNotEmpty(),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(if (editServiceId != null) "Save" else "Create")
                }
            }
        }

        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let { specificDateMillis = it }
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

        val slotTarget = timeSlotDialogFor
        val timePickerState = rememberTimePickerState(
            initialHour = 9,
            initialMinute = 0,
            is24Hour = true
        )
        LaunchedEffect(slotTarget) {
            val (h, m) = when (slotTarget) {
                SchedulingMode.SPECIFIC -> parseHHmm(specificTimeHHmm)
                SchedulingMode.RECURRING -> parseHHmm(recurringTimeHHmm)
                else -> parseHHmm("09:00")
            }
            timePickerState.hour = h
            timePickerState.minute = m
        }
        if (slotTarget != null) {
            AlertDialog(
                onDismissRequest = { timeSlotDialogFor = null },
                title = { Text("Select time") },
                text = {
                    TimePicker(state = timePickerState)
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            val slot = "%02d:%02d".format(timePickerState.hour, timePickerState.minute)
                            when (slotTarget) {
                                SchedulingMode.SPECIFIC -> specificTimeHHmm = slot
                                SchedulingMode.RECURRING -> recurringTimeHHmm = slot
                                else -> {}
                            }
                            timeSlotDialogFor = null
                        }
                    ) { Text("OK") }
                },
                dismissButton = {
                    TextButton(onClick = { timeSlotDialogFor = null }) { Text("Cancel") }
                }
            )
        }
    }
}

private fun reverseGeocodeAddress(context: Context, latitude: Double, longitude: Double): String? {
    return try {
        val geocoder = Geocoder(context, Locale.getDefault())
        val results = geocoder.getFromLocation(latitude, longitude, 1)
        val addr = results?.firstOrNull() ?: return null
        val line = addr.getAddressLine(0)
        line?.takeIf { it.isNotBlank() }
    } catch (_: IOException) {
        null
    } catch (_: Exception) {
        null
    }
}

// Small helper so we don't need Ripples everywhere.
private fun Modifier.clickableNoRipple(onClick: () -> Unit): Modifier =
    this.clickable(onClick = onClick)

