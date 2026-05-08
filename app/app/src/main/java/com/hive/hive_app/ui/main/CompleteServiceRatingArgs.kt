package com.hive.hive_app.ui.main

/**
 * Args for the full-screen "Confirm completion & rate" flow (same data as former dialog).
 */
data class CompleteServiceRatingArgs(
    val transactionId: String,
    val serviceTitle: String,
    val otherName: String,
    val creditsHours: Double,
    val ratedUserId: String
)
