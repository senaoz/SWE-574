package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.BadgeEntry

val BADGE_PRIORITY: List<String> = listOf(
    "generous_giver",     // Queen Bee
    "master_helper",      // Elite Forager
    "community_favorite", // Queen's Choice
    "helper_hero",        // Pollinator Bee
    "popular",            // Honeycomb Star
    "helper",             // Worker Bee
    "well_tagged",        // Nectar Expert
    "rated",              // Sweet Taste
    "first_exchange",     // Honey Maker
    "newcomer",           // Newcomer
    "profile_complete",   // Polished Wings
    "tagged"              // Pollen Collector
)

fun getHighestPriorityBadge(badges: List<BadgeEntry>?): BadgeEntry? {
    val earned = badges.orEmpty().filter { it.earned }
    if (earned.isEmpty()) return null

    val byKey = earned.associateBy { it.key }
    for (key in BADGE_PRIORITY) {
        val match = byKey[key]
        if (match != null) return match
    }
    return earned.first()
}
