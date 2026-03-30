package com.hive.hive_app.work

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.hive.hive_app.MainActivity
import com.hive.hive_app.data.auth.AuthTokenStore
import com.hive.hive_app.data.notifications.NotificationPreferencesStore
import com.hive.hive_app.data.repository.NotificationsRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

@HiltWorker
class NotificationPollingWorker @AssistedInject constructor(
    @Assisted private val appContext: Context,
    @Assisted params: WorkerParameters,
    private val notificationsRepository: NotificationsRepository,
    private val notificationPreferencesStore: NotificationPreferencesStore,
    private val authTokenStore: AuthTokenStore
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val token = authTokenStore.accessToken.first() ?: return Result.success()

        val countResult = notificationsRepository.getUnreadCount()
        val currentCount = countResult.getOrNull()?.count ?: return Result.retry()

        val lastCount = notificationPreferencesStore.lastKnownUnreadCount.first()
        if (currentCount > lastCount) {
            val notifResult = notificationsRepository.getNotifications(page = 1, limit = currentCount - lastCount)
            val newNotifs = notifResult.getOrNull()?.notifications
                ?.filter { !it.isRead }
                ?.take(currentCount - lastCount)
                ?: emptyList()

            newNotifs.forEachIndexed { index, notif ->
                postSystemNotification(notif, (System.currentTimeMillis() + index).toInt())
            }

            notificationPreferencesStore.setLastKnownUnreadCount(currentCount)
        }
        return Result.success()
    }

    private fun postSystemNotification(
        notif: com.hive.hive_app.data.api.dto.NotificationResponse,
        notificationId: Int
    ) {
        val intent = Intent(appContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_DESTINATION, "ACTIVE")
            putExtra(EXTRA_RELATED_ID, notif.relatedId)
            putExtra(EXTRA_RELATED_TYPE, notif.relatedType)
        }
        val pendingIntent = PendingIntent.getActivity(
            appContext,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(appContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(notif.title)
            .setContentText(notif.body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            appContext.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            val manager = appContext.getSystemService(NotificationManager::class.java)
            manager.notify(notificationId, notification)
        }
    }

    companion object {
        const val WORK_NAME = "hive_notification_poll"
        const val CHANNEL_ID = "hive_notifications"
        const val EXTRA_DESTINATION = "extra_destination"
        const val EXTRA_RELATED_ID = "extra_related_id"
        const val EXTRA_RELATED_TYPE = "extra_related_type"

        fun enqueue(context: Context) {
            val request = PeriodicWorkRequestBuilder<NotificationPollingWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
