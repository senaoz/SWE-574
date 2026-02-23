package com.hive.hive_app.data.api

import com.hive.hive_app.data.auth.AuthTokenStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class UnauthorizedInterceptor @Inject constructor(
    private val authTokenStore: AuthTokenStore,
    private val unauthorizedHandler: UnauthorizedHandler
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        if (response.code == 401) {
            val url = chain.request().url.encodedPath
            if (!url.contains("/auth/login") && !url.contains("/auth/register")) {
                CoroutineScope(Dispatchers.IO).launch {
                    authTokenStore.clearToken()
                }
                unauthorizedHandler.notifyUnauthorized()
            }
        }
        return response
    }
}
