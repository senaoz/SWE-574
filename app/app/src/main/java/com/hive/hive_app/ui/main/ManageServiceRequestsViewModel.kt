package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import com.hive.hive_app.data.repository.JoinRequestsRepository
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.ServicesRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ServiceRequestRow(
    val request: JoinRequestResponse,
    val userName: String,
    /** Username for labels like "[username]'s message:" */
    val applicantUsername: String,
    val profilePictureUrl: String?,
    val badgesEarned: Int,
    val averageRating: Double?,
    val ratingTotal: Int
)

data class ManageRequestsUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val requestRows: List<ServiceRequestRow> = emptyList()
)

@HiltViewModel
class ManageServiceRequestsViewModel @Inject constructor(
    private val servicesRepository: ServicesRepository,
    private val joinRequestsRepository: JoinRequestsRepository,
    private val usersRepository: UsersRepository,
    private val ratingsRepository: RatingsRepository,
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ManageRequestsUiState())
    val state: StateFlow<ManageRequestsUiState> = _state.asStateFlow()

    private var loadedServiceId: String? = null

    fun load(serviceId: String) {
        loadedServiceId = serviceId
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val service = servicesRepository.getService(serviceId).getOrNull()
            if (service == null) {
                _state.value = ManageRequestsUiState(isLoading = false, error = "Service not found")
                return@launch
            }
            joinRequestsRepository.getServiceRequests(serviceId, page = 1, limit = 100).fold(
                onSuccess = { listResponse ->
                    val requests = listResponse.requests
                    val rows = coroutineScope {
                        requests.map { req ->
                            async {
                                val userId = req.userId
                                val userDef = async { usersRepository.getUser(userId).getOrNull() }
                                val badgesDef = async { usersRepository.getUserBadges(userId).getOrNull() }
                                val ratingsDef = async {
                                    ratingsRepository.getUserRatings(userId, page = 1, limit = 20).getOrNull()
                                }
                                val user = userDef.await()
                                val badges = badgesDef.await()
                                val ratings = ratingsDef.await()
                                val earned = badges?.earnedCount
                                    ?: badges?.badges?.count { it.earned }
                                    ?: 0
                                val displayName = user?.fullName?.takeIf { it.isNotBlank() }
                                    ?: user?.username
                                    ?: "User ${userId.take(8)}…"
                                val usernameForLabel = user?.username?.takeIf { it.isNotBlank() }
                                    ?: userId.take(8)
                                ServiceRequestRow(
                                    request = req,
                                    userName = displayName,
                                    applicantUsername = usernameForLabel,
                                    profilePictureUrl = user?.profilePicture,
                                    badgesEarned = earned,
                                    averageRating = ratings?.averageScore,
                                    ratingTotal = ratings?.total ?: 0
                                )
                            }
                        }.awaitAll()
                    }
                    _state.value = ManageRequestsUiState(
                        isLoading = false,
                        error = null,
                        requestRows = rows
                    )
                },
                onFailure = { e ->
                    _state.value = ManageRequestsUiState(
                        isLoading = false,
                        error = e.message ?: "Failed to load requests"
                    )
                }
            )
        }
    }

    fun startChatWithRequester(serviceId: String, requesterId: String, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            val me = authRepository.getCurrentUser().getOrNull()
            if (me == null || me._id == requesterId) {
                onResult(null)
                return@launch
            }
            chatRepository.createRoom(
                participantIds = listOf(me._id, requesterId),
                serviceId = serviceId
            ).fold(
                onSuccess = { onResult(it._id) },
                onFailure = { onResult(null) }
            )
        }
    }

    fun updateRequestStatus(
        requestId: String,
        status: String,
        adminMessage: String?,
        onResult: (Boolean) -> Unit
    ) {
        viewModelScope.launch {
            joinRequestsRepository.updateStatus(requestId, status, adminMessage).fold(
                onSuccess = {
                    loadedServiceId?.let { load(it) }
                    onResult(true)
                },
                onFailure = {
                    onResult(false)
                }
            )
        }
    }
}
