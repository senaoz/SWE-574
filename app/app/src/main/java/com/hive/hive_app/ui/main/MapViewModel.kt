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
import com.hive.hive_app.data.api.dto.ForumEventResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.repository.ForumRepository
import com.hive.hive_app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.DayOfWeek
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

@HiltViewModel
class MapViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    private val forumRepository: ForumRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    enum class TimeOfDayFilter {
        ANYTIME,
        MORNING,
        AFTERNOON,
        EVENING,
        NIGHT
    }

    sealed class DateFilter {
        data object ANYTIME : DateFilter()
        data object TODAY : DateFilter()
        data object TOMORROW : DateFilter()
        data object WEEKEND : DateFilter()
        data object NEXT_WEEKEND : DateFilter()
        data class SPECIFIC(val date: LocalDate) : DateFilter()
    }

    data class ViewportBounds(
        val northLat: Double,
        val southLat: Double,
        val eastLon: Double,
        val westLon: Double
    )

    data class MapState(
        /** Full active service list (all types); type filtering is applied in [recomputeVisible] and map overlay helpers. */
        val services: List<ServiceResponse> = emptyList(),
        val events: List<ForumEventResponse> = emptyList(),
        val offerCount: Int = 0,
        val needCount: Int = 0,
        val userLat: Double? = null,
        val userLon: Double? = null,
        /** `null` = all, `"offer"`, `"need"`, `"event"` = events only for list/map type filter. */
        val filterType: String? = null,
        val filterTag: String? = null,
        /** Client-side filter on titles, descriptions, and tags (services and events). */
        val mapSearchQuery: String = "",
        val sortByDistance: Boolean = true,
        val filterTimeOfDay: TimeOfDayFilter = TimeOfDayFilter.ANYTIME,
        val filterDate: DateFilter = DateFilter.ANYTIME,
        val viewport: ViewportBounds? = null,
        val visibleServices: List<ServiceResponse> = emptyList(),
        val visibleEvents: List<ForumEventResponse> = emptyList(),
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

    /** Request a fresh location fix and center/sort on it (used by "Near me" sorting). */
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

    /** One-shot: refresh user location without changing sort/filter or reloading services. */
    fun requestFreshLocationForCenter() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val mgr = locationManager ?: return
        try {
            mgr.requestSingleUpdate(
                LocationManager.NETWORK_PROVIDER,
                object : LocationListener {
                    override fun onLocationChanged(loc: Location) {
                        _state.update { it.copy(userLat = loc.latitude, userLon = loc.longitude) }
                        recomputeVisible()
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
            // Do not pass latitude/longitude/radius: forum events load globally, but a 50km service
            // query left almost no pins when panning/zooming away from the user. Fetch a broad list
            // and sort by distance client-side when we have a location.
            val result = servicesRepository.getServices(
                page = 1,
                limit = 200,
                serviceType = null,
                tags = s.filterTag?.takeIf { it.isNotBlank() },
                latitude = null,
                longitude = null,
                radius = null
            )
            result.fold(
                onSuccess = { listResponse ->
                    val excludedStatuses = setOf("completed", "expired")
                    val fullList = listResponse.services
                        .filter { it.location != null && it.status.lowercase() !in excludedStatuses }
                    val offerCount = fullList.count { it.serviceType.equals("offer", ignoreCase = true) }
                    val needCount = fullList.count { it.serviceType.equals("need", ignoreCase = true) }
                    var list = fullList
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
                    recomputeVisible()
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

    fun loadEvents() {
        viewModelScope.launch {
            val result = forumRepository.listEvents(
                page = 1,
                limit = 200,
                tag = null,
                q = null,
                hasLocation = true
            )
            result.fold(
                onSuccess = { list ->
                    val events = list.events
                        .filter { it.latitude != null && it.longitude != null }
                    _state.update { it.copy(events = events) }
                    recomputeVisible()
                },
                onFailure = {
                    // Don't block the map if events fail; keep services visible
                    _state.update { s -> s.copy(error = s.error ?: (it.message ?: "Failed to load map events")) }
                }
            )
        }
    }

    fun setFilterType(type: String?) {
        _state.update { it.copy(filterType = type) }
        recomputeVisible()
    }

    fun setMapSearchQuery(query: String) {
        _state.update { it.copy(mapSearchQuery = query) }
        recomputeVisible()
    }

    fun setFilterTag(tag: String?) {
        _state.value = _state.value.copy(filterTag = tag)
    }

    fun setFilters(timeOfDay: TimeOfDayFilter, dateFilter: DateFilter, filterType: String?) {
        _state.update {
            it.copy(filterTimeOfDay = timeOfDay, filterDate = dateFilter, filterType = filterType)
        }
        recomputeVisible()
    }

    fun setViewport(bounds: ViewportBounds?) {
        _state.update { it.copy(viewport = bounds) }
        recomputeVisible()
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
            recomputeVisible()
        }
    }

    /** Services to draw on the map (no viewport): type + search only. */
    fun servicesForMapOverlay(state: MapState): List<ServiceResponse> {
        val q = state.mapSearchQuery.trim()
        val byType = when (state.filterType) {
            null -> state.services
            "event" -> emptyList()
            "offer" -> state.services.filter { it.serviceType.equals("offer", ignoreCase = true) }
            "need" -> state.services.filter { it.serviceType.equals("need", ignoreCase = true) }
            else -> state.services
        }
        return byType.filter { matchesMapSearchService(it, q) }
    }

    /** Events to draw on the map (no viewport): search + type (hide when Offer/Need only). */
    fun eventsForMapOverlay(state: MapState): List<ForumEventResponse> {
        if (!eventMatchesTypeForVisible(state.filterType)) return emptyList()
        val q = state.mapSearchQuery.trim()
        return state.events.filter { matchesMapSearchEvent(it, q) }
    }

    private fun recomputeVisible() {
        val s = _state.value
        val vp = s.viewport
        if (vp == null) {
            _state.update { it.copy(visibleServices = emptyList(), visibleEvents = emptyList()) }
            return
        }
        val q = s.mapSearchQuery.trim()

        val filteredServices = s.services
            .asSequence()
            .filter { it.location != null }
            .filter { serviceMatchesTypeForVisible(it, s.filterType) }
            .filter { matchesMapSearchService(it, q) }
            .filter { service ->
                val loc = service.location ?: return@filter false
                isInBounds(loc.latitude, loc.longitude, vp)
            }
            .filter { service ->
                matchesDateTimeFilters(
                    dateFilter = s.filterDate,
                    timeOfDay = s.filterTimeOfDay,
                    service = service
                )
            }
            .toList()

        val filteredEvents = s.events
            .asSequence()
            .filter { it.latitude != null && it.longitude != null }
            .filter { eventMatchesTypeForVisible(s.filterType) }
            .filter { matchesMapSearchEvent(it, q) }
            .filter { event ->
                isInBounds(event.latitude!!, event.longitude!!, vp)
            }
            .filter { event ->
                matchesDateTimeFilters(
                    dateFilter = s.filterDate,
                    timeOfDay = s.filterTimeOfDay,
                    event = event
                )
            }
            .toList()

        _state.update { it.copy(visibleServices = filteredServices, visibleEvents = filteredEvents) }
    }

    private fun serviceMatchesTypeForVisible(service: ServiceResponse, filterType: String?): Boolean {
        return when (filterType) {
            null -> true
            "event" -> false
            "offer" -> service.serviceType.equals("offer", ignoreCase = true)
            "need" -> service.serviceType.equals("need", ignoreCase = true)
            else -> true
        }
    }

    /** When filtering to offer/need only, hide events from the carousel and map markers. */
    private fun eventMatchesTypeForVisible(filterType: String?): Boolean {
        return when (filterType) {
            null, "event" -> true
            "offer", "need" -> false
            else -> true
        }
    }

    private fun matchesMapSearchService(service: ServiceResponse, rawQuery: String): Boolean {
        if (rawQuery.isBlank()) return true
        val needle = rawQuery.lowercase()
        if (service.title.lowercase().contains(needle)) return true
        if (service.description.lowercase().contains(needle)) return true
        return service.tags.any { tag ->
            (tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "").lowercase().contains(needle)
        }
    }

    private fun matchesMapSearchEvent(event: ForumEventResponse, rawQuery: String): Boolean {
        if (rawQuery.isBlank()) return true
        val needle = rawQuery.lowercase()
        if (event.title.lowercase().contains(needle)) return true
        if (event.description.lowercase().contains(needle)) return true
        return event.tags.orEmpty().any { tag ->
            (tag.label ?: tag.name ?: tag.entityId ?: tag.id ?: "").lowercase().contains(needle)
        }
    }

    private fun isInBounds(lat: Double, lon: Double, vp: ViewportBounds): Boolean {
        val latOk = lat in vp.southLat..vp.northLat
        val lonOk = lon in vp.westLon..vp.eastLon
        return latOk && lonOk
    }

    private fun matchesDateTimeFilters(
        dateFilter: DateFilter,
        timeOfDay: TimeOfDayFilter,
        service: ServiceResponse? = null,
        event: ForumEventResponse? = null
    ): Boolean {
        if (timeOfDay == TimeOfDayFilter.ANYTIME && dateFilter == DateFilter.ANYTIME) return true

        val date: LocalDate?
        val time: LocalTime?

        if (event != null) {
            val zoned = runCatching {
                Instant.parse(event.eventAt).atZone(ZoneId.systemDefault())
            }.getOrNull() ?: return false
            date = zoned.toLocalDate()
            time = zoned.toLocalTime()
        } else if (service != null) {
            date = service.specificDate
                ?.takeIf { it.length >= 10 }
                ?.substring(0, 10)
                ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            time = service.specificTime
                ?.takeIf { it.isNotBlank() }
                ?.let { runCatching { LocalTime.parse(it) }.getOrNull() }
        } else {
            return true
        }

        val dateOk = when (dateFilter) {
            DateFilter.ANYTIME -> true
            DateFilter.TODAY -> date != null && date == LocalDate.now()
            DateFilter.TOMORROW -> date != null && date == LocalDate.now().plusDays(1)
            DateFilter.WEEKEND -> date != null && isInWeekend(date, weekendStart = upcomingWeekendStart(LocalDate.now()))
            DateFilter.NEXT_WEEKEND -> date != null && isInWeekend(date, weekendStart = upcomingWeekendStart(LocalDate.now()).plusWeeks(1))
            is DateFilter.SPECIFIC -> date != null && date == dateFilter.date
        }

        val timeOk = when (timeOfDay) {
            TimeOfDayFilter.ANYTIME -> true
            else -> time != null && bucketFor(time) == timeOfDay
        }

        // Filters apply to events + scheduled services; exclude services missing fields when filter is active.
        if (event != null) return dateOk && timeOk

        val serviceHasAnySchedule = (service?.specificDate != null) || (service?.specificTime != null) || (service?.recurringPattern != null)
        if (!serviceHasAnySchedule) {
            // keep always-visible only when no date/time constraint is chosen
            return dateFilter == DateFilter.ANYTIME && timeOfDay == TimeOfDayFilter.ANYTIME
        }

        val scheduledDateOk = if (dateFilter == DateFilter.ANYTIME) true else dateOk
        val scheduledTimeOk = if (timeOfDay == TimeOfDayFilter.ANYTIME) true else timeOk
        return scheduledDateOk && scheduledTimeOk
    }

    private fun bucketFor(t: LocalTime): TimeOfDayFilter {
        val hour = t.hour
        return when {
            hour in 5..11 -> TimeOfDayFilter.MORNING
            hour in 12..16 -> TimeOfDayFilter.AFTERNOON
            hour in 17..20 -> TimeOfDayFilter.EVENING
            else -> TimeOfDayFilter.NIGHT
        }
    }

    private fun upcomingWeekendStart(today: LocalDate): LocalDate {
        // Weekend = Saturday + Sunday. If today is Sat/Sun, the weekendStart is this Saturday.
        val dow = today.dayOfWeek
        return when (dow) {
            DayOfWeek.SATURDAY -> today
            DayOfWeek.SUNDAY -> today.minusDays(1)
            else -> {
                val daysUntilSat = DayOfWeek.SATURDAY.value - dow.value
                today.plusDays(daysUntilSat.toLong())
            }
        }
    }

    private fun isInWeekend(date: LocalDate, weekendStart: LocalDate): Boolean {
        return date == weekendStart || date == weekendStart.plusDays(1)
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
