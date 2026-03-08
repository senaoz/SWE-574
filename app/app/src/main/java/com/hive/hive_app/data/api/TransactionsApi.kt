package com.hive.hive_app.data.api

import com.hive.hive_app.data.api.dto.TransactionListResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TransactionsApi {
    @GET("transactions/my-transactions")
    suspend fun getMyTransactions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100
    ): Response<TransactionListResponse>

    @GET("transactions/{transaction_id}")
    suspend fun getTransaction(@Path("transaction_id") transactionId: String): Response<TransactionResponse>

    @POST("transactions/{transaction_id}/confirm-completion")
    suspend fun confirmCompletion(@Path("transaction_id") transactionId: String): Response<TransactionResponse>
}
