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
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ActiveItemsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val servicesRepository: ServicesRepository,
    private val joinRequestsRepository: JoinRequestsRepository
) : ViewModel() {

    data class ActiveItemsState(
        val myActiveServices: List<ServiceResponse> = emptyList(),
        val applicationsSubmitted: List<JoinRequestResponse> = emptyList(),
        /** Service ID -> display title for application cards */
        val applicationServiceTitles: Map<String, String> = emptyMap(),
        val acceptedParticipation: List<ServiceResponse> = emptyList(),
        val myRequestsStatusFilter: String? = null,
        val pendingCount: Int = 0,
        val approvedCount: Int = 0,
        val rejectedCount: Int = 0,
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
                limit = 100,
                userId = userId
            )
            val requestsResult = joinRequestsRepository.getMyRequests(page = 1, limit = 100)
            val activeStatuses = listOf("active", "in_progress")
            val excludedStatuses = listOf("expired", "completed")
            val myActiveServices = servicesResult.getOrNull()?.services
                ?.filter { it.status in activeStatuses && it.status !in excludedStatuses }
                ?: emptyList()
            val allRequests = requestsResult.getOrNull()?.requests ?: emptyList()
            val pendingCount = allRequests.count { it.status == "pending" }
            val approvedCount = allRequests.count { it.status == "approved" }
            val rejectedCount = allRequests.count { it.status == "rejected" }
            val statusFilter = _state.value.myRequestsStatusFilter
            val applicationsSubmitted = if (statusFilter != null) {
                allRequests.filter { it.status == statusFilter }
            } else {
                allRequests.filter { it.status in listOf("pending", "approved", "rejected") }
            }
            val approvedRequests = allRequests.filter { it.status == "approved" }
            val acceptedServiceIds = approvedRequests.map { it.serviceId }.distinct()
            val acceptedParticipation = acceptedServiceIds.mapNotNull { serviceId ->
                servicesRepository.getService(serviceId).getOrNull()
            }
            val applicationServiceIds = applicationsSubmitted.map { it.serviceId }.distinct()
            val applicationServiceTitles = coroutineScope {
                applicationServiceIds.map { id ->
                    async {
                        val service = servicesRepository.getService(id).getOrNull()
                        id to (service?.title ?: "")
                    }
                }.awaitAll().toMap()
            }
            _state.value = _state.value.copy(
                myActiveServices = myActiveServices,
                applicationsSubmitted = applicationsSubmitted,
                applicationServiceTitles = applicationServiceTitles,
                acceptedParticipation = acceptedParticipation,
                pendingCount = pendingCount,
                approvedCount = approvedCount,
                rejectedCount = rejectedCount,
                isLoading = false,
                error = servicesResult.fold({ null }, { it.message })
                    ?: requestsResult.fold({ null }, { it.message })
            )
        }
    }

    fun setMyRequestsStatusFilter(status: String?) {
        _state.value = _state.value.copy(myRequestsStatusFilter = status)
        load()
    }

    fun cancelRequest(requestId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            joinRequestsRepository.cancel(requestId).fold(
                onSuccess = {
                    load()
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }
}
