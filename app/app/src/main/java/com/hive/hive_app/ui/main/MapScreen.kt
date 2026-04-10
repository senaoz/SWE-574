package com.hive.hive_app.ui.main

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.border
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.EditCalendar
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.WbCloudy
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material.icons.outlined.Nightlight
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import com.hive.hive_app.data.api.dto.ServiceResponse
import androidx.activity.compose.LocalActivity
import androidx.activity.compose.BackHandler
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.TypedValue
import android.graphics.Point
import android.view.Gravity
import android.view.View
import android.os.Handler
import android.os.Looper
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.events.MapListener
import org.osmdroid.events.ScrollEvent
import org.osmdroid.events.ZoomEvent
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Overlay
import org.osmdroid.views.overlay.Polygon
import org.osmdroid.views.overlay.infowindow.BasicInfoWindow
import org.osmdroid.views.overlay.infowindow.InfoWindow
import java.time.temporal.ChronoUnit
import java.util.Calendar
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Bubble tap opens detail; empty-map tap closes via [MapEventsOverlay] (not MapView touch listener).
 *
 * [BasicInfoWindow] installs [View.setOnTouchListener] in its constructor to close on ACTION_UP and
 * consume the event, which blocks [View.setOnClickListener]; clear it so bubble taps work.
 */
private class MapBubbleInfoWindow(
    layoutResId: Int,
    mapView: MapView,
    private val onBubbleTap: (Marker) -> Unit
) : BasicInfoWindow(layoutResId, mapView) {
    init {
        mView.setOnTouchListener(null)
    }

    override fun onOpen(item: Any?) {
        super.onOpen(item)
        val marker = item as? Marker ?: return
        mView.setOnClickListener { onBubbleTap(marker) }
    }

    override fun onClose() {
        mView.setOnClickListener(null)
        super.onClose()
    }
}

/** Soft pulsing rings under the “You” marker. */
private class UserLocationPulseOverlay(
    private val geoPoint: GeoPoint
) : Overlay() {
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    override fun draw(canvas: Canvas, mapView: MapView, shadow: Boolean) {
        val p = Point()
        mapView.projection.toPixels(geoPoint, p)
        val t = (System.currentTimeMillis() % 1800L) / 1800.0
        val pulse = sin(t * kotlin.math.PI * 2) * 0.5 + 0.5
        val rOuter = (22f + pulse * 38f).toFloat()
        val alphaOuter = (35 + pulse * 55).toInt().coerceIn(0, 120)
        ringPaint.color = AndroidColor.argb(alphaOuter, 33, 150, 243)
        canvas.drawCircle(p.x.toFloat(), p.y.toFloat(), rOuter, ringPaint)
        val rInner = rOuter * 0.55f
        val alphaInner = (alphaOuter * 0.45f).toInt().coerceIn(0, 80)
        ringPaint.color = AndroidColor.argb(alphaInner, 100, 181, 246)
        canvas.drawCircle(p.x.toFloat(), p.y.toFloat(), rInner, ringPaint)
    }
}

/** Forum events — map emoji. */
private const val MAP_MARKER_EMOJI_EVENT = "🗺️"

/** Offers — hand emoji. */
private const val MAP_MARKER_EMOJI_OFFER = "✋"

/** Needs — palm-up “gives” hand. */
private const val MAP_MARKER_EMOJI_NEED = "🫴"

/** Approximate area shown instead of exact coordinates (meters). */
private const val PRIVACY_RADIUS_METERS = 450.0

private enum class MapMarkerKind {
    EVENT,
    OFFER,
    NEED
}

private fun markerCircleFillColor(kind: MapMarkerKind): Int = when (kind) {
    MapMarkerKind.EVENT -> AndroidColor.parseColor("#7B1FA2")
    MapMarkerKind.OFFER -> AndroidColor.parseColor("#2E7D32")
    MapMarkerKind.NEED -> AndroidColor.parseColor("#FF9800")
}

/** Translucent fill + outline for privacy [Polygon] (ARGB). */
private fun privacyPolygonPaints(kind: MapMarkerKind): Pair<Int, Int> = when (kind) {
    MapMarkerKind.EVENT -> Pair(
        AndroidColor.argb(55, 171, 71, 188),
        AndroidColor.argb(220, 156, 39, 176)
    )
    MapMarkerKind.OFFER -> Pair(
        AndroidColor.argb(55, 76, 175, 80),
        AndroidColor.argb(220, 56, 142, 60)
    )
    MapMarkerKind.NEED -> Pair(
        AndroidColor.argb(55, 255, 152, 0),
        AndroidColor.argb(220, 245, 124, 0)
    )
}

private fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val r = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c
}

/**
 * Emoji centered in a solid colored circle (marker icon). No outer stroke.
 * Privacy radius on the map is drawn separately as a [Polygon] overlay.
 */
private fun emojiInPrivacyCircleMarkerDrawable(
    context: android.content.Context,
    emoji: String,
    fillColor: Int,
    sizeDp: Float = 44f
): Drawable {
    val dm = context.resources.displayMetrics
    val density = dm.density
    val sizePx = (sizeDp * density).toInt().coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val cx = sizePx / 2f
    val cy = sizePx / 2f
    val outerR = sizePx / 2f - 1f * density

    val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = fillColor
    }
    canvas.drawCircle(cx, cy, outerR, fillPaint)

    val tv = TextView(context).apply {
        text = emoji
        includeFontPadding = false
        setTextSize(TypedValue.COMPLEX_UNIT_PX, sizePx * 0.40f)
        gravity = Gravity.CENTER
        measure(
            View.MeasureSpec.makeMeasureSpec(sizePx, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(sizePx, View.MeasureSpec.EXACTLY)
        )
        layout(0, 0, measuredWidth, measuredHeight)
    }
    tv.draw(canvas)
    return BitmapDrawable(context.resources, bitmap)
}

private fun privacyRadiusPolygon(lat: Double, lon: Double, density: Float, kind: MapMarkerKind): Polygon {
    val center = GeoPoint(lat, lon)
    val (fillArgb, outlineArgb) = privacyPolygonPaints(kind)
    return Polygon().apply {
        setPoints(Polygon.pointsAsCircle(center, PRIVACY_RADIUS_METERS))
        fillPaint.color = fillArgb
        outlinePaint.color = outlineArgb
        outlinePaint.strokeWidth = 2.5f * density
        setOnClickListener { _, _, _ -> false }
    }
}

@Composable
fun MapScreen(
    modifier: Modifier = Modifier,
    viewModel: MapViewModel = androidx.hilt.navigation.compose.hiltViewModel(),
    onServiceSelected: ((String) -> Unit)? = null,
    onStartChat: ((String) -> Unit)? = null,
    onOpenUserProfile: ((String) -> Unit)? = null
) {
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    var selectedForumEventId by remember { mutableStateOf<String?>(null) }
    var showCreateServiceScreen by remember { mutableStateOf(false) }
    var editServiceId by remember { mutableStateOf<String?>(null) }
    var manageRequestsServiceId by remember { mutableStateOf<String?>(null) }
    var completeServiceRatingArgs by remember { mutableStateOf<CompleteServiceRatingArgs?>(null) }
    val detailViewModel: ServiceDetailViewModel = androidx.hilt.navigation.compose.hiltViewModel()
    val activeItemsVm: ActiveItemsViewModel = androidx.hilt.navigation.compose.hiltViewModel()
    val context = LocalContext.current
    val emojiMarkerCache = remember { mutableMapOf<String, Drawable>() }
    fun markerIcon(emoji: String, kind: MapMarkerKind): Drawable {
        return emojiMarkerCache.getOrPut("${emoji}_${kind.name}") {
            emojiInPrivacyCircleMarkerDrawable(context, emoji, markerCircleFillColor(kind))
        }
    }
    val lifecycleOwner = LocalLifecycleOwner.current
    val state by viewModel.state.collectAsState()
    val scope = rememberCoroutineScope()
    var showFilters by remember { mutableStateOf(false) }
    var didInitialCenter by remember { mutableStateOf(false) }
    var nearMeCenterNonce by remember { mutableStateOf(0) }

    BackHandler(
        enabled = completeServiceRatingArgs != null ||
            manageRequestsServiceId != null ||
            showCreateServiceScreen ||
            selectedServiceId != null ||
            selectedForumEventId != null
    ) {
        when {
            completeServiceRatingArgs != null -> completeServiceRatingArgs = null
            manageRequestsServiceId != null -> manageRequestsServiceId = null
            showCreateServiceScreen -> {
                showCreateServiceScreen = false
                editServiceId = null
            }
            selectedForumEventId != null -> selectedForumEventId = null
            selectedServiceId != null -> selectedServiceId = null
        }
    }

    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
    ) { granted ->
        viewModel.setLocationPermissionGranted(granted)
    }

    completeServiceRatingArgs?.let { args ->
        key(args.transactionId) {
            CompleteServiceRatingScreen(
                args = args,
                onBack = { completeServiceRatingArgs = null },
                onSuccess = {
                    completeServiceRatingArgs = null
                    viewModel.loadServices()
                },
                viewModel = activeItemsVm
            )
        }
        return
    }

    manageRequestsServiceId?.let { mrId ->
        key(mrId) {
            ManageServiceScreen(
                serviceId = mrId,
                onBack = { manageRequestsServiceId = null },
                onOpenUserProfile = onOpenUserProfile,
                onStartChat = onStartChat,
                onNavigateToCompleteRating = { args ->
                    completeServiceRatingArgs = args
                },
                onEditService = { sid ->
                    manageRequestsServiceId = null
                    editServiceId = sid
                    showCreateServiceScreen = true
                }
            )
        }
        return
    }

    selectedForumEventId?.let { eid ->
        key(eid) {
            val forumVm: ForumViewModel = androidx.hilt.navigation.compose.hiltViewModel()
            LaunchedEffect(eid) { forumVm.loadEvent(eid) }
            ForumEventDetailContent(
                viewModel = forumVm,
                onBack = {
                    forumVm.clearEventDetail()
                    selectedForumEventId = null
                },
                modifier = modifier
            )
        }
        return
    }

    if (showCreateServiceScreen) {
        CreateServiceScreen(
            modifier = modifier.fillMaxSize(),
            editServiceId = editServiceId,
            userLat = state.userLat,
            userLon = state.userLon,
            locationPermissionGranted = state.locationPermissionGranted,
            onRequestLocationPermission = {
                permissionLauncher.launch(android.Manifest.permission.ACCESS_COARSE_LOCATION)
            },
            onRefreshLocation = { viewModel.refreshLocation() },
            onBack = {
                showCreateServiceScreen = false
                editServiceId = null
            },
            onCreated = { serviceId ->
                showCreateServiceScreen = false
                editServiceId = null
                viewModel.loadServices()
                selectedServiceId = serviceId
            }
        )
        return
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
            onOpenUserProfile = onOpenUserProfile,
            onManageJoinRequests = {
                manageRequestsServiceId = id
                selectedServiceId = null
            }
        )
        return
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
        if (state.locationPermissionGranted) viewModel.refreshLocation() else viewModel.loadServices()
        viewModel.loadEvents()
    }

    var mapView by remember { mutableStateOf<MapView?>(null) }
    val activity = LocalActivity.current
    SideEffect {
        activity?.window?.statusBarColor = android.graphics.Color.WHITE
        activity?.window?.decorView?.systemUiVisibility = activity?.window?.decorView?.systemUiVisibility?.or(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) ?: 0
    }
    DisposableEffect(Unit) {
        onDispose {
            activity?.window?.statusBarColor = android.graphics.Color.TRANSPARENT
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        // Map first so it stays behind the bar
        AndroidView(
            factory = {
                Configuration.getInstance().load(it, it.getSharedPreferences("osmdroid", android.content.Context.MODE_PRIVATE))
                MapView(it).apply {
                    id = android.R.id.content
                    setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null)
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
                // Last in hit-test order: dismiss bubbles on background tap without stealing marker/bubble taps.
                map.overlays.add(
                    0,
                    MapEventsOverlay(
                        object : MapEventsReceiver {
                            override fun singleTapConfirmedHelper(p: GeoPoint): Boolean {
                                InfoWindow.closeAllInfoWindowsOn(map)
                                return false
                            }

                            override fun longPressHelper(p: GeoPoint): Boolean = false
                        }
                    )
                )
                val density = context.resources.displayMetrics.density
                // Privacy radius first (drawn under markers)
                state.services.forEach { service ->
                    service.location ?: return@forEach
                    val kind = if (service.serviceType == "offer") MapMarkerKind.OFFER else MapMarkerKind.NEED
                    map.overlays.add(
                        privacyRadiusPolygon(service.location.latitude, service.location.longitude, density, kind)
                    )
                }
                state.events.forEach { event ->
                    val lat = event.latitude ?: return@forEach
                    val lon = event.longitude ?: return@forEach
                    map.overlays.add(privacyRadiusPolygon(lat, lon, density, MapMarkerKind.EVENT))
                }
                fun openDetailForServiceOrEventMarker(marker: Marker) {
                    when (val rel = marker.relatedObject as? String) {
                        null -> { }
                        else -> {
                            when {
                                rel.startsWith("service:") -> {
                                    val id = rel.removePrefix("service:")
                                    if (onServiceSelected != null) onServiceSelected(id) else selectedServiceId = id
                                }
                                rel.startsWith("event:") -> {
                                    selectedForumEventId = rel.removePrefix("event:")
                                }
                            }
                        }
                    }
                    InfoWindow.closeAllInfoWindowsOn(map)
                }
                val bubbleWindow = MapBubbleInfoWindow(
                    com.hive.hive_app.R.layout.map_info_window,
                    map
                ) { marker -> openDetailForServiceOrEventMarker(marker) }
                state.services.forEach { service ->
                    service.location ?: return@forEach
                    val markerKind = if (service.serviceType == "offer") MapMarkerKind.OFFER else MapMarkerKind.NEED
                    val emoji = if (service.serviceType == "offer") MAP_MARKER_EMOJI_OFFER else MAP_MARKER_EMOJI_NEED
                    val icon = markerIcon(emoji, markerKind)
                    val tagsText = service.tags.joinToString(", ") { it.label ?: it.name ?: "" }.takeIf { it.isNotBlank() } ?: ""
                    val marker = Marker(map).apply {
                        position = GeoPoint(service.location.latitude, service.location.longitude)
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        setIcon(icon)
                        title = service.title
                        snippet = tagsText
                        relatedObject = "service:${service._id}"
                        setInfoWindow(bubbleWindow)
                        setOnMarkerClickListener { m, _ ->
                            val sameMarkerOpen =
                                bubbleWindow.isOpen && bubbleWindow.relatedObject === m
                            if (sameMarkerOpen) {
                                openDetailForServiceOrEventMarker(m)
                            } else {
                                m.showInfoWindow()
                            }
                            true
                        }
                    }
                    map.overlays.add(marker)
                }
                state.events.forEach { event ->
                    val lat = event.latitude ?: return@forEach
                    val lon = event.longitude ?: return@forEach
                    val tagsText = event.tags?.joinToString(", ") { it.label ?: it.name ?: "" }
                        ?.takeIf { it.isNotBlank() }
                        ?: ""
                    val marker = Marker(map).apply {
                        position = GeoPoint(lat, lon)
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        setIcon(markerIcon(MAP_MARKER_EMOJI_EVENT, MapMarkerKind.EVENT))
                        title = event.title
                        snippet = tagsText
                        relatedObject = "event:${event.id}"
                        setInfoWindow(bubbleWindow)
                        setOnMarkerClickListener { m, _ ->
                            val sameMarkerOpen =
                                bubbleWindow.isOpen && bubbleWindow.relatedObject === m
                            if (sameMarkerOpen) {
                                openDetailForServiceOrEventMarker(m)
                            } else {
                                m.showInfoWindow()
                            }
                            true
                        }
                    }
                    map.overlays.add(marker)
                }
                if (state.userLat != null && state.userLon != null) {
                    val gp = GeoPoint(state.userLat!!, state.userLon!!)
                    map.overlays.add(UserLocationPulseOverlay(gp))
                    val myIcon = ContextCompat.getDrawable(context, com.hive.hive_app.R.drawable.ic_my_location)
                    val userMarker = Marker(map).apply {
                        position = gp
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        setIcon(myIcon)
                        title = "You"
                    }
                    map.overlays.add(userMarker)
                }
                // IMPORTANT: do not auto-recenter on recompositions; it breaks panning.
                map.invalidate()
            }
        )
        val mapViewRef = mapView

        DisposableEffect(mapViewRef, state.userLat, state.userLon) {
            val map = mapViewRef ?: return@DisposableEffect onDispose { }
            val handler = Handler(Looper.getMainLooper())
            val invalidator = object : Runnable {
                override fun run() {
                    map.invalidate()
                    handler.postDelayed(this, 50)
                }
            }
            if (state.userLat != null && state.userLon != null) {
                handler.post(invalidator)
            }
            onDispose {
                handler.removeCallbacks(invalidator)
            }
        }

        // Center the map once at first load (or when "Near me" is explicitly enabled).
        LaunchedEffect(mapViewRef, state.userLat, state.userLon, state.services.size) {
            val map = mapViewRef ?: return@LaunchedEffect
            if (didInitialCenter) return@LaunchedEffect

            when {
                state.userLat != null && state.userLon != null -> {
                    map.controller.setCenter(GeoPoint(state.userLat!!, state.userLon!!))
                    map.controller.setZoom(12.0)
                    didInitialCenter = true
                }
                state.services.isNotEmpty() -> {
                    val points = state.services.mapNotNull { it.location?.let { loc -> GeoPoint(loc.latitude, loc.longitude) } }
                    if (points.size == 1) {
                        map.controller.setCenter(points[0])
                        map.controller.setZoom(14.0)
                    } else if (points.isNotEmpty()) {
                        val box = BoundingBox.fromGeoPoints(points)
                        map.zoomToBoundingBox(box, false, 100)
                    }
                    didInitialCenter = true
                }
                else -> {
                    map.controller.setCenter(GeoPoint(39.0, 32.0))
                    map.controller.setZoom(4.0)
                    didInitialCenter = true
                }
            }
        }

        LaunchedEffect(mapViewRef, nearMeCenterNonce, state.userLat, state.userLon) {
            val map = mapViewRef ?: return@LaunchedEffect
            if (state.userLat == null || state.userLon == null) return@LaunchedEffect
            map.controller.setCenter(GeoPoint(state.userLat!!, state.userLon!!))
            map.controller.setZoom(15.0)
        }

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

        // Track viewport for bottom list (debounced)
        var viewportJob by remember { mutableStateOf<Job?>(null) }
        DisposableEffect(mapViewRef) {
            val map = mapViewRef
            if (map != null) {
                val listener = object : MapListener {
                    override fun onScroll(event: ScrollEvent?): Boolean {
                        viewportJob?.cancel()
                        viewportJob = scope.launch {
                            delay(150)
                            val bb = map.boundingBox
                            viewModel.setViewport(
                                MapViewModel.ViewportBounds(
                                    northLat = bb.latNorth,
                                    southLat = bb.latSouth,
                                    eastLon = bb.lonEast,
                                    westLon = bb.lonWest
                                )
                            )
                        }
                        return false
                    }

                    override fun onZoom(event: ZoomEvent?): Boolean = onScroll(null)
                }
                map.addMapListener(listener)
                // initial
                scope.launch {
                    delay(250)
                    val bb = map.boundingBox
                    viewModel.setViewport(
                        MapViewModel.ViewportBounds(
                            northLat = bb.latNorth,
                            southLat = bb.latSouth,
                            eastLon = bb.lonEast,
                            westLon = bb.lonWest
                        )
                    )
                }
                onDispose {
                    viewportJob?.cancel()
                    map.removeMapListener(listener)
                }
            } else {
                onDispose { }
            }
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

        // Top bar drawn on top of map so it never gets covered
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
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
                        IconButton(
                            onClick = {
                                viewModel.requestFreshLocationForCenter()
                                nearMeCenterNonce++
                            }
                        ) {
                            Icon(Icons.Filled.MyLocation, contentDescription = "Near me")
                        }
                    }
                    Spacer(modifier = Modifier.weight(1f))
                    IconButton(onClick = { showFilters = true }) {
                        Icon(Icons.Filled.Tune, contentDescription = "Filters")
                    }
                }

                val filterSummary = remember(state.filterTimeOfDay, state.filterDate) {
                    val timeLabel = when (state.filterTimeOfDay) {
                        MapViewModel.TimeOfDayFilter.ANYTIME -> "Any time"
                        MapViewModel.TimeOfDayFilter.MORNING -> "Morning"
                        MapViewModel.TimeOfDayFilter.AFTERNOON -> "Afternoon"
                        MapViewModel.TimeOfDayFilter.EVENING -> "Evening"
                        MapViewModel.TimeOfDayFilter.NIGHT -> "Night"
                    }
                    val dateLabel = when (val df = state.filterDate) {
                        MapViewModel.DateFilter.ANYTIME -> "Anytime"
                        MapViewModel.DateFilter.TODAY -> "Today"
                        MapViewModel.DateFilter.TOMORROW -> "Tomorrow"
                        MapViewModel.DateFilter.WEEKEND -> "Weekend"
                        MapViewModel.DateFilter.NEXT_WEEKEND -> "Next weekend"
                        is MapViewModel.DateFilter.SPECIFIC -> df.date.toString()
                    }
                    "Date: $dateLabel   Time of day: $timeLabel"
                }
                Text(
                    text = filterSummary,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Bottom list (viewport only): services the user sees right now
        if (state.viewport != null && state.visibleServices.isNotEmpty()) {
            val lime = Color(0xFFB7FF00)
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 210.dp)
                        .padding(vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(items = state.visibleServices, key = { it._id }) { service ->
                            val dist = if (state.userLat != null && state.userLon != null && service.location != null) {
                                distanceKm(state.userLat!!, state.userLon!!, service.location.latitude, service.location.longitude)
                            } else null
                            MapServiceCarouselCard(
                                service = service,
                                distanceKm = dist,
                                lime = lime,
                                onClick = {
                                    if (onServiceSelected != null) onServiceSelected.invoke(service._id)
                                    else selectedServiceId = service._id
                                }
                            )
                        }
                    }
                }
            }
        }

        if (state.error != null) {
            Card(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .padding(top = 80.dp),
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

        if (showFilters) {
            MapFilterSheet(
                selectedTimeOfDay = state.filterTimeOfDay,
                selectedDateFilter = state.filterDate,
                onDismiss = { showFilters = false },
                onApply = { time, date ->
                    viewModel.setFilters(time, date)
                    showFilters = false
                }
            )
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun MapFilterSheet(
    selectedTimeOfDay: MapViewModel.TimeOfDayFilter,
    selectedDateFilter: MapViewModel.DateFilter,
    onDismiss: () -> Unit,
    onApply: (MapViewModel.TimeOfDayFilter, MapViewModel.DateFilter) -> Unit
) {
    val context = LocalContext.current
    var time by remember { mutableStateOf(selectedTimeOfDay) }
    var dateFilter by remember { mutableStateOf(selectedDateFilter) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Filters", style = MaterialTheme.typography.titleMedium)

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Time of day", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.ANYTIME,
                        onClick = { time = MapViewModel.TimeOfDayFilter.ANYTIME },
                        label = { Text("Any time") },
                        leadingIcon = { Icon(Icons.Outlined.Schedule, contentDescription = null) }
                    )
                    FilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.MORNING,
                        onClick = { time = MapViewModel.TimeOfDayFilter.MORNING },
                        label = { Text("Morning") },
                        leadingIcon = { Icon(Icons.Outlined.WbSunny, contentDescription = null) }
                    )
                    FilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.AFTERNOON,
                        onClick = { time = MapViewModel.TimeOfDayFilter.AFTERNOON },
                        label = { Text("Afternoon") },
                        leadingIcon = { Icon(Icons.Outlined.WbCloudy, contentDescription = null) }
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.EVENING,
                        onClick = { time = MapViewModel.TimeOfDayFilter.EVENING },
                        label = { Text("Evening") },
                        leadingIcon = { Icon(Icons.Outlined.Nightlight, contentDescription = null) }
                    )
                    FilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.NIGHT,
                        onClick = { time = MapViewModel.TimeOfDayFilter.NIGHT },
                        label = { Text("Night") },
                        leadingIcon = { Icon(Icons.Outlined.DarkMode, contentDescription = null) }
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Date", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.ANYTIME,
                        onClick = { dateFilter = MapViewModel.DateFilter.ANYTIME },
                        label = { Text("Anytime") },
                        leadingIcon = { Icon(Icons.Outlined.Event, contentDescription = null) }
                    )
                    FilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.TODAY,
                        onClick = { dateFilter = MapViewModel.DateFilter.TODAY },
                        label = { Text("Today") },
                        leadingIcon = { Icon(Icons.Outlined.CalendarToday, contentDescription = null) }
                    )
                    FilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.TOMORROW,
                        onClick = { dateFilter = MapViewModel.DateFilter.TOMORROW },
                        label = { Text("Tomorrow") },
                        leadingIcon = { Icon(Icons.Outlined.CalendarToday, contentDescription = null) }
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.WEEKEND,
                        onClick = { dateFilter = MapViewModel.DateFilter.WEEKEND },
                        label = { Text("Weekend") },
                        leadingIcon = { Icon(Icons.Outlined.CalendarMonth, contentDescription = null) }
                    )
                    FilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.NEXT_WEEKEND,
                        onClick = { dateFilter = MapViewModel.DateFilter.NEXT_WEEKEND },
                        label = { Text("Next weekend") },
                        leadingIcon = { Icon(Icons.Outlined.CalendarMonth, contentDescription = null) }
                    )
                }
                FilterChip(
                    selected = dateFilter is MapViewModel.DateFilter.SPECIFIC,
                    onClick = {
                        val cal = Calendar.getInstance()
                        DatePickerDialog(
                            context,
                            { _, y, m, d ->
                                dateFilter = MapViewModel.DateFilter.SPECIFIC(LocalDate.of(y, m + 1, d))
                            },
                            cal.get(Calendar.YEAR),
                            cal.get(Calendar.MONTH),
                            cal.get(Calendar.DAY_OF_MONTH)
                        ).show()
                    },
                    label = {
                        val label = when (val df = dateFilter) {
                            MapViewModel.DateFilter.ANYTIME -> "Pick date"
                            MapViewModel.DateFilter.TODAY -> "Pick date"
                            MapViewModel.DateFilter.TOMORROW -> "Pick date"
                            MapViewModel.DateFilter.WEEKEND -> "Pick date"
                            MapViewModel.DateFilter.NEXT_WEEKEND -> "Pick date"
                            is MapViewModel.DateFilter.SPECIFIC -> df.date.toString()
                        }
                        Text(label)
                    },
                    leadingIcon = { Icon(Icons.Outlined.EditCalendar, contentDescription = null) }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = false,
                    onClick = {
                        time = MapViewModel.TimeOfDayFilter.ANYTIME
                        dateFilter = MapViewModel.DateFilter.ANYTIME
                    },
                    label = { Text("Clear") }
                )
                Card(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .clickable { onApply(time, dateFilter) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text(
                        text = "Apply",
                        color = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }

            Spacer(modifier = Modifier.size(1.dp))
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

@Composable
private fun MapServiceCarouselCard(
    service: ServiceResponse,
    distanceKm: Double?,
    lime: Color,
    onClick: () -> Unit
) {
    val relativeDay = serviceRelativeDayLabel(service)
    Card(
        modifier = Modifier
            .width(272.dp)
            .heightIn(min = 132.dp, max = 198.dp)
            .border(2.dp, lime, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            val img = service.imageUrls?.firstOrNull()
            if (!img.isNullOrBlank()) {
                AsyncImage(
                    model = img,
                    contentDescription = null,
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFFF2F2F2))
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = service.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Black,
                    maxLines = 1
                )
                if (service.tags.isNotEmpty()) {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        service.tags.forEach { tag ->
                            val label = tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: ""
                            if (label.isBlank()) return@forEach
                            Surface(
                                shape = RoundedCornerShape(percent = 50),
                                color = Color(0xFFE8E0F5)
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color(0xFF4A148C),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
                if (relativeDay != null) {
                    Text(
                        text = relativeDay,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF666666),
                        maxLines = 1
                    )
                }
                Text(
                    text = service.description.take(64) + if (service.description.length > 64) "…" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF333333),
                    maxLines = 2
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = service.serviceType,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF5E35B1)
                    )
                    if (distanceKm != null) {
                        Text(
                            text = "~${"%.1f".format(distanceKm)} km",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF666666)
                        )
                    }
                }
            }
        }
    }
}

/** Relative schedule from today using specificDate or deadline (yyyy-MM-dd prefix). */
private fun serviceRelativeDayLabel(service: ServiceResponse): String? {
    val today = LocalDate.now()
    val dateStr = service.specificDate?.takeIf { it.length >= 10 }?.substring(0, 10)
        ?: service.deadline?.takeIf { it.length >= 10 }?.substring(0, 10)
    val target = dateStr?.let { runCatching { LocalDate.parse(it) }.getOrNull() } ?: return null
    val days = ChronoUnit.DAYS.between(today, target)
    return when {
        days < 0 -> null
        days == 0L -> "Today"
        days == 1L -> "1 day later"
        else -> "$days days later"
    }
}
