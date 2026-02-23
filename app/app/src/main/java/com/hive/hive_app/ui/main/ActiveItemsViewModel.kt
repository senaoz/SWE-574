package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.JoinRequestsRepository
import com.hive.hive_app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ActiveItemsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val servicesRepository: ServicesRepository,
    private val joinRequestsRepository: JoinRequestsRepository
) : ViewModel() {

    data class ActiveItemsState(
        val myServices: List<ServiceResponse> = emptyList(),
        val myRequests: List<JoinRequestResponse> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null
    )

    private val _state = MutableStateFlow(ActiveItemsState())
    val state: StateFlow<ActiveItemsState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val userResult = authRepository.getCurrentUser()
            val userId = userResult.getOrNull()?._id
            if (userId == null) {
                _state.value = _state.value.copy(isLoading = false, error = "Not logged in")
                return@launch
            }
            val servicesResult = servicesRepository.getServices(
                page = 1,
                limit = 50,
                userId = userId
            )
            val requestsResult = joinRequestsRepository.getMyRequests(page = 1, limit = 50)
            _state.value = _state.value.copy(
                myServices = servicesResult.getOrNull()?.services?.filter { it.status in listOf("active", "in_progress") } ?: emptyList(),
                myRequests = requestsResult.getOrNull()?.requests ?: emptyList(),
                isLoading = false,
                error = servicesResult.fold({ null }, { it.message }) ?: requestsResult.fold({ null }, { it.message })
            )
        }
    }
}
