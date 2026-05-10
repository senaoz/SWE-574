package com.hive.hive_app.data.api

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UnauthorizedHandler @Inject constructor() {
    var onUnauthorized: (() -> Unit)? = null

    fun notifyUnauthorized() {
        val callback = onUnauthorized ?: return
        CoroutineScope(Dispatchers.Main).launch {
            callback()
        }
    }
}
