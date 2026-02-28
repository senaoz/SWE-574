package com.hive.hive_app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Place
import androidx.compose.ui.graphics.vector.ImageVector

enum class MainDestinations(
    val label: String,
    val icon: ImageVector
) {
    DISCOVER("Discover", Icons.Outlined.Explore),
    MAP("Map", Icons.Outlined.Place),
    ACTIVE("Active", Icons.Outlined.DateRange),
    CHAT("Chat", Icons.Outlined.Chat),
    FORUM("Forum", Icons.Outlined.Forum),
    PROFILE("Profile", Icons.Outlined.Person)
}
