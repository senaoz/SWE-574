package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.ServiceResponse
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.Period
import java.time.format.DateTimeParseException
import java.time.format.TextStyle
import java.util.Locale

/** Formats duration in hours as whole hours only, e.g. 2.5 -> "3h", 1.0 -> "1h". */
fun formatDurationHours(hours: Double): String =
    "${kotlin.math.round(hours).toInt()}h"

/**
 * Human-readable membership length, e.g. "1 year 2 months 3 days" from account [createdAt] ISO string.
 */
fun formatMemberSinceDuration(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    val start = parseIsoToLocalDate(isoDate) ?: return ""
    val end = LocalDate.now()
    if (start.isAfter(end)) return ""
    val period = Period.between(start, end)
    val parts = mutableListOf<String>()
    if (period.years > 0) {
        parts += "${period.years} ${if (period.years == 1) "year" else "years"}"
    }
    if (period.months > 0) {
        parts += "${period.months} ${if (period.months == 1) "month" else "months"}"
    }
    if (period.days > 0) {
        parts += "${period.days} ${if (period.days == 1) "day" else "days"}"
    }
    return if (parts.isNotEmpty()) parts.joinToString(" ") else "today"
}

private fun ordinalSuffix(day: Int): String = when {
    day % 100 in 11..13 -> "th"
    day % 10 == 1 -> "st"
    day % 10 == 2 -> "nd"
    day % 10 == 3 -> "rd"
    else -> "th"
}

/**
 * Join date for profile header stat, e.g. "February 21st, 2026".
 */
fun formatMemberJoinDate(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    val start = parseIsoToLocalDate(isoDate) ?: return ""
    val month = start.month.getDisplayName(TextStyle.FULL, Locale.US)
    val day = start.dayOfMonth
    val year = start.year
    return "$month ${day}${ordinalSuffix(day)}, $year"
}

private fun parseIsoToLocalDate(isoDate: String): LocalDate? {
    val trimmed = isoDate.trim()
    return try {
        when {
            trimmed.length >= 10 && trimmed[4] == '-' && trimmed[7] == '-' ->
                LocalDate.parse(trimmed.take(10))
            else -> null
        }
    } catch (_: DateTimeParseException) {
        try {
            val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val date = input.parse(trimmed.take(19)) ?: return null
            val cal = java.util.Calendar.getInstance().apply { time = date }
            LocalDate.of(
                cal.get(java.util.Calendar.YEAR),
                cal.get(java.util.Calendar.MONTH) + 1,
                cal.get(java.util.Calendar.DAY_OF_MONTH)
            )
        } catch (_: Exception) {
            null
        }
    }
}

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
