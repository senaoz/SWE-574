package com.hive.hive_app.ui.main

import org.junit.Assert.assertEquals
import org.junit.Test

class CompleteServiceRatingArgsTest {
    @Test
    fun storesCompletionRatingNavigationPayload() {
        val args = CompleteServiceRatingArgs(
            transactionId = "txn-1",
            serviceTitle = "Guitar lesson",
            otherName = "Alice",
            creditsHours = 2.5,
            ratedUserId = "user-2"
        )

        assertEquals("txn-1", args.transactionId)
        assertEquals("Guitar lesson", args.serviceTitle)
        assertEquals("Alice", args.otherName)
        assertEquals(2.5, args.creditsHours, 0.0)
        assertEquals("user-2", args.ratedUserId)
    }
}
