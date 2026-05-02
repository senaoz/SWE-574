package com.hive.hive_app.util

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.ui.graphics.vector.ImageVector

fun badgeIcon(key: String?): ImageVector = when (key) {
    "newcomer" -> Icons.Filled.Person
    "profile_complete" -> Icons.Filled.Image
    "tagged", "well_tagged" -> Icons.Filled.Label
    "rated" -> Icons.Filled.Star
    "popular" -> Icons.Filled.TrendingUp
    "community_favorite" -> Icons.Filled.Favorite
    "helper", "helper_hero", "master_helper" -> Icons.Filled.School
    "generous_giver" -> Icons.Filled.Schedule
    "hive_dancer" -> Icons.Filled.DateRange
    "cross_pollinator" -> Icons.Filled.Group
    "hive_whisperer" -> Icons.Filled.Forum
    "true_bee" -> Icons.Filled.Stars
    "social_antenna" -> Icons.Filled.Link
    "veteran_scout" -> Icons.Filled.WorkspacePremium
    else -> Icons.Filled.Star
}
