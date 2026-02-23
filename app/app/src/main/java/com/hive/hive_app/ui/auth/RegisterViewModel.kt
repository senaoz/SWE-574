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
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    sealed class RegisterState {
        data object Idle : RegisterState()
        data object Loading : RegisterState()
        data object Success : RegisterState()
        data class Error(val message: String) : RegisterState()
    }

    private val _state = MutableStateFlow<RegisterState>(RegisterState.Idle)
    val state: StateFlow<RegisterState> = _state.asStateFlow()

    fun register(
        username: String,
        email: String,
        password: String,
        confirmPassword: String,
        fullName: String?
    ) {
        when {
            username.isBlank() -> {
                _state.value = RegisterState.Error("Username is required")
                return
            }
            username.length < 3 -> {
                _state.value = RegisterState.Error("Username must be at least 3 characters")
                return
            }
            email.isBlank() -> {
                _state.value = RegisterState.Error("Email is required")
                return
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                _state.value = RegisterState.Error("Invalid email format")
                return
            }
            password.length < 8 -> {
                _state.value = RegisterState.Error("Password must be at least 8 characters")
                return
            }
            password != confirmPassword -> {
                _state.value = RegisterState.Error("Passwords do not match")
                return
            }
        }

        viewModelScope.launch {
            _state.value = RegisterState.Loading
            val result = authRepository.register(username, email, password, confirmPassword, fullName)
            _state.value = when {
                result.isSuccess -> RegisterState.Success
                result.exceptionOrNull() is HttpException -> {
                    val ex = result.exceptionOrNull() as HttpException
                    val msg = ex.response()?.errorBody()?.string()?.let { body ->
                        try {
                            com.squareup.moshi.Moshi.Builder().build()
                                .adapter(com.hive.hive_app.data.api.HttpValidationError::class.java)
                                .fromJson(body)
                                ?.detail?.firstOrNull()?.msg ?: "Registration failed"
                        } catch (_: Exception) {
                            "Registration failed"
                        }
                    } ?: "Registration failed"
                    RegisterState.Error(msg)
                }
                else -> RegisterState.Error(result.exceptionOrNull()?.message ?: "Network error")
            }
        }
    }
}
