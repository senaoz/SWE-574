package com.hive.hive_app.util

import java.text.SimpleDateFormat
import java.util.Locale

/** Formats duration in hours as whole hours only, e.g. 2.5 -> "3h", 1.0 -> "1h". */
fun formatDurationHours(hours: Double): String =
    "${kotlin.math.round(hours).toInt()}h"

/** Formats ISO date string for display, e.g. "2026-02-27T10:00:00" -> "Feb 27, 2026". */
fun formatApplicationDate(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    return try {
        val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        val output = SimpleDateFormat("MMM d, yyyy", Locale.US)
        val date = input.parse(isoDate.take(19))
        if (date != null) output.format(date) else isoDate.take(10)
    } catch (_: Exception) {
        try {
            val input = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val output = SimpleDateFormat("MMM d, yyyy", Locale.US)
            val date = input.parse(isoDate.take(10))
            if (date != null) output.format(date) else isoDate.take(10)
        } catch (_: Exception) {
            isoDate.take(10)
        }
    }
}
