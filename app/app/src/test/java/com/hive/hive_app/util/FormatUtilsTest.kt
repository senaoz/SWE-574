package com.hive.hive_app.util

import com.hive.hive_app.data.api.dto.LocationDto
import com.hive.hive_app.data.api.dto.ServiceResponse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.LocalDate

class FormatUtilsTest {
    @Test
    fun formatsDurationHoursAsRoundedWholeHours() {
        assertEquals("1h", formatDurationHours(1.2))
        assertEquals("2h", formatDurationHours(1.5))
        assertEquals("3h", formatDurationHours(2.6))
    }

    @Test
    fun formatsApplicationDatesAndFallsBackForInvalidInput() {
        assertEquals("Apr 27, 2026", formatApplicationDate("2026-04-27T10:00:00"))
        assertEquals("Apr 27, 2026", formatApplicationDate("2026-04-27"))
        assertEquals("", formatApplicationDate(null))
        assertEquals("not-a-date", formatApplicationDate("not-a-date"))
    }

    @Test
    fun formatsApplicationDateTimeAndFallsBackToDateOnly() {
        assertEquals(
            "Apr 27, 2026 \u00b7 10:30 AM",
            formatApplicationDateTime("2026-04-27T10:30:00")
        )
        assertEquals("Apr 27, 2026", formatApplicationDateTime("2026-04-27"))
        assertEquals("", formatApplicationDateTime(""))
    }

    @Test
    fun formatsOrdinalDatesWithCorrectSuffixes() {
        assertEquals("1st of January 2026", formatLongOrdinalDate("2026-01-01"))
        assertEquals("2nd of January 2026", formatLongOrdinalDate("2026-01-02"))
        assertEquals("3rd of January 2026", formatLongOrdinalDate("2026-01-03"))
        assertEquals("11th of January 2026", formatLongOrdinalDate("2026-01-11"))
        assertEquals("23rd of January 2026", formatLongOrdinalDate("2026-01-23"))
        assertEquals("", formatLongOrdinalDate("bad-date"))
    }

    @Test
    fun formatsMemberJoinDateAndMembershipDurationEdgeCases() {
        assertEquals("February 21st, 2026", formatMemberJoinDate("2026-02-21T08:00:00"))
        assertEquals("", formatMemberJoinDate(null))
        assertEquals("", formatMemberJoinDate("bad-date"))

        assertEquals("", formatMemberSinceDuration(null))
        assertEquals("", formatMemberSinceDuration("bad-date"))
        assertEquals("", formatMemberSinceDuration(LocalDate.now().plusDays(1).toString()))
        assertEquals("today", formatMemberSinceDuration(LocalDate.now().toString()))
    }

    @Test
    fun formatsRawDatesForDisplayOnlyWhenPresent() {
        assertEquals("Apr 27, 2026", formatRawDateForDisplay("2026-04-27"))
        assertEquals("Apr 27, 2026", formatRawDateForDisplay("2026-04-27T10:00:00"))
        assertEquals("not-a-date", formatRawDateForDisplay("not-a-date"))
        assertNull(formatRawDateForDisplay(null))
        assertNull(formatRawDateForDisplay("   "))
    }

    @Test
    fun formatsServiceSchedulingDisplayFromSpecificOrOpenAvailability() {
        assertEquals(
            "Apr 27, 2026 at 10:00",
            formatServiceSchedulingDisplay(
                service(specificDate = "2026-04-27", specificTime = "10:00")
            )
        )
        assertEquals(
            "Apr 27, 2026",
            formatServiceSchedulingDisplay(service(specificDate = "2026-04-27"))
        )
        assertEquals(
            "Open Availability - Weekends",
            formatServiceSchedulingDisplay(service(openAvailability = "Weekends"))
        )
        assertEquals(
            "Open Availability - Flexible mornings",
            formatServiceSchedulingDisplay(
                service(schedulingType = "open", description = "Flexible mornings")
            )
        )
        assertNull(formatServiceSchedulingDisplay(service()))
    }

    private fun service(
        description: String = "",
        schedulingType: String? = null,
        specificDate: String? = null,
        specificTime: String? = null,
        openAvailability: String? = null
    ) = ServiceResponse(
        _id = "service-1",
        title = "Guitar lesson",
        description = description,
        tags = emptyList(),
        estimatedDuration = 1.0,
        location = LocationDto(latitude = 41.0, longitude = 29.0),
        serviceType = "offer",
        userId = "user-1",
        createdAt = "2026-01-01T00:00:00",
        updatedAt = "2026-01-01T00:00:00",
        schedulingType = schedulingType,
        specificDate = specificDate,
        specificTime = specificTime,
        openAvailability = openAvailability
    )
}
