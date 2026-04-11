package com.hive.hive_app.navigation

import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.activity.compose.BackHandler
import androidx.compose.material3.Badge
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.key
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.ui.main.ActiveItemsScreen
import com.hive.hive_app.ui.main.ChatScreen
import com.hive.hive_app.ui.main.DiscoverScreen
import com.hive.hive_app.ui.main.ForumScreen
import com.hive.hive_app.ui.main.MainViewModel
import com.hive.hive_app.ui.main.MapScreen
import com.hive.hive_app.ui.main.EditProfileScreen
import com.hive.hive_app.ui.main.ProfileScreen
import com.hive.hive_app.ui.main.SavedServicesScreen
import com.hive.hive_app.ui.main.ManageServiceScreen
import com.hive.hive_app.ui.main.ServiceDetailScreen
import com.hive.hive_app.ui.main.ServiceDetailViewModel
import com.hive.hive_app.ui.main.UserProfileScreen
import com.hive.hive_app.ui.main.UserRatingsScreen
import com.hive.hive_app.ui.notifications.NotificationsScreen

private sealed class OverlayRoute {
    data class UserProfile(val userId: String) : OverlayRoute()
    data class UserRatings(val userId: String, val title: String = "Ratings") : OverlayRoute()
    /** Public service / exchange view (works for any user; Manage is for owners.) */
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

    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.DISCOVER) }
    var openChatRoomId by remember { mutableStateOf<String?>(null) }
    var overlayStack by remember { mutableStateOf<List<OverlayRoute>>(emptyList()) }
    var showSavedServices by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        mainViewModel.refreshUnreadCount()
    }

    LaunchedEffect(pendingDestination) {
        pendingDestination?.let { dest ->
            if (dest == "ACTIVE") currentDestination = MainDestinations.ACTIVE
            mainViewModel.consumePendingDestination()
        }
    }

    fun pushOverlay(route: OverlayRoute) {
        overlayStack = overlayStack + route
    }

    fun popOverlay() {
        if (overlayStack.isNotEmpty()) overlayStack = overlayStack.dropLast(1)
    }

    BackHandler(
        enabled = overlayStack.isNotEmpty() ||
            showSavedServices ||
            showNotifications ||
            showEditProfile ||
            currentDestination != MainDestinations.DISCOVER
    ) {
        when {
            overlayStack.isNotEmpty() -> popOverlay()
            showSavedServices -> showSavedServices = false
            showNotifications -> {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            }
            showEditProfile -> showEditProfile = false
            currentDestination != MainDestinations.DISCOVER -> {
                currentDestination = MainDestinations.DISCOVER
                openChatRoomId = null
            }
        }
    }

    val onStartChat: (String) -> Unit = { roomId ->
        openChatRoomId = roomId
        currentDestination = MainDestinations.CHAT
    }
    val onOpenUserProfile: (String) -> Unit = { userId ->
        pushOverlay(OverlayRoute.UserProfile(userId))
    }

    val onOpenRatings: (String) -> Unit = { userId ->
        pushOverlay(OverlayRoute.UserRatings(userId))
    }

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
                    onManageJoinRequests = {
                        val sid = detailState?._id
                        if (sid != null) pushOverlay(OverlayRoute.ManageService(sid))
                    }
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
                    onOpenRatings = { uid ->
                        pushOverlay(OverlayRoute.UserRatings(uid))
                    }
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
                    onOpenExchange = { serviceId -> pushOverlay(OverlayRoute.ServiceDetail(serviceId)) },
                    modifier = Modifier.fillMaxSize()
                )
            }
            return
        }
        null -> { }
    }
    if (showEditProfile) {
        EditProfileScreen(onBack = { showEditProfile = false })
        return
    }
    if (showSavedServices) {
        SavedServicesScreen(
            onBack = { showSavedServices = false },
            modifier = Modifier.fillMaxSize()
        )
        return
    }
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
                    "JOIN_REQUEST_RECEIVED",
                    "JOIN_REQUEST_APPROVED",
                    "JOIN_REQUEST_REJECTED",
                    "TRANSACTION_COMPLETED" -> currentDestination = MainDestinations.ACTIVE
                }
                mainViewModel.refreshUnreadCount()
            }
        )
        return
    }

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            MainDestinations.entries.forEach { dest ->
                item(
                    icon = {
                        Icon(
                            dest.icon,
                            contentDescription = dest.label
                        )
                    },
                    label = { Text(dest.label) },
                    selected = dest == currentDestination,
                    onClick = { currentDestination = dest },
                    badge = if (dest == MainDestinations.PROFILE && unreadCount > 0) {
                        { Badge { Text(unreadCount.toString()) } }
                    } else null
                )
            }
        }
    ) {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
            val layoutDirection = LocalLayoutDirection.current
            when (currentDestination) {
                MainDestinations.DISCOVER -> DiscoverScreen(
                    Modifier.padding(innerPadding),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                // Map draws under the status bar; top inset is handled inside MapScreen (white bar + insets).
                MainDestinations.MAP -> MapScreen(
                    Modifier
                        .fillMaxSize()
                        .padding(
                            start = innerPadding.calculateStartPadding(layoutDirection),
                            end = innerPadding.calculateEndPadding(layoutDirection),
                            bottom = innerPadding.calculateBottomPadding(),
                            top = 0.dp
                        ),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                MainDestinations.ACTIVE -> ActiveItemsScreen(
                    Modifier.padding(innerPadding),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                MainDestinations.CHAT -> ChatScreen(
                    Modifier.padding(innerPadding),
                    initialRoomId = openChatRoomId,
                    onInitialRoomConsumed = { openChatRoomId = null }
                )
                MainDestinations.FORUM -> ForumScreen(Modifier.padding(innerPadding))
                MainDestinations.PROFILE -> ProfileScreen(
                    onLogout = onLogout,
                    modifier = Modifier.padding(innerPadding),
                    onOpenSaved = { showSavedServices = true },
                    onOpenNotifications = { showNotifications = true },
                    onOpenRatings = onOpenRatings,
                    onOpenEditProfile = { showEditProfile = true }
                )
            }
        }
    }
}
