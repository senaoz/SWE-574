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
class ServiceDetailViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository
) : ViewModel() {

    private val _state = MutableStateFlow<ServiceResponse?>(null)
    val state: StateFlow<ServiceResponse?> = _state.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load(serviceId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _state.value = null
            servicesRepository.getService(serviceId).fold(
                onSuccess = {
                    _state.value = it
                    _isLoading.value = false
                },
                onFailure = {
                    _error.value = it.message ?: "Failed to load"
                    _isLoading.value = false
                }
            )
        }
    }
}
