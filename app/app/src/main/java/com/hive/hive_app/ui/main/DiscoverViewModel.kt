package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository
) : ViewModel() {

    data class DiscoverState(
        val services: List<ServiceResponse> = emptyList(),
        val total: Int = 0,
        val page: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val filterType: String? = null
    )

    private val _state = MutableStateFlow(DiscoverState())
    val state: StateFlow<DiscoverState> = _state.asStateFlow()

    fun loadServices(
        page: Int = 1,
        serviceType: String? = _state.value.filterType
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val result = servicesRepository.getServices(
                page = page,
                limit = 20,
                serviceType = serviceType
            )
            result.fold(
                onSuccess = { listResponse ->
                    val excludedStatuses = setOf("completed", "expired")
                    val filtered = listResponse.services.filter {
                        it.status.lowercase() !in excludedStatuses
                    }
                    _state.value = _state.value.copy(
                        services = if (page == 1) filtered else _state.value.services + filtered,
                        total = listResponse.total,
                        page = listResponse.page,
                        isLoading = false,
                        error = null
                    )
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load services"
                    )
                }
            )
        }
    }

    fun setFilter(serviceType: String?) {
        _state.value = _state.value.copy(filterType = serviceType)
        loadServices(page = 1, serviceType = serviceType)
    }

    fun refresh() = loadServices(page = 1)
}
