package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.ServiceUpdate
import com.hive.hive_app.data.api.dto.TransactionResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import com.hive.hive_app.data.repository.JoinRequestsRepository
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.ServicesRepository
import com.hive.hive_app.data.repository.TransactionsRepository
import com.hive.hive_app.data.repository.UsersRepository
import com.hive.hive_app.util.getHighestPriorityBadge
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Matched receiver on the service (for confirmation avatars in Manage Service). */
data class ReceiverAvatarUi(
    val userId: String,
    val profilePictureUrl: String?,
    val confirmed: Boolean
)

data class ServiceRequestRow(
    val request: JoinRequestResponse,
    val userName: String,
    /** Username for labels like "[username]'s message:" */
    val applicantUsername: String,
    val profilePictureUrl: String?,
    val badgesEarned: Int,
    /** API returns badges in importance order; first earned badge is shown in the UI. */
    val primaryBadgeKey: String?,
    val primaryBadgeName: String?,
    val averageRating: Double?,
    val ratingTotal: Int
)

data class ManageRequestsUiState(
    val service: ServiceResponse? = null,
    val transaction: TransactionResponse? = null,
    val currentUserId: String? = null,
    /** Display name of the user to rate when completing (the other party). */
    val completionOtherUserName: String? = null,
    /** Profile pics for [ServiceResponse.matchedUserIds], with [ReceiverAvatarUi.confirmed] from [ServiceResponse.receiverConfirmedIds]. */
    val receiverAvatars: List<ReceiverAvatarUi> = emptyList(),
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
    private val authRepository: AuthRepository,
    private val transactionsRepository: TransactionsRepository
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
            val userId = authRepository.getCurrentUser().getOrNull()?._id
            val transactions = transactionsRepository.getMyTransactions(page = 1, limit = 100).getOrNull()?.transactions.orEmpty()
            val txn = transactions.firstOrNull { it.serviceId == serviceId }
            val ratedUserId = if (userId != null && txn != null) {
                if (userId == txn.providerId) txn.requesterId else txn.providerId
            } else null
            val completionName = if (ratedUserId != null) {
                usersRepository.getUser(ratedUserId).getOrNull()?.let { u ->
                    u.fullName?.takeIf { it.isNotBlank() } ?: u.username
                }
            } else null

            val receiverAvatars = coroutineScope {
                val confirmedIds = service.receiverConfirmedIds.orEmpty().toSet()
                service.matchedUserIds.orEmpty().map { uid ->
                    async {
                        val user = usersRepository.getUser(uid).getOrNull()
                        ReceiverAvatarUi(
                            userId = uid,
                            profilePictureUrl = user?.profilePicture,
                            confirmed = confirmedIds.contains(uid)
                        )
                    }
                }.awaitAll()
            }

            joinRequestsRepository.getServiceRequests(serviceId, page = 1, limit = 100).fold(
                onSuccess = { listResponse ->
                    val requests = listResponse.requests
                    val rows = coroutineScope {
                        requests.map { req ->
                            async {
                                val uid = req.userId
                                val userDef = async { usersRepository.getUser(uid).getOrNull() }
                                val badgesDef = async { usersRepository.getUserBadges(uid).getOrNull() }
                                val ratingsDef = async {
                                    ratingsRepository.getUserRatings(uid, page = 1, limit = 20).getOrNull()
                                }
                                val user = userDef.await()
                                val badges = badgesDef.await()
                                val ratings = ratingsDef.await()
                                val earned = badges?.earnedCount
                                    ?: badges?.badges?.count { it.earned }
                                    ?: 0
                                // Use priority-based selection mirroring the web frontend logic.
                                val primaryEarned = getHighestPriorityBadge(badges?.badges)
                                val displayName = user?.fullName?.takeIf { it.isNotBlank() }
                                    ?: user?.username
                                    ?: "User ${uid.take(8)}…"
                                val usernameForLabel = user?.username?.takeIf { it.isNotBlank() }
                                    ?: uid.take(8)
                                ServiceRequestRow(
                                    request = req,
                                    userName = displayName,
                                    applicantUsername = usernameForLabel,
                                    profilePictureUrl = user?.profilePicture,
                                    badgesEarned = earned,
                                    primaryBadgeKey = primaryEarned?.key,
                                    primaryBadgeName = primaryEarned?.name,
                                    averageRating = ratings?.averageScore,
                                    ratingTotal = ratings?.total ?: 0
                                )
                            }
                        }.awaitAll()
                    }
                    _state.value = ManageRequestsUiState(
                        service = service,
                        transaction = txn,
                        currentUserId = userId,
                        completionOtherUserName = completionName,
                        receiverAvatars = receiverAvatars,
                        isLoading = false,
                        error = null,
                        requestRows = rows
                    )
                },
                onFailure = { e ->
                    _state.value = ManageRequestsUiState(
                        service = service,
                        transaction = txn,
                        currentUserId = userId,
                        completionOtherUserName = completionName,
                        receiverAvatars = receiverAvatars,
                        isLoading = false,
                        error = e.message ?: "Failed to load requests"
                    )
                }
            )
        }
    }

    fun deleteService(serviceId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            servicesRepository.deleteService(serviceId).fold(
                onSuccess = { onResult(true, null) },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    /** Marks service as cancelled (see OpenAPI ServiceUpdate.status). */
    fun cancelService(serviceId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            servicesRepository.updateService(serviceId, ServiceUpdate(status = "cancelled")).fold(
                onSuccess = {
                    loadedServiceId?.let { load(it) }
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    /** PUT /services/{id} with status in_progress (see OpenAPI ServiceUpdate.status). */
    fun startService(serviceId: String, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            servicesRepository.updateService(serviceId, ServiceUpdate(status = "in_progress")).fold(
                onSuccess = {
                    loadedServiceId?.let { load(it) }
                    onResult(true)
                },
                onFailure = { onResult(false) }
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
