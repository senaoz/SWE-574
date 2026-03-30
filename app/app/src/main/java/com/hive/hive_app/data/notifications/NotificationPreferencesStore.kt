package com.hive.hive_app.data.notifications

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.notifDataStore: DataStore<Preferences> by preferencesDataStore(name = "notifications")

@Singleton
class NotificationPreferencesStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val lastKnownCountKey = intPreferencesKey("last_known_unread_count")

    val lastKnownUnreadCount: Flow<Int> = context.notifDataStore.data.map { prefs ->
        prefs[lastKnownCountKey] ?: 0
    }

    suspend fun setLastKnownUnreadCount(count: Int) {
        context.notifDataStore.edit { prefs ->
            prefs[lastKnownCountKey] = count
        }
    }
}
