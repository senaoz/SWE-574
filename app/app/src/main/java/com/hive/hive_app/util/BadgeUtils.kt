package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.BadgeEntry

val BADGE_PRIORITY: List<String> = listOf(
    "true_bee",           // True Bee
    "generous_giver",     // Queen Bee
    "veteran_scout",      // Veteran Scout
    "master_helper",      // Elite Forager
    "community_favorite", // Queen's Choice
    "cross_pollinator",   // Cross-Pollinator
    "helper_hero",        // Pollinator Bee
    "hive_dancer",        // Hive Dancer
    "popular",            // Honeycomb Star
    "helper",             // Worker Bee
    "hive_whisperer",     // Hive Whisperer
    "well_tagged",        // Nectar Expert
    "rated",              // Sweet Taste
    "first_exchange",     // Honey Maker
    "social_antenna",     // Social Antenna
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
