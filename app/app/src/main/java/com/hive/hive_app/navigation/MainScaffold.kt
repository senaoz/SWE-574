package com.hive.hive_app.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.activity.compose.BackHandler
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.ui.main.ActiveItemsScreen
import com.hive.hive_app.ui.main.ChatScreen
import com.hive.hive_app.ui.main.DiscoverScreen
import com.hive.hive_app.ui.main.ForumScreen
import com.hive.hive_app.ui.main.MainViewModel
import com.hive.hive_app.ui.main.MapScreen
import com.hive.hive_app.ui.main.ProfileScreen
import com.hive.hive_app.ui.main.SavedServicesScreen
import com.hive.hive_app.ui.main.UserProfileScreen
import com.hive.hive_app.ui.notifications.NotificationsScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScaffold(
    onLogout: () -> Unit
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    val unreadCount by mainViewModel.unreadCount.collectAsState()

    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.DISCOVER) }
    var openChatRoomId by remember { mutableStateOf<String?>(null) }
    var overlayUserId by remember { mutableStateOf<String?>(null) }
    var showSavedServices by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }

    val pendingDestination by mainViewModel.pendingDestination.collectAsState()

    LaunchedEffect(Unit) {
        mainViewModel.refreshUnreadCount()
    }

    LaunchedEffect(pendingDestination) {
        pendingDestination?.let { dest ->
            if (dest == "ACTIVE") currentDestination = MainDestinations.ACTIVE
            mainViewModel.consumePendingDestination()
        }
    }

    BackHandler(
        enabled = overlayUserId != null ||
            showSavedServices ||
            showNotifications ||
            currentDestination != MainDestinations.DISCOVER
    ) {
        when {
            overlayUserId != null -> overlayUserId = null
            showSavedServices -> showSavedServices = false
            showNotifications -> {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            }
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
        overlayUserId = userId
    }

    if (overlayUserId != null) {
        UserProfileScreen(
            userId = overlayUserId!!,
            onBack = { overlayUserId = null },
            modifier = Modifier.fillMaxSize()
        )
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
                    onClick = { currentDestination = dest }
                )
            }
        }
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            topBar = {
                TopAppBar(
                    title = { Text(currentDestination.label) },
                    actions = {
                        BadgedBox(
                            badge = {
                                if (unreadCount > 0) {
                                    Badge { Text(unreadCount.toString()) }
                                }
                            }
                        ) {
                            IconButton(onClick = { showNotifications = true }) {
                                Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                            }
                        }
                    }
                )
            }
        ) { innerPadding ->
            when (currentDestination) {
                MainDestinations.DISCOVER -> DiscoverScreen(
                    Modifier.padding(innerPadding),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                MainDestinations.MAP -> MapScreen(
                    Modifier.padding(innerPadding),
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
                    onOpenSaved = { showSavedServices = true }
                )
            }
        }
    }
}
