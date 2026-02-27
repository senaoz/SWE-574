package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.JoinRequestsRepository
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
    private val usersRepository: UsersRepository,
    private val authRepository: AuthRepository,
    private val joinRequestsRepository: JoinRequestsRepository
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

    private val _isOwner = MutableStateFlow(false)
    val isOwner: StateFlow<Boolean> = _isOwner.asStateFlow()

    private val _joinRequests = MutableStateFlow<List<JoinRequestResponse>>(emptyList())
    val joinRequests: StateFlow<List<JoinRequestResponse>> = _joinRequests.asStateFlow()

    private val _applyMessage = MutableStateFlow<String?>(null)
    val applyMessage: StateFlow<String?> = _applyMessage.asStateFlow()

    /** Current user's join request for this service (if any): used to show "Pending" / "Approved" instead of Apply. */
    private val _myJoinRequestForService = MutableStateFlow<JoinRequestResponse?>(null)
    val myJoinRequestForService: StateFlow<JoinRequestResponse?> = _myJoinRequestForService.asStateFlow()

    fun load(serviceId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _state.value = null
            _creator.value = null
            _acceptedUsers.value = emptyList()
            _joinRequests.value = emptyList()
            _myJoinRequestForService.value = null
            val currentUser = authRepository.getCurrentUser().getOrNull()
            servicesRepository.getService(serviceId).fold(
                onSuccess = { service ->
                    _state.value = service
                    _isOwner.value = currentUser?._id == service.userId
                    _isLoading.value = false
                    usersRepository.getUser(service.userId).fold(
                        onSuccess = { _creator.value = it },
                        onFailure = { _creator.value = null }
                    )
                    val ids = service.matchedUserIds?.distinct().orEmpty()
                    _acceptedUsers.value = ids.mapNotNull { id ->
                        usersRepository.getUser(id).getOrNull()
                    }
                    if (currentUser?._id == service.userId) {
                        loadServiceRequests(serviceId)
                    } else {
                        loadMyJoinRequestForService(serviceId)
                    }
                },
                onFailure = {
                    _error.value = it.message ?: "Failed to load"
                    _isLoading.value = false
                }
            )
        }
    }

    fun loadServiceRequests(serviceId: String) {
        viewModelScope.launch {
            joinRequestsRepository.getServiceRequests(serviceId, page = 1, limit = 50).fold(
                onSuccess = { _joinRequests.value = it.requests },
                onFailure = { }
            )
        }
    }

    private fun loadMyJoinRequestForService(serviceId: String) {
        viewModelScope.launch {
            joinRequestsRepository.getPendingRequestForService(serviceId).fold(
                onSuccess = { pending ->
                    if (pending != null) {
                        _myJoinRequestForService.value = pending
                    } else {
                        joinRequestsRepository.getMyRequests(page = 1, limit = 100).fold(
                            onSuccess = { list ->
                                _myJoinRequestForService.value = list.requests
                                    .firstOrNull { it.serviceId == serviceId }
                            },
                            onFailure = { }
                        )
                    }
                },
                onFailure = {
                    joinRequestsRepository.getMyRequests(page = 1, limit = 100).fold(
                        onSuccess = { list ->
                            _myJoinRequestForService.value = list.requests
                                .firstOrNull { it.serviceId == serviceId }
                        },
                        onFailure = { }
                    )
                }
            )
        }
    }

    fun createJoinRequest(serviceId: String, message: String?, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            _applyMessage.value = null
            joinRequestsRepository.create(serviceId, message).fold(
                onSuccess = { created ->
                    _myJoinRequestForService.value = created
                    _applyMessage.value = "Application submitted"
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    fun updateRequestStatus(requestId: String, status: String, adminMessage: String?, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            joinRequestsRepository.updateStatus(requestId, status, adminMessage).fold(
                onSuccess = {
                    _state.value?.let { loadServiceRequests(it._id) }
                    onResult(true)
                },
                onFailure = { onResult(false) }
            )
        }
    }
}
