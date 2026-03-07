package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.TransactionsApi
import com.hive.hive_app.data.api.dto.TransactionListResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import javax.inject.Inject
import javax.inject.Singleton
import retrofit2.HttpException

@Singleton
class TransactionsRepository @Inject constructor(
    private val api: TransactionsApi
) {
    suspend fun getMyTransactions(page: Int = 1, limit: Int = 100): Result<TransactionListResponse> {
        return try {
            val response = api.getMyTransactions(page = page, limit = limit)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTransaction(transactionId: String): Result<TransactionResponse?> {
        return try {
            val response = api.getTransaction(transactionId)
            when {
                response.isSuccessful && response.body() != null -> Result.success(response.body())
                response.code() == 404 -> Result.success(null)
                else -> Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun confirmCompletion(transactionId: String): Result<TransactionResponse> {
        return try {
            val response = api.confirmCompletion(transactionId)
            if (response.isSuccessful && response.body() != null) Result.success(response.body()!!)
            else Result.failure(HttpException(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
