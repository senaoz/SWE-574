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
        val isRefreshing: Boolean = false,
        val hasLoadedOnce: Boolean = false,
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
            refreshWithLocation(isPullToRefresh = false)
        } else {
            loadRecommendations(isPullToRefresh = false)
        }
    }

    fun refresh() {
        if (_state.value.locationPermissionGranted) {
            refreshWithLocation(isPullToRefresh = true)
        } else {
            loadRecommendations(isPullToRefresh = true)
        }
    }

    fun loadInitial() {
        if (_state.value.hasLoadedOnce) return
        if (_state.value.locationPermissionGranted) {
            refreshWithLocation(isPullToRefresh = false)
        } else {
            loadRecommendations(isPullToRefresh = false)
        }
    }

    private fun refreshWithLocation(isPullToRefresh: Boolean) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            loadRecommendations(isPullToRefresh = isPullToRefresh)
            return
        }
        viewModelScope.launch {
            val location = withContext(Dispatchers.IO) {
                locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                    ?: locationManager?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
            }
            loadRecommendations(
                latitude = location?.latitude,
                longitude = location?.longitude,
                isPullToRefresh = isPullToRefresh
            )
        }
    }

    private fun loadRecommendations(
        latitude: Double? = null,
        longitude: Double? = null,
        isPullToRefresh: Boolean = false
    ) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    isLoading = !isPullToRefresh,
                    isRefreshing = isPullToRefresh,
                    error = null
                )
            }
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
                            isRefreshing = false,
                            hasLoadedOnce = true,
                            error = null
                        )
                    }
                },
                onFailure = { failure ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            hasLoadedOnce = true,
                            error = failure.message ?: "Failed to load recommendations"
                        )
                    }
                }
            )
        }
    }
}
