package com.hive.hive_app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.hive.hive_app.work.NotificationChannelHelper
import com.hive.hive_app.work.NotificationPollingWorker
import dagger.hilt.android.HiltAndroidApp
import org.osmdroid.config.Configuration as OsmConfiguration
import javax.inject.Inject

@HiltAndroidApp
class HiveApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        OsmConfiguration.getInstance().apply {
            userAgentValue = packageName
        }
        NotificationChannelHelper.createChannel(this)
        NotificationPollingWorker.enqueue(this)
    }
}
