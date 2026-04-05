package com.hive.hive_app.di

import androidx.hilt.work.HiltWorkerFactory
import androidx.work.WorkerFactory
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
interface WorkerModule {
    @Binds
    fun bindWorkerFactory(factory: HiltWorkerFactory): WorkerFactory
}
