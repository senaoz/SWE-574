package com.hive.hive_app.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.hive.hive_app.ui.main.ActiveItemsScreen
import com.hive.hive_app.ui.main.ChatScreen
import com.hive.hive_app.ui.main.DiscoverScreen
import com.hive.hive_app.ui.main.ForumScreen
import com.hive.hive_app.ui.main.MapScreen
import com.hive.hive_app.ui.main.ProfileScreen
import com.hive.hive_app.ui.main.SavedServicesScreen
import com.hive.hive_app.ui.main.UserProfileScreen

@Composable
fun MainScaffold(
    onLogout: () -> Unit
) {
    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.DISCOVER) }
    var openChatRoomId by remember { mutableStateOf<String?>(null) }
    var overlayUserId by remember { mutableStateOf<String?>(null) }
    var showSavedServices by remember { mutableStateOf(false) }

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
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
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
