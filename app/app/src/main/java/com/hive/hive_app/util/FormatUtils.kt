package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.ServiceResponse
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

/** Formats ISO date-time for compact display with time, e.g. "Feb 27, 2026 · 10:30 AM". */
fun formatApplicationDateTime(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    return try {
        val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        val output = SimpleDateFormat("MMM d, yyyy · h:mm a", Locale.US)
        val date = input.parse(isoDate.take(19))
        if (date != null) output.format(date) else formatApplicationDate(isoDate)
    } catch (_: Exception) {
        formatApplicationDate(isoDate)
    }
}

/** Formats a raw date string (e.g. yyyy-MM-dd) as "MMM d, yyyy". */
fun formatRawDateForDisplay(raw: String?): String? {
    if (raw.isNullOrBlank()) return null
    val s = raw.trim()
    val datePart = if (s.length >= 10 && s[4] == '-' && s[7] == '-') s.take(10) else s
    return if (Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(datePart)) {
        formatApplicationDate(datePart).takeIf { it.isNotBlank() }
    } else {
        formatApplicationDate(s).takeIf { it.isNotBlank() } ?: s
    }
}

/**
 * Human-readable scheduling line for lists and manage-requests (dates as "Mar 7, 2026", not raw ISO).
 */
fun formatServiceSchedulingDisplay(service: ServiceResponse): String? {
    val date = service.specificDate
    val time = service.specificTime
    val open = service.openAvailability
    val desc = service.description
    return when {
        !date.isNullOrBlank() && !time.isNullOrBlank() -> {
            val d = formatRawDateForDisplay(date) ?: date
            "$d at $time"
        }
        !date.isNullOrBlank() -> formatRawDateForDisplay(date) ?: date
        !open.isNullOrBlank() -> "Open Availability - $open"
        service.schedulingType == "open" && !desc.isNullOrBlank() -> {
            val d = if (desc.length > 120) desc.take(120) + "…" else desc
            "Open Availability - $d"
        }
        else -> null
    }
}
