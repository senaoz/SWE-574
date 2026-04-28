package com.hive.hive_app.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.ui.main.*
import com.hive.hive_app.ui.notifications.NotificationsScreen

import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.ui.text.font.FontWeight
import com.hive.hive_app.ui.main.ForumViewModel

private sealed class OverlayRoute {
    data class UserProfile(val userId: String) : OverlayRoute()
    data class UserRatings(val userId: String, val title: String = "Ratings") : OverlayRoute()
    data class ServiceDetail(val serviceId: String) : OverlayRoute()
    data class ManageService(val serviceId: String) : OverlayRoute()
}

@Composable
fun MainScaffold(
    onLogout: () -> Unit
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    val unreadCount by mainViewModel.unreadCount.collectAsState()
    val pendingDestination by mainViewModel.pendingDestination.collectAsState()

    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.MAP) }
    var openChatRoomId by remember { mutableStateOf<String?>(null) }
    var overlayStack by remember { mutableStateOf<List<OverlayRoute>>(emptyList()) }
    var showSavedServices by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }
    var showCreateService by remember { mutableStateOf(false) }
    var showCommonSheet by remember { mutableStateOf(false) }
    var showActiveItems by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        mainViewModel.refreshUnreadCount()
    }

    LaunchedEffect(pendingDestination) {
        pendingDestination?.let { dest ->
            if (dest == "ACTIVE") showActiveItems = true
            mainViewModel.consumePendingDestination()
        }
    }

    fun pushOverlay(route: OverlayRoute) { overlayStack = overlayStack + route }
    fun popOverlay() { if (overlayStack.isNotEmpty()) overlayStack = overlayStack.dropLast(1) }

    BackHandler(
        enabled = overlayStack.isNotEmpty() || showSavedServices || showNotifications ||
                showEditProfile || showCreateService || showActiveItems || showCommonSheet ||
                currentDestination != MainDestinations.MAP
    ) {
        when {
            overlayStack.isNotEmpty() -> popOverlay()
            showSavedServices -> showSavedServices = false
            showNotifications -> {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            }
            showEditProfile -> showEditProfile = false
            showCreateService -> showCreateService = false
            showCommonSheet -> showCommonSheet = false
            showActiveItems -> showActiveItems = false
            currentDestination != MainDestinations.MAP -> {
                currentDestination = MainDestinations.MAP
                openChatRoomId = null
            }
        }
    }

    val onStartChat: (String) -> Unit = { roomId ->
        openChatRoomId = roomId
        currentDestination = MainDestinations.CHAT
    }
    val onOpenUserProfile: (String) -> Unit = { userId -> pushOverlay(OverlayRoute.UserProfile(userId)) }
    val onOpenRatings: (String) -> Unit = { userId -> pushOverlay(OverlayRoute.UserRatings(userId)) }

    when (val top = overlayStack.lastOrNull()) {
        is OverlayRoute.ManageService -> {
            key(top.serviceId) {
                ManageServiceScreen(
                    serviceId = top.serviceId,
                    onBack = { popOverlay() },
                    onOpenUserProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onStartChat = onStartChat,
                    onNavigateToCompleteRating = null,
                    onEditService = null
                )
            }
            return
        }
        is OverlayRoute.ServiceDetail -> {
            key(top.serviceId) {
                val detailViewModel: ServiceDetailViewModel = hiltViewModel()
                LaunchedEffect(top.serviceId) { detailViewModel.load(top.serviceId) }
                val detailState by detailViewModel.state.collectAsState()
                val detailCreator by detailViewModel.creator.collectAsState()
                val detailAcceptedUsers by detailViewModel.acceptedUsers.collectAsState()
                val detailLoading by detailViewModel.isLoading.collectAsState()
                val detailError by detailViewModel.error.collectAsState()
                val detailCreatorBadges by detailViewModel.creatorBadges.collectAsState()
                val detailCreatorRating by detailViewModel.creatorRating.collectAsState()
                val detailIsSaved by detailViewModel.isSaved.collectAsState()
                ServiceDetailScreen(
                    service = detailState,
                    creator = detailCreator,
                    acceptedUsers = detailAcceptedUsers,
                    isLoading = detailLoading,
                    error = detailError,
                    onBack = { popOverlay() },
                    viewModel = detailViewModel,
                    modifier = Modifier.fillMaxSize(),
                    creatorBadges = detailCreatorBadges,
                    creatorRating = detailCreatorRating,
                    isSaved = detailIsSaved,
                    onStartChat = onStartChat,
                    onOpenUserProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onManageJoinRequests = { detailState?._id?.let { pushOverlay(OverlayRoute.ManageService(it)) } }
                )
            }
            return
        }
        is OverlayRoute.UserProfile -> {
            key(top.userId) {
                UserProfileScreen(
                    userId = top.userId,
                    onBack = { popOverlay() },
                    modifier = Modifier.fillMaxSize(),
                    onOpenRatings = { uid -> pushOverlay(OverlayRoute.UserRatings(uid)) }
                )
            }
            return
        }
        is OverlayRoute.UserRatings -> {
            key(top.userId) {
                UserRatingsScreen(
                    userId = top.userId,
                    title = top.title,
                    onBack = { popOverlay() },
                    onOpenRaterProfile = { pushOverlay(OverlayRoute.UserProfile(it)) },
                    onOpenExchange = { pushOverlay(OverlayRoute.ServiceDetail(it)) },
                    modifier = Modifier.fillMaxSize()
                )
            }
            return
        }
        null -> { }
    }

    if (showEditProfile) { EditProfileScreen(onBack = { showEditProfile = false }); return }
    if (showSavedServices) { SavedServicesScreen(onBack = { showSavedServices = false }, modifier = Modifier.fillMaxSize()); return }

    if (showNotifications) {
        LaunchedEffect(Unit) { mainViewModel.clearUnreadBadge() }
        NotificationsScreen(
            modifier = Modifier.fillMaxSize(),
            onBack = {
                showNotifications = false
                mainViewModel.refreshUnreadCount()
            },
            onNavigate = { notif ->
                showNotifications = false
                when (notif.type) {
                    "JOIN_REQUEST_RECEIVED", "JOIN_REQUEST_APPROVED",
                    "JOIN_REQUEST_REJECTED", "TRANSACTION_COMPLETED" -> showActiveItems = true
                }
                mainViewModel.refreshUnreadCount()
            }
        )
        return
    }

    if (showCommonSheet) {
        CommonCreateSheet(
            onDismiss = { showCommonSheet = false },
            onCreateService = {
                showCommonSheet = false
                showCreateService = true
            }
        )
        return
    }

    if (showCreateService) {
        CreateServiceScreen(
            modifier = Modifier.fillMaxSize(),
            userLat = null, userLon = null,
            locationPermissionGranted = false,
            onRequestLocationPermission = { },
            onRefreshLocation = { },
            onBack = { showCreateService = false },
            onCreated = { showCreateService = false }
        )
        return
    }

    if (showActiveItems) {
        ActiveItemsScreen(
            modifier = Modifier.fillMaxSize(),
            onStartChat = onStartChat,
            onOpenUserProfile = onOpenUserProfile,
            onBack = { showActiveItems = false }
        )
        return
    }

    val navBarHeight = 70.dp
    val fabRadius = 30.dp  // half of fabSize (60.dp) in CustomBottomNavBar
    val navBarTotalHeight = navBarHeight + fabRadius

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
            val layoutDirection = LocalLayoutDirection.current
            when (currentDestination) {
                MainDestinations.MAP -> MapScreen(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(
                            start = innerPadding.calculateStartPadding(layoutDirection),
                            end = innerPadding.calculateEndPadding(layoutDirection),
                            bottom = 0.dp, // Full screen map
                            top = 0.dp
                        ),
                    onStartChat = onStartChat,
                    onOpenUserProfile = onOpenUserProfile
                )
                MainDestinations.CHAT -> ChatScreen(
                    Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = navBarTotalHeight),
                    initialRoomId = openChatRoomId, onInitialRoomConsumed = { openChatRoomId = null }
                )
                MainDestinations.COMMON -> ForumScreen(
                    Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = 0.dp)
                )
                MainDestinations.PROFILE -> ProfileScreen(
                    onLogout = onLogout,
                    modifier = Modifier.fillMaxSize().padding(top = innerPadding.calculateTopPadding(), bottom = 0.dp),
                    onOpenSaved = { showSavedServices = true },
                    onOpenNotifications = { showNotifications = true },
                    onOpenActive = { showActiveItems = true },
                    onOpenRatings = onOpenRatings,
                    onOpenEditProfile = { showEditProfile = true }
                )
            }
        }

        CustomBottomNavBar(
            modifier = Modifier.align(Alignment.BottomCenter),
            currentDestination = currentDestination,
            unreadCount = unreadCount,
            onDestinationSelected = { currentDestination = it },
            onAddClick = { showCommonSheet = true },
            barHeightParam = navBarHeight
        )
    }
}

@Composable
fun CustomBottomNavBar(
    modifier: Modifier = Modifier,
    currentDestination: MainDestinations,
    unreadCount: Int,
    onDestinationSelected: (MainDestinations) -> Unit,
    onAddClick: () -> Unit,
    barHeightParam: Dp
) {
    val barHeight    = barHeightParam
    val fabSize      = 60.dp
    val fabRadius    = fabSize / 2
    val notchRadius  = fabRadius + 8.dp
    val totalHeight  = barHeight + fabRadius
    val backgroundColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f)

    Box(modifier = modifier.fillMaxWidth().height(totalHeight)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .align(Alignment.BottomCenter)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                val cx = w / 2f
                val nr = notchRadius.toPx()
                val notchW = nr * 3.0f
                val notchH = nr * 1.3f
                // flat top edge of the bar (sides) sits at the barHeight offset from bottom
                val topY = h - barHeight.toPx()

                val path = Path().apply {
                    moveTo(0f, topY)
                    lineTo(cx - notchW * 0.9f, topY)
                    cubicTo(cx - notchW * 0.6f, topY, cx - notchW * 0.3f, topY + notchH, cx, topY + notchH)
                    cubicTo(cx + notchW * 0.3f, topY + notchH, cx + notchW * 0.6f, topY, cx + notchW * 0.9f, topY)
                    lineTo(w, topY)
                    lineTo(w, h)
                    lineTo(0f, h)
                    close()
                }
                drawPath(path, color = backgroundColor)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().height(barHeight).align(Alignment.BottomCenter).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem(MainDestinations.MAP.icon, "Map", currentDestination == MainDestinations.MAP, { onDestinationSelected(MainDestinations.MAP) }, Modifier.weight(1f))
            BottomNavItem(MainDestinations.CHAT.icon, "Chat", currentDestination == MainDestinations.CHAT, { onDestinationSelected(MainDestinations.CHAT) }, Modifier.weight(1f))
            Spacer(modifier = Modifier.weight(1.4f))
            BottomNavItem(MainDestinations.COMMON.icon, "Commons", currentDestination == MainDestinations.COMMON, { onDestinationSelected(MainDestinations.COMMON) }, Modifier.weight(1f))
            BottomNavItem(MainDestinations.PROFILE.icon, "Profile", currentDestination == MainDestinations.PROFILE, { onDestinationSelected(MainDestinations.PROFILE) }, Modifier.weight(1f), if (unreadCount > 0) unreadCount.toString() else null)
        }

        FloatingActionButton(
            onClick = onAddClick,
            modifier = Modifier.size(fabSize).align(Alignment.TopCenter).offset(y = 14.dp),
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White,
            shape = CircleShape,
            elevation = FloatingActionButtonDefaults.elevation(8.dp)
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add", modifier = Modifier.size(30.dp))
        }
    }
}

@Composable
private fun BottomNavItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    badge: String? = null
) {
    val color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
    Column(
        modifier = modifier.clickable(indication = null, interactionSource = remember { MutableInteractionSource() }, onClick = onClick).padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        BadgedBox(badge = { if (badge != null) Badge { Text(badge) } }) {
            Icon(imageVector = icon, contentDescription = label, tint = color, modifier = Modifier.size(27.dp))
        }
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = color, fontSize = 10.sp)
    }
}
// ─── Common Create Bottom Sheet ───────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommonCreateSheet(
    onDismiss: () -> Unit,
    onCreateService: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val forumViewModel: ForumViewModel = hiltViewModel()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Service", "Common")

    // Common sub-states
    var commonStep by remember { mutableStateOf<String?>(null) } // null | "discussion" | "event" | "community"

    // Discussion form state
    var discussionTitle by remember { mutableStateOf("") }
    var discussionBody by remember { mutableStateOf("") }
    var discussionError by remember { mutableStateOf("") }

    // Community form state  
    var communityName by remember { mutableStateOf("") }
    var communityDesc by remember { mutableStateOf("") }
    var communityError by remember { mutableStateOf("") }

    val createCommunityState by forumViewModel.createCommunityState.collectAsState()
    val createDiscussionState by forumViewModel.createState.collectAsState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = Modifier.statusBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 24.dp)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = {
                            selectedTab = index
                            commonStep = null
                        },
                        text = { Text(title, fontWeight = FontWeight.Medium) }
                    )
                }
            }

            // ── Service tab ──
            if (selectedTab == 0) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        "What would you like to do?",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = onCreateService,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Group, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                            Column {
                                Text("Offer or Need a Service", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                Text("Share skills or request help", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            // ── Common tab ──
            if (selectedTab == 1) {
                when (commonStep) {
                    null -> {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                "Create in Common",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                            Card(modifier = Modifier.fillMaxWidth(), onClick = { commonStep = "discussion" }, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.Forum, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Column {
                                        Text("Discussion", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                        Text("Start a conversation with the community", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                            Card(modifier = Modifier.fillMaxWidth(), onClick = { commonStep = "event" }, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Column {
                                        Text("Event", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                        Text("Organize a community gathering", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                            Card(modifier = Modifier.fillMaxWidth(), onClick = { commonStep = "community" }, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.Group, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Column {
                                        Text("Community", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                        Text("Create a group around a shared interest", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }

                    "discussion" -> {
                        Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            TextButton(onClick = { commonStep = null }) { Text("← Back") }
                            Text("New Discussion", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            OutlinedTextField(value = discussionTitle, onValueChange = { discussionTitle = it }, label = { Text("Title *") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                            OutlinedTextField(value = discussionBody, onValueChange = { discussionBody = it }, label = { Text("Body *") }, modifier = Modifier.fillMaxWidth(), minLines = 4, maxLines = 8)
                            if (discussionError.isNotBlank()) Text(discussionError, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            Button(
                                onClick = {
                                    if (discussionTitle.isBlank() || discussionBody.isBlank()) { discussionError = "Title and body are required"; return@Button }
                                    forumViewModel.setCreateTitle(discussionTitle)
                                    forumViewModel.setCreateBody(discussionBody)
                                    forumViewModel.createDiscussion { onDismiss() }
                                },
                                enabled = !createDiscussionState.isSubmitting,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (createDiscussionState.isSubmitting) "Creating…" else "Create Discussion")
                            }
                            if (createDiscussionState.error != null) Text(createDiscussionState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                        }
                    }

                    "event" -> {
                        Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = { commonStep = null }) { Text("← Back") }
                            Text("New Event", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            Text("To create an event with images and location, please use the web app.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            HorizontalDivider()
                            val createEventState by forumViewModel.createEventState.collectAsState()
                            OutlinedTextField(value = createEventState.title, onValueChange = { forumViewModel.setCreateEventTitle(it) }, label = { Text("Title *") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                            OutlinedTextField(value = createEventState.description, onValueChange = { forumViewModel.setCreateEventDescription(it) }, label = { Text("Description *") }, modifier = Modifier.fillMaxWidth(), minLines = 3, maxLines = 6)
                            OutlinedTextField(value = createEventState.eventAt, onValueChange = { forumViewModel.setCreateEventAt(it) }, label = { Text("Date & Time (ISO) *") }, placeholder = { Text("e.g. 2026-06-01T18:00:00") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                androidx.compose.material3.Switch(checked = createEventState.isRemote, onCheckedChange = { forumViewModel.setCreateEventIsRemote(it) })
                                Text("Remote / Online event")
                            }
                            if (createEventState.error != null) Text(createEventState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            Button(
                                onClick = { forumViewModel.createEvent { onDismiss() } },
                                enabled = !createEventState.isSubmitting,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (createEventState.isSubmitting) "Creating…" else "Create Event")
                            }
                        }
                    }

                    "community" -> {
                        Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            TextButton(onClick = { commonStep = null }) { Text("← Back") }
                            Text("New Community", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            OutlinedTextField(value = communityName, onValueChange = { communityName = it }, label = { Text("Name *") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                            OutlinedTextField(value = communityDesc, onValueChange = { communityDesc = it }, label = { Text("Description *") }, modifier = Modifier.fillMaxWidth(), minLines = 3, maxLines = 6)
                            if (communityError.isNotBlank()) Text(communityError, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            if (createCommunityState.error != null) Text(createCommunityState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            Button(
                                onClick = {
                                    if (communityName.isBlank() || communityDesc.isBlank()) { communityError = "Name and description are required"; return@Button }
                                    forumViewModel.setCreateCommunityName(communityName)
                                    forumViewModel.setCreateCommunityDescription(communityDesc)
                                    forumViewModel.createCommunity { onDismiss() }
                                },
                                enabled = !createCommunityState.isSubmitting,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (createCommunityState.isSubmitting) "Creating…" else "Create Community")
                            }
                        }
                    }
                }
            }
        }
    }
}
