package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.BadgeEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BadgeUtilsTest {
    @Test
    fun returnsHighestPriorityEarnedBadgeInsteadOfFirstBadge() {
        val badges = listOf(
            badge("newcomer", earned = true),
            badge("true_bee", earned = true),
            badge("helper", earned = true)
        )

        assertEquals("true_bee", getHighestPriorityBadge(badges)?.key)
    }

    @Test
    fun ignoresHighPriorityBadgesThatAreNotEarned() {
        val badges = listOf(
            badge("true_bee", earned = false),
            badge("helper_hero", earned = true),
            badge("newcomer", earned = true)
        )

        assertEquals("helper_hero", getHighestPriorityBadge(badges)?.key)
    }

    @Test
    fun fallsBackToFirstEarnedBadgeWhenNoKnownPriorityKeyMatches() {
        val badges = listOf(
            badge("custom_badge", earned = true),
            badge("another_custom_badge", earned = true)
        )

        assertEquals("custom_badge", getHighestPriorityBadge(badges)?.key)
    }

    @Test
    fun returnsNullWhenBadgesAreMissingOrNoneAreEarned() {
        assertNull(getHighestPriorityBadge(null))
        assertNull(getHighestPriorityBadge(emptyList()))
        assertNull(getHighestPriorityBadge(listOf(badge("true_bee", earned = false))))
    }

    private fun badge(key: String, earned: Boolean) = BadgeEntry(
        key = key,
        name = key,
        earned = earned
    )
}
