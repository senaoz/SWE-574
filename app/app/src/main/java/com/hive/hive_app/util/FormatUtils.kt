package com.hive.hive_app.util

/** Formats duration in hours as whole hours only, e.g. 2.5 -> "3h", 1.0 -> "1h". */
fun formatDurationHours(hours: Double): String =
    "${kotlin.math.round(hours).toInt()}h"
