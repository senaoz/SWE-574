package com.hive.hive_app.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hive.hive_app.data.api.dto.JoinRequestResponse
import com.hive.hive_app.data.api.dto.ServiceResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import com.hive.hive_app.data.repository.AuthRepository
import com.hive.hive_app.data.repository.ChatRepository
import com.hive.hive_app.data.repository.JoinRequestsRepository
import com.hive.hive_app.data.repository.RatingsRepository
import com.hive.hive_app.data.repository.ServicesRepository
import com.hive.hive_app.data.repository.TransactionsRepository
import com.hive.hive_app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import javax.inject.Inject

private data class Quad(val id: String, val title: String, val status: String, val ownerUserId: String?, val timeSlot: String?)

private fun formatTimeSlot(service: ServiceResponse): String? {
    val date = service.specificDate
    val time = service.specificTime
    val open = service.openAvailability
    return when {
        !date.isNullOrBlank() && !time.isNullOrBlank() -> "$date at $time"
        !date.isNullOrBlank() -> date
        !open.isNullOrBlank() -> "Open: $open"
        else -> null
    }
}

@HiltViewModel
class ActiveItemsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val servicesRepository: ServicesRepository,
    private val joinRequestsRepository: JoinRequestsRepository,
    private val transactionsRepository: TransactionsRepository,
    private val usersRepository: UsersRepository,
    private val chatRepository: ChatRepository,
    private val ratingsRepository: RatingsRepository
) : ViewModel() {

    data class ActiveItemsState(
        val myActiveServices: List<ServiceResponse> = emptyList(),
        val applicationsSubmitted: List<JoinRequestResponse> = emptyList(),
        /** Service ID -> display title for application cards */
        val applicationServiceTitles: Map<String, String> = emptyMap(),
        /** Service ID -> status (used to hide in_progress from Applications I submitted) */
        val applicationServiceStatuses: Map<String, String> = emptyMap(),
        /** User ID -> display name (owner of services) */
        val ownerNamesByUserId: Map<String, String> = emptyMap(),
        /** Service ID -> time slot text for application cards */
        val applicationServiceTimeSlots: Map<String, String> = emptyMap(),
        /** Service ID -> owner user ID for application cards */
        val applicationServiceOwnerIds: Map<String, String> = emptyMap(),
        val acceptedParticipation: List<ServiceResponse> = emptyList(),
        /** Service ID -> transaction (for accepted participation; used for "Confirm I received") */
        val acceptedServiceTransactions: Map<String, TransactionResponse> = emptyMap(),
        val currentUserId: String? = null,
        val myRequestsStatusFilter: String? = null,
        val pendingCount: Int = 0,
        val approvedCount: Int = 0,
        val rejectedCount: Int = 0,
        val isLoading: Boolean = false,
        val error: String? = null
    )

    private val _state = MutableStateFlow(ActiveItemsState())
    val state: StateFlow<ActiveItemsState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val userResult = authRepository.getCurrentUser()
            val userId = userResult.getOrNull()?._id
            if (userId == null) {
                _state.value = _state.value.copy(isLoading = false, error = "Not logged in")
                return@launch
            }
            val servicesResult = servicesRepository.getServices(
                page = 1,
                limit = 100,
                userId = userId
            )
            val requestsResult = joinRequestsRepository.getMyRequests(page = 1, limit = 100)
            val activeStatuses = listOf("active", "in_progress")
            val excludedStatuses = listOf("expired", "completed")
            val myActiveServices = servicesResult.getOrNull()?.services
                ?.filter { it.status in activeStatuses && it.status !in excludedStatuses }
                ?: emptyList()
            val allRequests = requestsResult.getOrNull()?.requests ?: emptyList()
            val pendingCount = allRequests.count { it.status == "pending" }
            val approvedCount = allRequests.count { it.status == "approved" }
            val rejectedCount = allRequests.count { it.status == "rejected" }
            val statusFilter = _state.value.myRequestsStatusFilter
            // Exclude approved: approved applications only appear in Accepted participation
            val applicationsSubmitted = when (statusFilter) {
                "approved" -> emptyList()
                null -> allRequests.filter { it.status in listOf("pending", "rejected") }
                else -> allRequests.filter { it.status == statusFilter }
            }
            val approvedRequests = allRequests.filter { it.status == "approved" }
            val acceptedServiceIds = approvedRequests.map { it.serviceId }.distinct()
            val acceptedParticipation = acceptedServiceIds.mapNotNull { serviceId ->
                servicesRepository.getService(serviceId).getOrNull()
            }
            val myTransactions = transactionsRepository.getMyTransactions(page = 1, limit = 100).getOrNull()?.transactions ?: emptyList()
            val acceptedServiceTransactions = acceptedServiceIds.associateWith { serviceId ->
                myTransactions.firstOrNull { it.serviceId == serviceId }
            }.filterValues { it != null }.mapValues { it.value!! }
            val applicationServiceIds = applicationsSubmitted.map { it.serviceId }.distinct()
            val applicationServiceInfo = coroutineScope {
                applicationServiceIds.map { id ->
                    async {
                        val service = servicesRepository.getService(id).getOrNull()
                        val timeSlot = service?.let { formatTimeSlot(it) }
                        Quad(id, service?.title ?: "", service?.status ?: "", service?.userId, timeSlot)
                    }
                }.awaitAll()
            }
            val applicationServiceTitles = applicationServiceInfo.associate { it.id to it.title }
            val applicationServiceStatuses = applicationServiceInfo.associate { it.id to it.status }
            val applicationServiceOwnerIds = applicationServiceInfo.mapNotNull { q -> q.ownerUserId?.let { q.id to it } }.toMap()
            val applicationServiceTimeSlots = applicationServiceInfo.mapNotNull { q -> q.timeSlot?.let { q.id to it } }.toMap()
            val allOwnerIds = (myActiveServices.map { it.userId } + acceptedParticipation.map { it.userId } + applicationServiceOwnerIds.values).distinct()
            val ownerNamesByUserId = coroutineScope {
                allOwnerIds.map { uid ->
                    async {
                        uid to (usersRepository.getUser(uid).getOrNull()?.fullName?.takeIf { it.isNotBlank() } ?: usersRepository.getUser(uid).getOrNull()?.username ?: "")
                    }
                }.awaitAll().filter { it.second.isNotBlank() }.associate { it.first to it.second }
            }
            // Do not show applications whose service is already in_progress (service has started)
            val applicationsFiltered = applicationsSubmitted.filter { applicationServiceStatuses[it.serviceId] != "in_progress" }
            _state.value = _state.value.copy(
                myActiveServices = myActiveServices,
                applicationsSubmitted = applicationsFiltered,
                applicationServiceTitles = applicationServiceTitles,
                applicationServiceStatuses = applicationServiceStatuses,
                ownerNamesByUserId = ownerNamesByUserId,
                applicationServiceTimeSlots = applicationServiceTimeSlots,
                applicationServiceOwnerIds = applicationServiceOwnerIds,
                acceptedParticipation = acceptedParticipation,
                acceptedServiceTransactions = acceptedServiceTransactions,
                currentUserId = userId,
                pendingCount = pendingCount,
                approvedCount = approvedCount,
                rejectedCount = rejectedCount,
                isLoading = false,
                error = servicesResult.fold({ null }, { it.message })
                    ?: requestsResult.fold({ null }, { it.message })
            )
        }
    }

    fun setMyRequestsStatusFilter(status: String?) {
        _state.value = _state.value.copy(myRequestsStatusFilter = status)
        load()
    }

    fun cancelRequest(requestId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            joinRequestsRepository.cancel(requestId).fold(
                onSuccess = {
                    load()
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    fun confirmReceived(transactionId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            transactionsRepository.confirmCompletion(transactionId).fold(
                onSuccess = {
                    load()
                    onResult(true, null)
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    /** Confirm transaction completion and submit rating (score, feedback tags, optional comment). */
    fun confirmAndRate(
        transactionId: String,
        ratedUserId: String,
        score: Int,
        feedbackTags: List<String>,
        comment: String?,
        onResult: (Boolean, String?) -> Unit
    ) {
        viewModelScope.launch {
            transactionsRepository.confirmCompletion(transactionId).fold(
                onSuccess = {
                    ratingsRepository.createRating(
                        transactionId = transactionId,
                        ratedUserId = ratedUserId,
                        score = score,
                        comment = comment.takeIf { !it.isNullOrBlank() },
                        tags = feedbackTags.takeIf { it.isNotEmpty() }
                    ).fold(
                        onSuccess = {
                            load()
                            onResult(true, null)
                        },
                        onFailure = { onResult(false, it.message) }
                    )
                },
                onFailure = { onResult(false, it.message) }
            )
        }
    }

    /** Open or create a chat for accepted participation. Uses transaction room when transactionId is present; otherwise normal room. */
    fun startChatForAccepted(
        transactionId: String?,
        serviceId: String,
        ownerId: String,
        onResult: (String?) -> Unit
    ) {
        viewModelScope.launch {
            val userId = _state.value.currentUserId ?: run {
                onResult(null)
                return@launch
            }
            if (userId == ownerId) {
                onResult(null)
                return@launch
            }
            // When we have a transaction, use the transaction chat room (backend can have multiple transactions per room)
            if (transactionId != null) {
                chatRepository.createRoomForTransaction(transactionId).fold(
                    onSuccess = { onResult(it._id) },
                    onFailure = { onResult(null) }
                )
                return@launch
            }
            val participantSet = setOf(userId, ownerId)
            chatRepository.getRooms(page = 1, limit = 100).getOrNull()?.rooms?.firstOrNull { room ->
                room.participantIds.toSet() == participantSet && room.transactionId.isNullOrBlank()
            }?.let { existing ->
                onResult(existing._id)
                return@launch
            }
            chatRepository.createRoom(
                participantIds = listOf(userId, ownerId),
                serviceId = null
            ).fold(
                onSuccess = { onResult(it._id) },
                onFailure = { onResult(null) }
            )
        }
    }
}
