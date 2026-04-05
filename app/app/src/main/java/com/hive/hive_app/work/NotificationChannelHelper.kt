package com.hive.hive_app.work

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context

object NotificationChannelHelper {
    fun createChannel(context: Context) {
        val channel = NotificationChannel(
            NotificationPollingWorker.CHANNEL_ID,
            "Hive Notifications",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Join request and transaction notifications"
        }
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }
}
