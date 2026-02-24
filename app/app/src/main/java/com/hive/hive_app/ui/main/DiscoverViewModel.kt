package com.hive.hive_app.ui.main

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import javax.inject.Inject
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

enum class DiscoverSortOrder(val label: String) {
    DURATION("Duration"),
    ACCEPTED("Accepted"),
    CAPACITY("Capacity"),
    DISTANCE("Distance")
}

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    data class DiscoverState(
        val services: List<ServiceResponse> = emptyList(),
        val displayedServices: List<ServiceResponse> = emptyList(),
        val total: Int = 0,
        val page: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val filterType: String? = null,
        val searchQuery: String = "",
        val sortOrder: DiscoverSortOrder = DiscoverSortOrder.DURATION,
        val userLat: Double? = null,
        val userLon: Double? = null,
        val locationPermissionGranted: Boolean = false
    )

    private val _state = MutableStateFlow(DiscoverState())
    val state: StateFlow<DiscoverState> = _state.asStateFlow()

    private val locationManager: android.location.LocationManager?
        get() = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager

    fun setLocationPermissionGranted(granted: Boolean) {
        _state.update { it.copy(locationPermissionGranted = granted) }
        if (granted) refreshLocation()
    }

    fun refreshLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        viewModelScope.launch {
            val loc = withContext(Dispatchers.IO) {
                locationManager?.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                    ?: locationManager?.getLastKnownLocation(android.location.LocationManager.PASSIVE_PROVIDER)
            }
            _state.update {
                it.copy(
                    userLat = loc?.latitude,
                    userLon = loc?.longitude
                )
            }
            applySearchAndSort()
        }
    }

    fun loadServices(
        page: Int = 1,
        serviceType: String? = _state.value.filterType
    ) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            val result = servicesRepository.getServices(
                page = page,
                limit = 100,
                serviceType = serviceType
            )
            result.fold(
                onSuccess = { listResponse ->
                    val excludedStatuses = setOf("completed", "expired")
                    val filtered = listResponse.services.filter {
                        it.status.lowercase() !in excludedStatuses
                    }
                    _state.update {
                        it.copy(
                            services = if (page == 1) filtered else it.services + filtered,
                            total = listResponse.total,
                            page = listResponse.page,
                            isLoading = false,
                            error = null
                        )
                    }
                    applySearchAndSort()
                },
                onFailure = { failure ->
                    _state.update { state ->
                        state.copy(
                            isLoading = false,
                            error = failure.message ?: "Failed to load services"
                        )
                    }
                }
            )
        }
    }

    fun setSearchQuery(query: String) {
        _state.update { it.copy(searchQuery = query) }
        applySearchAndSort()
    }

    fun setSortOrder(order: DiscoverSortOrder) {
        _state.update { it.copy(sortOrder = order) }
        applySearchAndSort()
    }

    fun setFilter(serviceType: String?) {
        _state.update { it.copy(filterType = serviceType) }
        loadServices(page = 1, serviceType = serviceType)
    }

    fun refresh() = loadServices(page = 1)

    private fun applySearchAndSort() {
        val s = _state.value
        val query = s.searchQuery.trim().lowercase()
        val filtered = if (query.isEmpty()) s.services else s.services.filter { service ->
            service.title.lowercase().contains(query) ||
                service.description.lowercase().contains(query) ||
                service.tags.any { tag ->
                    (tag.label?.lowercase()?.contains(query) == true) ||
                        (tag.name?.lowercase()?.contains(query) == true)
                }
            }
        val sorted = when (s.sortOrder) {
            DiscoverSortOrder.DURATION -> filtered.sortedBy { it.estimatedDuration }
            DiscoverSortOrder.ACCEPTED -> filtered.sortedByDescending { it.matchedUserIds?.size ?: 0 }
            DiscoverSortOrder.CAPACITY -> filtered.sortedByDescending { it.maxParticipants ?: 1 }
            DiscoverSortOrder.DISTANCE -> {
                val lat = s.userLat
                val lon = s.userLon
                if (lat != null && lon != null) {
                    filtered.sortedBy { service ->
                        service.location?.let { loc ->
                            distanceKm(lat, lon, loc.latitude, loc.longitude)
                        } ?: Double.MAX_VALUE
                    }
                } else filtered
            }
        }
        _state.update { it.copy(displayedServices = sorted) }
    }

    private fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    /** Distance in km from user to service, or null if no location. */
    fun distanceToService(service: ServiceResponse): Double? {
        val s = _state.value
        val lat = s.userLat ?: return null
        val lon = s.userLon ?: return null
        val loc = service.location ?: return null
        return distanceKm(lat, lon, loc.latitude, loc.longitude)
    }
}
