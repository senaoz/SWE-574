package com.hive.hive_app.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.ui.main.*
import com.hive.hive_app.ui.notifications.NotificationsScreen

private sealed class OverlayRoute {
    data class UserProfile(val userId: String) : OverlayRoute()
    data class UserRatings(val userId: String, val title: String = "Ratings") : OverlayRoute()
    data class ServiceDetail(val serviceId: String) : OverlayRoute()
    data class ManageService(val serviceId: String) : OverlayRoute()
}

@Composable
fun MainScaffold(
    onLogout: () -> Unit
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    val unreadCount by mainViewModel.unreadCount.collectAsState()
    val pendingDestination by mainViewModel.pendingDestination.collectAsState()

    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.MAP) }
    var openChatRoomId by remember { mutableStateOf<String?>(null) }
    var overlayStack by remember { mutableStateOf<List<OverlayRoute>>(emptyList()) }
    var showSavedServices by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }
    var showCreateService by remember { mutableStateOf(false) }
    var showActiveItems by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        mainViewModel.refreshUnreadCount()
    }

    LaunchedEffect(pendingDestination) {
        pendingDestination?.let { dest ->
            if (dest == "ACTIVE") showActiveItems = true
            mainViewModel.consumePendingDestination()
        }
    }

    fun pushOverlay(route: OverlayRoute) { overlayStack = overlayStack + route }
    fun popOverlay() { if (overlayStack.isNotEmpty()) overlayStack = overlayStack.dropLast(1) }

    BackHandler(
        enabled = overlayStack.isNotEmpty() || showSavedServices || showNotifications ||
                showEditProfile || showCreateService || showActiveItems ||
                currentDestination != MainDestinations.MAP
    ) {
        when {
            overlayStack.isNotEmpty() -> popOverlay()
            showSavedServices -> showSavedServices = false
            showNotifications -> {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            }
            showEditProfile -> showEditProfile = false
            showCreateService -> showCreateService = false
            showActiveItems -> showActiveItems = false
            currentDestination != MainDestinations.MAP -> {
                currentDestination = MainDestinations.MAP
                openChatRoomId = null
            }
        }
    }

    val onStartChat: (String) -> Unit = { roomId ->
        openChatRoomId = roomId
        currentDestination = MainDestinations.CHAT
    }
    val onOpenUserProfile: (String) -> Unit = { userId -> pushOverlay(OverlayRoute.UserProfile(userId)) }
    val onOpenRatings: (String) -> Unit = { userId -> pushOverlay(OverlayRoute.UserRatings(userId)) }

    when (val top = overlayStack.lastOrNull()) {
        is OverlayRoute.ManageService -> {
            key(top.serviceId) {
                ManageServiceScreen(
                    serviceId = top.serviceId,
                    onBack = { popOverlay() },
                    onOpenUserProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onStartChat = onStartChat,
                    onNavigateToCompleteRating = null,
                    onEditService = null
                )
            }
            return
        }
        is OverlayRoute.ServiceDetail -> {
            key(top.serviceId) {
                val detailViewModel: ServiceDetailViewModel = hiltViewModel()
                LaunchedEffect(top.serviceId) { detailViewModel.load(top.serviceId) }
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
                    onBack = { popOverlay() },
                    viewModel = detailViewModel,
                    modifier = Modifier.fillMaxSize(),
                    creatorBadges = detailCreatorBadges,
                    creatorRating = detailCreatorRating,
                    isSaved = detailIsSaved,
                    onStartChat = onStartChat,
                    onOpenUserProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onManageJoinRequests = { detailState?._id?.let { pushOverlay(OverlayRoute.ManageService(it)) } }
                )
            }
            return
        }
        is OverlayRoute.UserProfile -> {
            key(top.userId) {
                UserProfileScreen(
                    userId = top.userId,
                    onBack = { popOverlay() },
                    modifier = Modifier.fillMaxSize(),
                    onOpenRatings = { uid -> pushOverlay(OverlayRoute.UserRatings(uid)) }
                )
            }
            return
        }
        is OverlayRoute.UserRatings -> {
            key(top.userId) {
                UserRatingsScreen(
                    userId = top.userId,
                    title = top.title,
                    onBack = { popOverlay() },
                    onOpenRaterProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onOpenExchange = { pushOverlay(OverlayRoute.ServiceDetail(it)) },
                    modifier = Modifier.fillMaxSize()
                )
            }
            return
        }
        null -> { }
    }

    if (showEditProfile) { EditProfileScreen(onBack = { showEditProfile = false }); return }
    if (showSavedServices) { SavedServicesScreen(onBack = { showSavedServices = false }, modifier = Modifier.fillMaxSize()); return }

    if (showNotifications) {
        LaunchedEffect(Unit) { mainViewModel.clearUnreadBadge() }
        NotificationsScreen(
            modifier = Modifier.fillMaxSize(),
            onBack = {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            },
            onNavigate = { notif ->
                showNotifications = false
                when (notif.type) {
                    "JOIN_REQUEST_RECEIVED", "JOIN_REQUEST_APPROVED",
                    "JOIN_REQUEST_REJECTED", "TRANSACTION_COMPLETED" -> showActiveItems = true
                }
                mainViewModel.refreshUnreadCount()
            }
        )
        return
    }

    if (showCreateService) {
        CreateServiceScreen(
            modifier = Modifier.fillMaxSize(),
            userLat = null, userLon = null,
            locationPermissionGranted = false,
            onRequestLocationPermission = { },
            onRefreshLocation = { },
            onBack = { showCreateService = false },
            onCreated = { showCreateService = false }
        )
        return
    }

    if (showActiveItems) {
        ActiveItemsScreen(
            modifier = Modifier.fillMaxSize(),
            onStartChat = onStartChat,
            onOpenUserProfile = onOpenUserProfile,
            onBack = { showActiveItems = false }
        )
        return
    }

    val navBarHeight = 70.dp
    val fabRadius = 30.dp  // half of fabSize (60.dp) in CustomBottomNavBar
    val navBarTotalHeight = navBarHeight + fabRadius

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
            val layoutDirection = LocalLayoutDirection.current
            when (currentDestination) {
                MainDestinations.MAP -> MapScreen(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(
                            start = innerPadding.calculateStartPadding(layoutDirection),
                            end = innerPadding.calculateEndPadding(layoutDirection),
                            bottom = 0.dp, // Full screen map
                            top = 0.dp
                        ),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                MainDestinations.CHAT -> ChatScreen(
                    Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = navBarTotalHeight),
                    initialRoomId = openChatRoomId, onInitialRoomConsumed = { openChatRoomId = null }
                )
                MainDestinations.COMMON -> ForumScreen(
                    Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = navBarHeight)
                )
                MainDestinations.PROFILE -> ProfileScreen(
                    onLogout = onLogout,
                    modifier = Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = navBarHeight),
                    onOpenSaved = { showSavedServices = true },
                    onOpenNotifications = { showNotifications = true },
                    onOpenActive = { showActiveItems = true },
                    onOpenRatings = onOpenRatings,
                    onOpenEditProfile = { showEditProfile = true }
                )
            }
        }

        CustomBottomNavBar(
            modifier = Modifier.align(Alignment.BottomCenter),
            currentDestination = currentDestination,
            unreadCount = unreadCount,
            onDestinationSelected = { currentDestination = it },
            onAddClick = { showCreateService = true },
            barHeightParam = navBarHeight
        )
    }
}

@Composable
fun CustomBottomNavBar(
    modifier: Modifier = Modifier,
    currentDestination: MainDestinations,
    unreadCount: Int,
    onDestinationSelected: (MainDestinations) -> Unit,
    onAddClick: () -> Unit,
    barHeightParam: Dp
) {
    val barHeight    = barHeightParam
    val fabSize      = 60.dp
    val fabRadius    = fabSize / 2
    val notchRadius  = fabRadius + 8.dp
    val totalHeight  = barHeight + fabRadius
    val backgroundColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f)

    Box(modifier = modifier.fillMaxWidth().height(totalHeight)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .align(Alignment.BottomCenter)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                val cx = w / 2f
                val nr = notchRadius.toPx()
                val notchW = nr * 3.0f
                val notchH = nr * 1.3f
                // flat top edge of the bar (sides) sits at the barHeight offset from bottom
                val topY = h - barHeight.toPx()

                val path = Path().apply {
                    moveTo(0f, topY)
                    lineTo(cx - notchW * 0.9f, topY)
                    cubicTo(cx - notchW * 0.6f, topY, cx - notchW * 0.3f, topY + notchH, cx, topY + notchH)
                    cubicTo(cx + notchW * 0.3f, topY + notchH, cx + notchW * 0.6f, topY, cx + notchW * 0.9f, topY)
                    lineTo(w, topY)
                    lineTo(w, h)
                    lineTo(0f, h)
                    close()
                }
                drawPath(path, color = backgroundColor)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().height(barHeight).align(Alignment.BottomCenter).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem(MainDestinations.MAP.icon, "Map", currentDestination == MainDestinations.MAP, { onDestinationSelected(MainDestinations.MAP) }, Modifier.weight(1f))
            BottomNavItem(MainDestinations.CHAT.icon, "Chat", currentDestination == MainDestinations.CHAT, { onDestinationSelected(MainDestinations.CHAT) }, Modifier.weight(1f))
            Spacer(modifier = Modifier.weight(1.4f))
            BottomNavItem(MainDestinations.COMMON.icon, "Commons", currentDestination == MainDestinations.COMMON, { onDestinationSelected(MainDestinations.COMMON) }, Modifier.weight(1f))
            BottomNavItem(MainDestinations.PROFILE.icon, "Profile", currentDestination == MainDestinations.PROFILE, { onDestinationSelected(MainDestinations.PROFILE) }, Modifier.weight(1f), if (unreadCount > 0) unreadCount.toString() else null)
        }

        FloatingActionButton(
            onClick = onAddClick,
            modifier = Modifier.size(fabSize).align(Alignment.TopCenter).offset(y = 14.dp),
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White,
            shape = CircleShape,
            elevation = FloatingActionButtonDefaults.elevation(8.dp)
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add", modifier = Modifier.size(30.dp))
        }
    }
}

@Composable
private fun BottomNavItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    badge: String? = null
) {
    val color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
    Column(
        modifier = modifier.clickable(indication = null, interactionSource = remember { MutableInteractionSource() }, onClick = onClick).padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        BadgedBox(badge = { if (badge != null) Badge { Text(badge) } }) {
            Icon(imageVector = icon, contentDescription = label, tint = color, modifier = Modifier.size(27.dp))
        }
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = color, fontSize = 10.sp)
    }
}