package com.hive.hive_app.ui.main

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.RecommendedServiceItemDto
import com.hive.hive_app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@HiltViewModel
class RecommendationViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    data class RecommendationState(
        val items: List<RecommendedServiceItemDto> = emptyList(),
        val recommendationMode: String = "empty",
        val showProfilePrompt: Boolean = false,
        val isLoading: Boolean = false,
        val error: String? = null,
        val locationPermissionGranted: Boolean = false
    )

    private val _state = MutableStateFlow(RecommendationState())
    val state: StateFlow<RecommendationState> = _state.asStateFlow()

    private val locationManager: LocationManager?
        get() = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

    fun setLocationPermissionGranted(granted: Boolean) {
        _state.update { it.copy(locationPermissionGranted = granted) }
        if (granted) {
            refreshWithLocation()
        } else {
            loadRecommendations()
        }
    }

    fun refresh() {
        if (_state.value.locationPermissionGranted) {
            refreshWithLocation()
        } else {
            loadRecommendations()
        }
    }

    private fun refreshWithLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            loadRecommendations()
            return
        }
        viewModelScope.launch {
            val location = withContext(Dispatchers.IO) {
                locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                    ?: locationManager?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
            }
            loadRecommendations(
                latitude = location?.latitude,
                longitude = location?.longitude
            )
        }
    }

    private fun loadRecommendations(
        latitude: Double? = null,
        longitude: Double? = null
    ) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            val result = servicesRepository.getRecommendedServices(
                page = 1,
                limit = 5,
                latitude = latitude,
                longitude = longitude
            )
            result.fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(
                            items = response.items.take(5),
                            recommendationMode = response.recommendationMode,
                            showProfilePrompt = response.showProfilePrompt,
                            isLoading = false,
                            error = null
                        )
                    }
                },
                onFailure = { failure ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = failure.message ?: "Failed to load recommendations"
                        )
                    }
                }
            )
        }
    }
}
