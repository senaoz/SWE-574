package com.hive.hive_app.util

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Stars
import org.junit.Assert.assertEquals
import org.junit.Test

class BadgeIconUtilsTest {
    @Test
    fun mapsKnownBadgeKeysToExpectedIcons() {
        assertEquals(Icons.Filled.Person.name, badgeIcon("newcomer").name)
        assertEquals(Icons.Filled.Label.name, badgeIcon("tagged").name)
        assertEquals(Icons.Filled.Favorite.name, badgeIcon("community_favorite").name)
        assertEquals(Icons.Filled.Group.name, badgeIcon("cross_pollinator").name)
        assertEquals(Icons.Filled.Stars.name, badgeIcon("true_bee").name)
    }

    @Test
    fun mapsRelatedHelperBadgesToSchoolIcon() {
        assertEquals(Icons.Filled.School.name, badgeIcon("helper").name)
        assertEquals(Icons.Filled.School.name, badgeIcon("helper_hero").name)
        assertEquals(Icons.Filled.School.name, badgeIcon("master_helper").name)
    }

    @Test
    fun fallsBackToStarForUnknownOrMissingBadgeKeys() {
        assertEquals(Icons.Filled.Star.name, badgeIcon("unknown_badge").name)
        assertEquals(Icons.Filled.Star.name, badgeIcon(null).name)
    }
}
