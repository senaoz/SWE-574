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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsTopHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.border
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.FormatListBulleted
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import androidx.activity.compose.LocalActivity
import androidx.activity.compose.BackHandler
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.Point
import android.view.View
import android.os.Handler
import android.os.Looper
import androidx.annotation.DrawableRes
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
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
import org.osmdroid.views.CustomZoomButtonsController
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Overlay
import org.osmdroid.views.overlay.Polygon
import org.osmdroid.views.overlay.infowindow.BasicInfoWindow
import org.osmdroid.views.overlay.infowindow.InfoWindow
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
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

/** Typed payload stored in [Marker.relatedObject] so the InfoWindow can populate rich fields. */
private data class MarkerPayload(
    val navId: String,
    val service: ServiceResponse? = null,
    val event: ForumEventResponse? = null,
    val creator: CreatorInfo? = null
)

/**
 * Rich web-style popup InfoWindow.
 *
 * First tap on a marker opens this window.
 * Tap "View Details" navigates to the detail screen.
 * Tap "X" closes the window.
 *
 * [BasicInfoWindow] installs [View.setOnTouchListener] in its constructor; we clear it so
 * the individual button click listeners work properly.
 */
private class MapBubbleInfoWindow(
    layoutResId: Int,
    mapView: MapView,
    private val onViewDetails: (Marker) -> Unit
) : BasicInfoWindow(layoutResId, mapView) {

    init {
        mView.setOnTouchListener(null)
    }

    override fun onOpen(item: Any?) {
        super.onOpen(item)
        val marker = item as? Marker ?: return
        val payload = marker.relatedObject as? MarkerPayload
        val ctx = mView.context

        // Force fixed width — osmdroid can override XML layout_width
        val widthPx = (300 * ctx.resources.displayMetrics.density + 0.5f).toInt()
        mView.minimumWidth = widthPx
        mView.layoutParams = mView.layoutParams?.also { it.width = widthPx }
            ?: android.view.ViewGroup.LayoutParams(widthPx, android.view.ViewGroup.LayoutParams.WRAP_CONTENT)
        mView.requestLayout()

        mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_close_btn)
            ?.setOnClickListener { close() }

        mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_view_details)
            ?.setOnClickListener { onViewDetails(marker) }

        val typeBadge = mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_type_badge)
        val durationBadge = mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_duration_badge)
        val tagsScroll = mView.findViewById<android.widget.HorizontalScrollView>(com.hive.hive_app.R.id.bubble_tags_scroll)
        val tagsRow = mView.findViewById<android.widget.LinearLayout>(com.hive.hive_app.R.id.bubble_tags_row)
        val dateView = mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_date)

        fun dpToPx(dp: Int): Int = (dp * ctx.resources.displayMetrics.density + 0.5f).toInt()

        fun populateTags(tags: List<com.hive.hive_app.data.api.dto.TagDto>, chipBgRes: Int, chipTextColor: Int) {
            tagsRow?.removeAllViews()
            val validTags = tags.take(4).mapNotNull { tag ->
                (tag.label ?: tag.name ?: tag.entityId ?: tag.id)?.takeIf { it.isNotBlank() }
            }
            if (validTags.isEmpty()) {
                tagsScroll?.visibility = android.view.View.GONE
                return
            }
            validTags.forEach { label ->
                val chip = android.widget.TextView(ctx).apply {
                    text = label
                    textSize = 11f
                    setTextColor(chipTextColor)
                    setPadding(dpToPx(8), dpToPx(3), dpToPx(8), dpToPx(3))
                    setBackgroundResource(chipBgRes)
                    val lp = android.widget.LinearLayout.LayoutParams(
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
                    )
                    lp.marginEnd = dpToPx(6)
                    layoutParams = lp
                }
                tagsRow?.addView(chip)
            }
            tagsScroll?.visibility = android.view.View.VISIBLE
        }

        val usernameView = mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_username)
        val ratingView = mView.findViewById<android.widget.TextView>(com.hive.hive_app.R.id.bubble_rating)

        val userSection = mView.findViewById<android.widget.LinearLayout>(com.hive.hive_app.R.id.bubble_user_section)

        fun populateCreator(creator: CreatorInfo?) {
            val name = creator?.user?.username ?: creator?.user?.fullName
            val avg = creator?.rating
            if (name != null || avg != null) {
                userSection?.visibility = android.view.View.VISIBLE
                if (name != null) {
                    usernameView?.text = name
                    usernameView?.visibility = android.view.View.VISIBLE
                } else {
                    usernameView?.visibility = android.view.View.GONE
                }
                if (avg != null) {
                    ratingView?.text = "★ ${"%.1f".format(avg)}"
                    ratingView?.visibility = android.view.View.VISIBLE
                } else {
                    ratingView?.visibility = android.view.View.GONE
                }
            } else {
                userSection?.visibility = android.view.View.GONE
            }
        }

        fun formatDate(isoString: String, pattern: String): String? =
            runCatching {
                Instant.parse(isoString)
                    .atZone(ZoneId.systemDefault())
                    .format(DateTimeFormatter.ofPattern(pattern, java.util.Locale.ENGLISH))
            }.getOrElse {
                runCatching {
                    java.time.LocalDate.parse(isoString.take(10))
                        .atStartOfDay(ZoneId.systemDefault())
                        .format(DateTimeFormatter.ofPattern(pattern, java.util.Locale.ENGLISH))
                }.getOrNull()
            }

        when {
            payload?.service != null -> {
                val svc = payload.service
                val isOffer = svc.serviceType == "offer"
                typeBadge?.text = if (isOffer) "Offer" else "Need"
                typeBadge?.setBackgroundResource(
                    if (isOffer) com.hive.hive_app.R.drawable.map_badge_bg_offer
                    else com.hive.hive_app.R.drawable.map_badge_bg_need
                )
                val dur = svc.estimatedDuration.toInt()
                durationBadge?.text = "${dur}h"
                durationBadge?.visibility = android.view.View.VISIBLE

                populateTags(
                    svc.tags,
                    com.hive.hive_app.R.drawable.map_tag_chip_bg,
                    android.graphics.Color.parseColor("#4A148C")
                )

                val rawDate = svc.specificDate ?: svc.createdAt
                val dateLabel = if (svc.specificDate != null) "Date" else "Posted"
                val fmt = formatDate(rawDate, "d MMMM yyyy")
                if (fmt != null) {
                    dateView?.text = "$dateLabel: $fmt"
                    dateView?.visibility = android.view.View.VISIBLE
                } else {
                    dateView?.visibility = android.view.View.GONE
                }
                populateCreator(payload.creator)
            }

            payload?.event != null -> {
                val ev = payload.event
                typeBadge?.text = "Event"
                typeBadge?.setBackgroundResource(com.hive.hive_app.R.drawable.map_badge_bg_event)

                val dateBadge = formatDate(ev.eventAt, "MMM d, HH:mm")
                durationBadge?.text = dateBadge ?: ""
                durationBadge?.visibility = if (dateBadge != null) android.view.View.VISIBLE else android.view.View.GONE

                populateTags(
                    ev.tags ?: emptyList(),
                    com.hive.hive_app.R.drawable.map_tag_chip_bg_event,
                    android.graphics.Color.parseColor("#5B21B6")
                )

                val evDate = formatDate(ev.eventAt, "d MMMM yyyy, HH:mm")
                if (evDate != null) {
                    dateView?.text = "Date: $evDate"
                    dateView?.visibility = android.view.View.VISIBLE
                } else {
                    dateView?.visibility = android.view.View.GONE
                }
                populateCreator(payload.creator)
            }

            else -> {
                durationBadge?.visibility = android.view.View.GONE
                tagsScroll?.visibility = android.view.View.GONE
                dateView?.visibility = android.view.View.GONE
            }
        }
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

/** Lime outline for map carousel cards and selected filters (matches previous design). */
private val MapLime = Color(0xFFB7FF00)

/** Inner vector icons aligned with web map SVGs (white stroke on [markerCircleFillColor] disk). */
@DrawableRes
private fun mapMarkerIconRes(kind: MapMarkerKind): Int = when (kind) {
    MapMarkerKind.EVENT -> com.hive.hive_app.R.drawable.ic_map_marker_icon_event
    MapMarkerKind.OFFER -> com.hive.hive_app.R.drawable.ic_map_marker_icon_offer
    MapMarkerKind.NEED -> com.hive.hive_app.R.drawable.ic_map_marker_icon_need
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
 * Web-aligned vector icon centered in a solid colored circle (marker icon). No outer stroke.
 * Privacy radius on the map is drawn separately as a [Polygon] overlay.
 */
private fun vectorInPrivacyCircleMarkerDrawable(
    context: android.content.Context,
    @DrawableRes vectorResId: Int,
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

    val inset = sizePx * 0.22f
    val left = inset.toInt()
    val top = inset.toInt()
    val right = (sizePx - inset).toInt()
    val bottom = (sizePx - inset).toInt()
    val icon = ContextCompat.getDrawable(context, vectorResId)?.mutate()
    icon?.setBounds(left, top, right, bottom)
    icon?.draw(canvas)
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
    val markerIconCache = remember { mutableMapOf<MapMarkerKind, Drawable>() }
    fun markerIcon(kind: MapMarkerKind): Drawable {
        return markerIconCache.getOrPut(kind) {
            vectorInPrivacyCircleMarkerDrawable(
                context,
                mapMarkerIconRes(kind),
                markerCircleFillColor(kind)
            )
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
                if (onServiceSelected != null) onServiceSelected(serviceId) else selectedServiceId = serviceId
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
    var showListView by remember { mutableStateOf(false) }
    val activity = LocalActivity.current
    SideEffect {
        activity?.window?.let { w ->
            w.statusBarColor = android.graphics.Color.WHITE
            WindowCompat.getInsetsController(w, w.decorView).isAppearanceLightStatusBars = true
        }
    }
    DisposableEffect(Unit) {
        onDispose {
            activity?.window?.statusBarColor = android.graphics.Color.TRANSPARENT
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        if (showListView) {
            DiscoverScreen(
                modifier = Modifier.fillMaxSize(),
                onStartChat = onStartChat,
                onOpenUserProfile = onOpenUserProfile
            )
        } else {
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
                    zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER)
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
                val mapServices = viewModel.servicesForMapOverlay(state)
                val mapEvents = viewModel.eventsForMapOverlay(state)
                // Privacy radius first (drawn under markers)
                mapServices.forEach { service ->
                    service.location ?: return@forEach
                    val kind = if (service.serviceType == "offer") MapMarkerKind.OFFER else MapMarkerKind.NEED
                    map.overlays.add(
                        privacyRadiusPolygon(service.location.latitude, service.location.longitude, density, kind)
                    )
                }
                mapEvents.forEach { event ->
                    val lat = event.latitude ?: return@forEach
                    val lon = event.longitude ?: return@forEach
                    map.overlays.add(privacyRadiusPolygon(lat, lon, density, MapMarkerKind.EVENT))
                }
                fun openDetailForServiceOrEventMarker(marker: Marker) {
                    val payload = marker.relatedObject as? MarkerPayload ?: return
                    when {
                        payload.navId.startsWith("service:") -> {
                            val id = payload.navId.removePrefix("service:")
                            if (onServiceSelected != null) onServiceSelected(id) else selectedServiceId = id
                        }
                        payload.navId.startsWith("event:") -> {
                            selectedForumEventId = payload.navId.removePrefix("event:")
                        }
                    }
                    InfoWindow.closeAllInfoWindowsOn(map)
                }
                val bubbleWindow = MapBubbleInfoWindow(
                    com.hive.hive_app.R.layout.map_info_window,
                    map
                ) { marker -> openDetailForServiceOrEventMarker(marker) }
                mapServices.forEach { service ->
                    service.location ?: return@forEach
                    val markerKind = if (service.serviceType == "offer") MapMarkerKind.OFFER else MapMarkerKind.NEED
                    val icon = markerIcon(markerKind)
                    val marker = Marker(map).apply {
                        position = GeoPoint(service.location.latitude, service.location.longitude)
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        setIcon(icon)
                        title = service.title
                        snippet = ""
                        relatedObject = MarkerPayload("service:${service._id}", service = service, creator = state.creatorInfo[service.userId])
                        setInfoWindow(bubbleWindow)
                        setOnMarkerClickListener { m, _ ->
                            val sameMarkerOpen =
                                bubbleWindow.isOpen && bubbleWindow.relatedObject === m
                            if (sameMarkerOpen) {
                                openDetailForServiceOrEventMarker(m)
                            } else {
                                InfoWindow.closeAllInfoWindowsOn(map)
                                map.controller.animateTo(m.position)
                                m.showInfoWindow()
                            }
                            true
                        }
                    }
                    map.overlays.add(marker)
                }
                mapEvents.forEach { event ->
                    val lat = event.latitude ?: return@forEach
                    val lon = event.longitude ?: return@forEach
                    val marker = Marker(map).apply {
                        position = GeoPoint(lat, lon)
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        setIcon(markerIcon(MapMarkerKind.EVENT))
                        title = event.title
                        snippet = ""
                        relatedObject = MarkerPayload("event:${event.id}", event = event, creator = event.userId?.let { state.creatorInfo[it] })
                        setInfoWindow(bubbleWindow)
                        setOnMarkerClickListener { m, _ ->
                            val sameMarkerOpen =
                                bubbleWindow.isOpen && bubbleWindow.relatedObject === m
                            if (sameMarkerOpen) {
                                openDetailForServiceOrEventMarker(m)
                            } else {
                                InfoWindow.closeAllInfoWindowsOn(map)
                                map.controller.animateTo(m.position)
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
            color = Color.White,
            shadowElevation = 0.dp,
            tonalElevation = 0.dp
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(0.dp)
            ) {
                Spacer(Modifier.windowInsetsTopHeight(WindowInsets.statusBars))
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
                    OutlinedTextField(
                        value = state.mapSearchQuery,
                        onValueChange = { viewModel.setMapSearchQuery(it) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        placeholder = { Text("Search…") },
                        leadingIcon = {
                            Icon(Icons.Outlined.Search, contentDescription = null)
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        ),
                        textStyle = MaterialTheme.typography.bodyMedium
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
                    IconButton(onClick = { showFilters = true }) {
                        Icon(Icons.Filled.Tune, contentDescription = "Filters")
                    }
                }

                val filterSummary = remember(state.filterTimeOfDay, state.filterDate, state.filterType) {
                    val typeLabel = when (state.filterType) {
                        null -> "All"
                        "offer" -> "Offer"
                        "need" -> "Need"
                        "event" -> "Event"
                        else -> "All"
                    }
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
                    "Type: $typeLabel   Date: $dateLabel   Time of day: $timeLabel"
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = filterSummary,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { showFilters = true }
                    )
                    IconButton(
                        onClick = { showListView = !showListView },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = if (showListView) Icons.Outlined.Map else Icons.Outlined.FormatListBulleted,
                            contentDescription = if (showListView) "Map View" else "List View",
                            tint = if (showListView) MaterialTheme.colorScheme.primary
                                   else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                }
            }
        }

        // Bottom list (viewport only): services the user sees right now
        if (state.viewport != null && (state.visibleServices.isNotEmpty() || state.visibleEvents.isNotEmpty())) {
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(start = 12.dp, end = 12.dp, bottom = 112.dp, top = 12.dp),
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
                                onClick = {
                                    if (onServiceSelected != null) onServiceSelected.invoke(service._id)
                                    else selectedServiceId = service._id
                                }
                            )
                        }
                        items(items = state.visibleEvents, key = { it.id }) { event ->
                            val dist = if (state.userLat != null && state.userLon != null && event.latitude != null && event.longitude != null) {
                                distanceKm(state.userLat!!, state.userLon!!, event.latitude!!, event.longitude!!)
                            } else null
                            MapEventCarouselCard(
                                event = event,
                                distanceKm = dist,
                                onClick = { selectedForumEventId = event.id }
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
                selectedFilterType = state.filterType,
                offerCount = state.offerCount,
                needCount = state.needCount,
                eventCount = state.events.size,
                onDismiss = { showFilters = false },
                onApply = { time, date, type ->
                    viewModel.setFilters(time, date, type)
                    showFilters = false
                }
            )
        }
        } // end else - map content
    }
}

/** [FilterChip] with a lime border when [selected] (filter sheet). */
@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun MapLimeOutlinedFilterChip(
    selected: Boolean,
    onClick: () -> Unit,
    label: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    leadingIcon: @Composable (() -> Unit)? = null
) {
    val shape = FilterChipDefaults.shape
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = label,
        leadingIcon = leadingIcon,
        modifier = modifier,
        shape = shape,
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = MaterialTheme.colorScheme.outline,
            selectedBorderColor = MapLime
        )
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun MapFilterSheet(
    selectedTimeOfDay: MapViewModel.TimeOfDayFilter,
    selectedDateFilter: MapViewModel.DateFilter,
    selectedFilterType: String?,
    offerCount: Int,
    needCount: Int,
    eventCount: Int,
    onDismiss: () -> Unit,
    onApply: (MapViewModel.TimeOfDayFilter, MapViewModel.DateFilter, String?) -> Unit
) {
    val context = LocalContext.current
    var time by remember { mutableStateOf(selectedTimeOfDay) }
    var dateFilter by remember { mutableStateOf(selectedDateFilter) }
    var filterType by remember { mutableStateOf(selectedFilterType) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Filters", style = MaterialTheme.typography.titleMedium)

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Type", style = MaterialTheme.typography.titleSmall)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MapLimeOutlinedFilterChip(
                        selected = filterType == null,
                        onClick = { filterType = null },
                        label = { Text("All") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = filterType == "offer",
                        onClick = { filterType = "offer" },
                        label = { Text("Offers ($offerCount)") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = filterType == "need",
                        onClick = { filterType = "need" },
                        label = { Text("Needs ($needCount)") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = filterType == "event",
                        onClick = { filterType = "event" },
                        label = { Text("Events ($eventCount)") }
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Time of day", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MapLimeOutlinedFilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.ANYTIME,
                        onClick = { time = MapViewModel.TimeOfDayFilter.ANYTIME },
                        label = { Text("Any time") },
                        leadingIcon = { Icon(Icons.Outlined.Schedule, contentDescription = null) }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.MORNING,
                        onClick = { time = MapViewModel.TimeOfDayFilter.MORNING },
                        label = { Text("Morning") },
                        leadingIcon = { Icon(Icons.Outlined.WbSunny, contentDescription = null) }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.AFTERNOON,
                        onClick = { time = MapViewModel.TimeOfDayFilter.AFTERNOON },
                        label = { Text("Afternoon") },
                        leadingIcon = { Icon(Icons.Outlined.WbCloudy, contentDescription = null) }
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MapLimeOutlinedFilterChip(
                        selected = time == MapViewModel.TimeOfDayFilter.EVENING,
                        onClick = { time = MapViewModel.TimeOfDayFilter.EVENING },
                        label = { Text("Evening") },
                        leadingIcon = { Icon(Icons.Outlined.Nightlight, contentDescription = null) }
                    )
                    MapLimeOutlinedFilterChip(
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
                    MapLimeOutlinedFilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.ANYTIME,
                        onClick = { dateFilter = MapViewModel.DateFilter.ANYTIME },
                        label = { Text("Anytime") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.TODAY,
                        onClick = { dateFilter = MapViewModel.DateFilter.TODAY },
                        label = { Text("Today") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.TOMORROW,
                        onClick = { dateFilter = MapViewModel.DateFilter.TOMORROW },
                        label = { Text("Tomorrow") }
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MapLimeOutlinedFilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.WEEKEND,
                        onClick = { dateFilter = MapViewModel.DateFilter.WEEKEND },
                        label = { Text("Weekend") }
                    )
                    MapLimeOutlinedFilterChip(
                        selected = dateFilter is MapViewModel.DateFilter.NEXT_WEEKEND,
                        onClick = { dateFilter = MapViewModel.DateFilter.NEXT_WEEKEND },
                        label = { Text("Next weekend") }
                    )
                }
                MapLimeOutlinedFilterChip(
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
                    }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                MapLimeOutlinedFilterChip(
                    selected = false,
                    onClick = {
                        time = MapViewModel.TimeOfDayFilter.ANYTIME
                        dateFilter = MapViewModel.DateFilter.ANYTIME
                        filterType = null
                    },
                    label = { Text("Clear") }
                )
                Card(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .clickable { onApply(time, dateFilter, filterType) },
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

/** First image URL from API `service` object on forum events (snake_case or camelCase). */
@Suppress("UNCHECKED_CAST")
private fun firstImageUrlFromEventEmbeddedService(service: Any?): String? {
    return when (service) {
        is ServiceResponse -> service.imageUrls?.firstOrNull()
        is Map<*, *> -> {
            val urls = (service["image_urls"] ?: service["imageUrls"]) as? List<*> ?: return null
            urls.firstOrNull() as? String
        }
        else -> null
    }
}

@Composable
private fun MapServiceCarouselCard(
    service: ServiceResponse,
    distanceKm: Double?,
    onClick: () -> Unit
) {
    val context = LocalContext.current
    val scheduleLine = serviceScheduleSummary(service)
    Card(
        modifier = Modifier
            .width(272.dp)
            .heightIn(min = 132.dp, max = 198.dp)
            .border(2.dp, MapLime, RoundedCornerShape(16.dp))
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
            val imgReq = buildImageRequest(context, service.imageUrls?.firstOrNull())
            if (imgReq != null) {
                AsyncImage(
                    model = imgReq,
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
                        service.tags.take(2).forEach { tag ->
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
                Text(
                    text = scheduleLine,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF666666),
                    maxLines = 2
                )
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

/**
 * Human-readable scheduling line for map cards (OpenAPI [ServiceResponse] fields:
 * specific_date, deadline, recurring_pattern, open_availability, scheduling_type, status).
 */
private fun serviceScheduleSummary(service: ServiceResponse): String {
    val today = LocalDate.now()
    val dateStr = service.specificDate?.takeIf { it.length >= 10 }?.substring(0, 10)
        ?: service.deadline?.takeIf { it.length >= 10 }?.substring(0, 10)
    val target = dateStr?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    if (target != null) {
        val days = ChronoUnit.DAYS.between(today, target)
        return when {
            days < 0 -> "Date passed"
            days == 0L -> "Today"
            days == 1L -> "1 day later"
            else -> "$days days later"
        }
    }
    val recurring = service.recurringPattern
    if (recurring != null && (recurring.days.isNotEmpty() || recurring.time.isNotBlank())) {
        val daysPart = recurring.days.take(4).joinToString(", ")
        val t = recurring.time.takeIf { it.isNotBlank() }
        return buildString {
            append("Recurring")
            if (daysPart.isNotBlank()) append(": ").append(daysPart)
            if (t != null) append(" • ").append(t)
        }
    }
    val openAv = service.openAvailability?.trim()?.takeIf { it.isNotBlank() }
    if (openAv != null) {
        val short = if (openAv.length > 42) openAv.take(39) + "…" else openAv
        return "Flexible: $short"
    }
    val st = service.schedulingType?.trim()?.takeIf { it.isNotBlank() }
    if (st != null && !st.equals("open", ignoreCase = true)) {
        return st.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
    val status = service.status.trim()
    if (status.isNotBlank() && !status.equals("active", ignoreCase = true)) {
        return status.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
    return "Schedule not set"
}

@Composable
private fun MapEventCarouselCard(
    event: ForumEventResponse,
    distanceKm: Double?,
    onClick: () -> Unit
) {
    val context = LocalContext.current
    val whenText = remember(event.eventAt) {
        runCatching {
            Instant.parse(event.eventAt)
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM d, HH:mm"))
        }.getOrNull()
    }
    Card(
        modifier = Modifier
            .width(272.dp)
            .heightIn(min = 132.dp, max = 198.dp)
            .border(2.dp, MapLime, RoundedCornerShape(16.dp))
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
            val eventImgReq = buildImageRequest(
                context,
                firstImageUrlFromEventEmbeddedService(event.service)
            )
            if (eventImgReq != null) {
                AsyncImage(
                    model = eventImgReq,
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
                    text = event.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Black,
                    maxLines = 1
                )
                if (!event.tags.isNullOrEmpty()) {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        event.tags!!.take(2).forEach { tag ->
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
                if (whenText != null) {
                    Text(
                        text = whenText,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF666666),
                        maxLines = 1
                    )
                }
                Text(
                    text = event.description.take(64) + if (event.description.length > 64) "…" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF333333),
                    maxLines = 2
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "event",
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
