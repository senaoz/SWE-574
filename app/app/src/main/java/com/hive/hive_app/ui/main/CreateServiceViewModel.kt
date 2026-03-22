package com.hive.hive_app.ui.main

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.LocationDto
import com.hive.hive_app.data.api.dto.RecurringPatternDto
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.TagDto
import com.hive.hive_app.data.repository.ServicesRepository
import com.hive.hive_app.data.repository.UploadsRepository
import com.hive.hive_app.data.repository.WikidataRepository
import com.hive.hive_app.data.repository.WikidataTagSuggestion
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import javax.inject.Inject

@HiltViewModel
class CreateServiceViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    private val uploadsRepository: UploadsRepository,
    private val wikidataRepository: WikidataRepository,
    @ApplicationContext private val appContext: Context
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _tagSearchQuery = MutableStateFlow("")
    val tagSearchQuery: StateFlow<String> = _tagSearchQuery.asStateFlow()

    private val _tagSuggestions = MutableStateFlow<List<WikidataTagSuggestion>>(emptyList())
    val tagSuggestions: StateFlow<List<WikidataTagSuggestion>> = _tagSuggestions.asStateFlow()

    private val _tagSearchLoading = MutableStateFlow(false)
    val tagSearchLoading: StateFlow<Boolean> = _tagSearchLoading.asStateFlow()

    private val _tagSearchError = MutableStateFlow<String?>(null)
    val tagSearchError: StateFlow<String?> = _tagSearchError.asStateFlow()

    private var tagSearchJob: Job? = null

    fun setTagSearchQuery(query: String) {
        _tagSearchQuery.value = query
        tagSearchJob?.cancel()

        val trimmed = query.trim()
        if (trimmed.isBlank()) {
            _tagSuggestions.value = emptyList()
            _tagSearchError.value = null
            _tagSearchLoading.value = false
            return
        }

        tagSearchJob = viewModelScope.launch {
            _tagSearchLoading.value = true
            _tagSearchError.value = null
            delay(300) // debounce

            wikidataRepository.searchTags(trimmed, language = "en", limit = 10).fold(
                onSuccess = { suggestions ->
                    _tagSuggestions.value = suggestions
                    _tagSearchLoading.value = false
                },
                onFailure = { err ->
                    _tagSearchError.value = err.message ?: "Failed to search tags"
                    _tagSuggestions.value = emptyList()
                    _tagSearchLoading.value = false
                }
            )
        }
    }

    fun createService(
        title: String,
        description: String,
        category: String?,
        tags: List<TagDto>,
        estimatedDuration: Double,
        location: LocationDto,
        serviceType: String,
        maxParticipants: Int,
        deadline: String?,
        isRemote: Boolean,
        imageUris: List<Uri>,
        schedulingType: String,
        specificDate: String?,
        specificTime: String?,
        recurringPattern: RecurringPatternDto?,
        openAvailability: String?,
        onResult: (success: Boolean, created: ServiceResponse?, errorMessage: String?) -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            val uploadedImageUrls: List<String> = if (imageUris.isEmpty()) {
                emptyList()
            } else {
                coroutineScope {
                    val deferred = imageUris.map { uri ->
                        async {
                            uploadsRepository.uploadServiceImage(appContext, uri)
                        }
                    }
                    val results = deferred.map { it.await() }
                    val failures = results.filter { it.isFailure }.map { it.exceptionOrNull() }
                    if (failures.isNotEmpty()) {
                        val msg = failures.firstOrNull()?.message ?: "Failed to upload images"
                        _isLoading.value = false
                        _error.value = msg
                        onResult(false, null, msg)
                        return@coroutineScope emptyList()
                    }
                    results.mapNotNull { it.getOrNull() }
                }
            }

            if (_error.value != null) return@launch

            servicesRepository.createService(
                title = title,
                description = description,
                category = category,
                tags = tags,
                estimatedDuration = estimatedDuration,
                location = location,
                serviceType = serviceType,
                maxParticipants = maxParticipants,
                deadline = deadline,
                isRemote = isRemote,
                imageUrls = uploadedImageUrls,
                city = "",
                openAvailability = openAvailability,
                schedulingType = schedulingType,
                specificDate = specificDate,
                specificTime = specificTime,
                recurringPattern = recurringPattern
            ).fold(
                onSuccess = { created ->
                    _isLoading.value = false
                    onResult(true, created, null)
                },
                onFailure = {
                    _isLoading.value = false
                    val msg = it.message ?: "Failed to create service"
                    _error.value = msg
                    onResult(false, null, msg)
                }
            )
        }
    }
}

