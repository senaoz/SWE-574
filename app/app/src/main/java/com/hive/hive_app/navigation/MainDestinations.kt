package com.hive.hive_app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.vector.ImageVector

enum class MainDestinations(
    val label: String,
    val icon: ImageVector
) {
    DISCOVER("Discover", Icons.Default.List),
    MAP("Map", Icons.Default.Place),
    ACTIVE("Active", Icons.Default.DateRange),
    FORUM("Forum", Icons.Default.Star),
    PROFILE("Profile", Icons.Default.Person)
}
