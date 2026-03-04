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
class SavedServicesViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository
) : ViewModel() {

    private val _services = MutableStateFlow<List<ServiceResponse>>(emptyList())
    val services: StateFlow<List<ServiceResponse>> = _services.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            servicesRepository.getSavedServices(page = 1, limit = 50).fold(
                onSuccess = { _services.value = it.services },
                onFailure = { _error.value = it.message }
            )
            _isLoading.value = false
        }
    }
}
