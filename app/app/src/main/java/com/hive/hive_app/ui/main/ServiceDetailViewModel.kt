package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.ServicesRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ServiceDetailViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    private val usersRepository: UsersRepository
) : ViewModel() {

    private val _state = MutableStateFlow<ServiceResponse?>(null)
    val state: StateFlow<ServiceResponse?> = _state.asStateFlow()

    private val _creator = MutableStateFlow<UserResponse?>(null)
    val creator: StateFlow<UserResponse?> = _creator.asStateFlow()

    private val _acceptedUsers = MutableStateFlow<List<UserResponse>>(emptyList())
    val acceptedUsers: StateFlow<List<UserResponse>> = _acceptedUsers.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load(serviceId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _state.value = null
            _creator.value = null
            _acceptedUsers.value = emptyList()
            servicesRepository.getService(serviceId).fold(
                onSuccess = { service ->
                    _state.value = service
                    _isLoading.value = false
                    usersRepository.getUser(service.userId).fold(
                        onSuccess = { _creator.value = it },
                        onFailure = { _creator.value = null }
                    )
                    val ids = service.matchedUserIds?.distinct().orEmpty()
                    _acceptedUsers.value = ids.mapNotNull { id ->
                        usersRepository.getUser(id).getOrNull()
                    }
                },
                onFailure = {
                    _error.value = it.message ?: "Failed to load"
                    _isLoading.value = false
                }
            )
        }
    }
}
