package com.hive.hive_app.di

import android.util.Log
import com.hive.hive_app.BuildConfig
import com.hive.hive_app.data.api.AuthApi
import com.hive.hive_app.data.api.AuthInterceptor
import com.hive.hive_app.data.api.UnauthorizedHandler
import com.hive.hive_app.data.api.UnauthorizedInterceptor
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideUnauthorizedInterceptor(
        authTokenStore: com.hive.hive_app.data.auth.AuthTokenStore,
        unauthorizedHandler: UnauthorizedHandler
    ): UnauthorizedInterceptor = UnauthorizedInterceptor(authTokenStore, unauthorizedHandler)

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        unauthorizedInterceptor: UnauthorizedInterceptor
    ): OkHttpClient {
        val logging = HttpLoggingInterceptor { message ->
            Log.d("OkHttp", message)
        }.apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
        }
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(unauthorizedInterceptor)
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, moshi: Moshi): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL.trimEnd('/') + "/")
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)

    @Provides
    @Singleton
    fun provideServicesApi(retrofit: Retrofit): com.hive.hive_app.data.api.ServicesApi =
        retrofit.create(com.hive.hive_app.data.api.ServicesApi::class.java)

    @Provides
    @Singleton
    fun provideJoinRequestsApi(retrofit: Retrofit): com.hive.hive_app.data.api.JoinRequestsApi =
        retrofit.create(com.hive.hive_app.data.api.JoinRequestsApi::class.java)

    @Provides
    @Singleton
    fun provideUsersApi(retrofit: Retrofit): com.hive.hive_app.data.api.UsersApi =
        retrofit.create(com.hive.hive_app.data.api.UsersApi::class.java)
}
