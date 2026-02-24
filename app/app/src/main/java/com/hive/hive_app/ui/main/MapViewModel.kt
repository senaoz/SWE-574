package com.hive.hive_app.ui.main

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import javax.inject.Inject
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@HiltViewModel
class MapViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    data class MapState(
        val services: List<ServiceResponse> = emptyList(),
        val offerCount: Int = 0,
        val needCount: Int = 0,
        val userLat: Double? = null,
        val userLon: Double? = null,
        val filterType: String? = null,
        val filterTag: String? = null,
        val sortByDistance: Boolean = true,
        val isLoading: Boolean = false,
        val error: String? = null,
        val locationPermissionGranted: Boolean = false
    )

    private val _state = MutableStateFlow(MapState())
    val state: StateFlow<MapState> = _state.asStateFlow()

    private val locationManager: LocationManager?
        get() = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

    fun setLocationPermissionGranted(granted: Boolean) {
        _state.value = _state.value.copy(locationPermissionGranted = granted)
        if (granted) refreshLocation()
    }

    fun refreshLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        viewModelScope.launch {
            val loc = withContext(Dispatchers.IO) {
                locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                    ?: locationManager?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
            }
            if (loc != null) {
                _state.value = _state.value.copy(
                    userLat = loc.latitude,
                    userLon = loc.longitude
                )
                loadServices()
            } else {
                loadServices()
            }
        }
    }

    /** Request a fresh location fix and center/sort on it (e.g. when user taps "Near me"). */
    fun requestFreshLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val mgr = locationManager ?: return
        try {
            mgr.requestSingleUpdate(
                LocationManager.NETWORK_PROVIDER,
                object : LocationListener {
                    override fun onLocationChanged(loc: Location) {
                        _state.value = _state.value.copy(
                            userLat = loc.latitude,
                            userLon = loc.longitude,
                            sortByDistance = true
                        )
                        loadServices()
                    }
                },
                Looper.getMainLooper()
            )
        } catch (_: SecurityException) { }
    }

    fun loadServices() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val s = _state.value
            val useLocation = s.sortByDistance && s.userLat != null && s.userLon != null
            // Always load all types so we can show correct offer/need counts
            var result = servicesRepository.getServices(
                page = 1,
                limit = 100,
                serviceType = null,
                tags = s.filterTag?.takeIf { it.isNotBlank() },
                latitude = if (useLocation) s.userLat else null,
                longitude = if (useLocation) s.userLon else null,
                radius = if (useLocation) 50.0 else null
            )
            if (useLocation && result.isSuccess && result.getOrNull()?.services?.isEmpty() == true) {
                result = servicesRepository.getServices(
                    page = 1,
                    limit = 100,
                    serviceType = null,
                    tags = s.filterTag?.takeIf { it.isNotBlank() },
                    latitude = null,
                    longitude = null,
                    radius = null
                )
            }
            result.fold(
                onSuccess = { listResponse ->
                    val fullList = listResponse.services.filter { it.location != null }
                    val offerCount = fullList.count { it.serviceType == "offer" }
                    val needCount = fullList.count { it.serviceType == "need" }
                    var list = if (s.filterType == null) fullList else fullList.filter { it.serviceType == s.filterType }
                    if (s.sortByDistance && s.userLat != null && s.userLon != null) {
                        list = list.sortedBy { service ->
                            service.location?.let { loc ->
                                distanceKm(s.userLat!!, s.userLon!!, loc.latitude, loc.longitude)
                            } ?: Double.MAX_VALUE
                        }
                    }
                    _state.value = _state.value.copy(
                        services = list,
                        offerCount = offerCount,
                        needCount = needCount,
                        isLoading = false,
                        error = null
                    )
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load map services"
                    )
                }
            )
        }
    }

    fun setFilterType(type: String?) {
        _state.value = _state.value.copy(filterType = type)
        loadServices()
    }

    fun setFilterTag(tag: String?) {
        _state.value = _state.value.copy(filterTag = tag)
    }

    fun setSortByDistance(sort: Boolean) {
        _state.value = _state.value.copy(sortByDistance = sort)
        if (sort) requestFreshLocation()
        else if (_state.value.services.isNotEmpty()) {
            val s = _state.value
            val list = if (sort && s.userLat != null && s.userLon != null) {
                s.services.sortedBy { service ->
                    service.location?.let { loc ->
                        distanceKm(s.userLat!!, s.userLon!!, loc.latitude, loc.longitude)
                    } ?: Double.MAX_VALUE
                }
            } else s.services
            _state.value = _state.value.copy(services = list)
        }
    }

    /** Approximate distance in km (Haversine). */
    private fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}
