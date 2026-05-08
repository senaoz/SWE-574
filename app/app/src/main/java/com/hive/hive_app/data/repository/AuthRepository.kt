package com.hive.hive_app.data.repository

import com.hive.hive_app.data.api.AuthApi
import com.hive.hive_app.data.api.dto.UserCreate
import com.hive.hive_app.data.api.dto.UserLogin
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.auth.AuthTokenStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val authTokenStore: AuthTokenStore
) {
    val isLoggedIn: Flow<Boolean> = authTokenStore.accessToken.map { it != null }

    suspend fun login(email: String, password: String): Result<UserResponse> {
        return try {
            val response = authApi.login(UserLogin(email = email, password = password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    authTokenStore.setToken(body.accessToken)
                    val me = authApi.me()
                    if (me.isSuccessful && me.body() != null) {
                        Result.success(me.body()!!)
                    } else {
                        Result.success(UserResponse(_id = "", username = "", email = email, createdAt = "", updatedAt = ""))
                    }
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: IOException) {
            Result.failure(e)
        } catch (e: HttpException) {
            Result.failure(e)
        }
    }

    suspend fun register(
        username: String,
        email: String,
        password: String,
        confirmPassword: String,
        fullName: String? = null
    ): Result<UserResponse> {
        return try {
            val response = authApi.register(
                UserCreate(
                    username = username,
                    email = email,
                    password = password,
                    confirmPassword = confirmPassword,
                    fullName = fullName
                )
            )
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    authTokenStore.setToken(body.accessToken)
                    val me = authApi.me()
                    if (me.isSuccessful && me.body() != null) {
                        Result.success(me.body()!!)
                    } else {
                        Result.success(UserResponse(_id = "", username = username, email = email, createdAt = "", updatedAt = ""))
                    }
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: IOException) {
            Result.failure(e)
        } catch (e: HttpException) {
            Result.failure(e)
        }
    }

    suspend fun getCurrentUser(): Result<UserResponse> {
        return try {
            val response = authApi.me()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: IOException) {
            Result.failure(e)
        } catch (e: HttpException) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        authTokenStore.clearToken()
    }

    suspend fun hasToken(): Boolean = authTokenStore.accessToken.first() != null
}
