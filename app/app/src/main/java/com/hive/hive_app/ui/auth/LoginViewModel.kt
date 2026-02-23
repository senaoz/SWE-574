package com.hive.hive_app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    sealed class LoginState {
        data object Idle : LoginState()
        data object Loading : LoginState()
        data object Success : LoginState()
        data class Error(val message: String, val field: String? = null) : LoginState()
    }

    private val _state = MutableStateFlow<LoginState>(LoginState.Idle)
    val state: StateFlow<LoginState> = _state.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank()) {
            _state.value = LoginState.Error("Email is required", "email")
            return
        }
        if (password.isBlank()) {
            _state.value = LoginState.Error("Password is required", "password")
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _state.value = LoginState.Error("Invalid email format", "email")
            return
        }

        viewModelScope.launch {
            _state.value = LoginState.Loading
            val result = authRepository.login(email, password)
            _state.value = when {
                result.isSuccess -> LoginState.Success
                result.exceptionOrNull() is HttpException -> {
                    val ex = result.exceptionOrNull() as HttpException
                    val msg = ex.response()?.errorBody()?.string()?.let { body ->
                        try {
                            com.squareup.moshi.Moshi.Builder().build()
                                .adapter(com.hive.hive_app.data.api.HttpValidationError::class.java)
                                .fromJson(body)
                                ?.detail?.firstOrNull()?.msg ?: "Login failed"
                        } catch (_: Exception) {
                            "Login failed"
                        }
                    } ?: "Login failed"
                    LoginState.Error(msg)
                }
                else -> LoginState.Error(result.exceptionOrNull()?.message ?: "Network error")
            }
        }
    }

    fun clearError() {
        if (_state.value is LoginState.Error) _state.value = LoginState.Idle
    }
}
