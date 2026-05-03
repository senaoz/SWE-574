package com.hive.hive_app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Place
import androidx.compose.ui.graphics.vector.ImageVector

enum class MainDestinations(
    val label: String,
    val icon: ImageVector
) {
    MAP("Map", Icons.Outlined.Place),
    CHAT("Chat", Icons.Outlined.Chat),
    COMMON("Common", Icons.Outlined.Groups),
    PROFILE("Profile", Icons.Outlined.Person)
}
