package com.hive.hive_app.ui.main

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import kotlinx.coroutines.launch
import java.util.Locale
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.hive.hive_app.util.badgeIcon
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.BuildConfig
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.RatingListResponse
import com.hive.hive_app.data.api.dto.SocialLinks
import com.hive.hive_app.data.api.dto.TimeBankResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.util.formatMemberJoinDate
import com.hive.hive_app.util.formatMemberSinceDuration
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ProfileViewModel = hiltViewModel(),
    onOpenSaved: (() -> Unit)? = null,
    onOpenNotifications: (() -> Unit)? = null,
    onOpenRatings: (userId: String) -> Unit = { },
    onOpenEditProfile: () -> Unit = {}
) {
    val profile by viewModel.profile.collectAsState()
    val timeBank by viewModel.timeBank.collectAsState()
    val badges by viewModel.badges.collectAsState()
    val ratingsSummary by viewModel.ratingsSummary.collectAsState()
    val ratingTopTags by viewModel.ratingTopTags.collectAsState()
    val availableInterests by viewModel.availableInterests.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    var showSettings by remember { mutableStateOf(false) }
    var showChangePassword by remember { mutableStateOf(false) }
    var showDeleteAccount by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    val badgesSectionRequester = remember { BringIntoViewRequester() }

    LaunchedEffect(Unit) { viewModel.load() }

    if (showSettings && profile != null) {
        SettingsDialog(
            profile = profile!!,
            onDismiss = { showSettings = false },
            onSave = { update ->
                viewModel.updateSettings(update)
                showSettings = false
            }
        )
    }
    if (showChangePassword) {
        ChangePasswordDialog(
            onDismiss = { showChangePassword = false },
            onSubmit = { current, new, confirm ->
                viewModel.changePassword(current, new, confirm) { ok, msg ->
                    if (ok) showChangePassword = false
                }
            }
        )
    }
    if (showDeleteAccount) {
        DeleteAccountDialog(
            onDismiss = { showDeleteAccount = false },
            onConfirm = { password ->
                viewModel.deleteAccount(password) { ok, _ ->
                    if (ok) {
                        showDeleteAccount = false
                        onLogout()
                    }
                }
            }
        )
    }

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        Text(
            text = "Profile",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        error?.let { msg ->
            Text(
                text = msg,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
        if (isLoading && profile == null) {
            Spacer(modifier = Modifier.height(24.dp))
            CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally))
        } else {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(scrollState)
            ) {
                profile?.let { user ->
                    Spacer(Modifier.height(12.dp))

                    // 1. Profile header – photo, name, stats
                    ProfileHeaderCard(
                        user = user,
                        ratingsSummary = ratingsSummary,
                        badges = badges,
                        onEditProfile = onOpenEditProfile,
                        onOpenRatings = { onOpenRatings(user._id) },
                        onScrollToBadges = {
                            coroutineScope.launch {
                                badgesSectionRequester.bringIntoView()
                            }
                        }
                    )

                    // Saved services (if callback provided)
                    if (onOpenSaved != null) {
                        Spacer(Modifier.height(12.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onOpenSaved),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Favorite,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Saved",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Notifications (if callback provided)
                    if (onOpenNotifications != null) {
                        Spacer(Modifier.height(12.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onOpenNotifications),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Notifications,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Notifications",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // 2. Bio section (always show)
                    Spacer(Modifier.height(12.dp))
                    SectionCard(
                        title = "Bio",
                        content = user.bio?.takeIf { it.isNotBlank() },
                        emptyMessage = "No bio added yet."
                    )

                    Spacer(Modifier.height(12.dp))
                    ProfileRatingSummaryCard(
                        ratingsSummary = ratingsSummary,
                        topTags = ratingTopTags,
                        onOpenRatings = { onOpenRatings(user._id) }
                    )

                    // 3. Location section – click to see on map when set
                    Spacer(Modifier.height(12.dp))
                    LocationSectionCard(
                        location = user.location?.takeIf { it.isNotBlank() },
                        onEditProfile = onOpenEditProfile
                    )

                    // 4. Interests section – pills with icons and colors
                    Spacer(Modifier.height(12.dp))
                    InterestsSectionCard(interests = user.interests.orEmpty())

                    // 5. Social links section
                    Spacer(Modifier.height(12.dp))
                    SocialLinksSectionCard(links = user.socialLinks)

                    // 6. TimeBank card (always show)
                    Spacer(Modifier.height(12.dp))
                    TimeBankCard(timeBank = timeBank)

                    // 7. Badges card (always show)
                    Spacer(Modifier.height(12.dp))
                    Box(Modifier.bringIntoViewRequester(badgesSectionRequester)) {
                        BadgesCard(badges = badges)
                    }

                    // 8. Settings – clickable card to open and modify
                    Spacer(Modifier.height(12.dp))
                    SettingsClickableCard(user = user, onClick = { showSettings = true })

                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(onClick = { showChangePassword = true }) { Text("Change password") }
                        OutlinedButton(onClick = { showDeleteAccount = true }) { Text("Delete account") }
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("Log out") }
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = "v${BuildConfig.VERSION_NAME} (build ${BuildConfig.VERSION_CODE})",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun ProfileHeaderCard(
    user: UserResponse,
    ratingsSummary: RatingListResponse?,
    badges: BadgesResponse?,
    onEditProfile: () -> Unit,
    onOpenRatings: () -> Unit,
    onScrollToBadges: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.5.dp, ProfileRatingSummaryLime, RoundedCornerShape(12.dp)),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (user.profilePicture?.isNotBlank() == true) {
                val context = LocalContext.current
                AsyncImage(
                    model = buildImageRequest(context, user.profilePicture),
                    contentDescription = "Profile photo",
                    modifier = Modifier
                        .size(96.dp)
                        .clip(CircleShape)
                )
            } else {
                val initials = remember(user) {
                    (user.fullName ?: user.username)
                        .trim()
                        .split(" ")
                        .filter { it.isNotBlank() }
                        .take(2)
                        .joinToString("") { it.first().uppercase() }
                }
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.primary,
                                    MaterialTheme.colorScheme.secondary
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = initials,
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                text = user.fullName?.takeIf { it.isNotBlank() } ?: user.username,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "@${user.username}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (user.showEmail) {
                Spacer(Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Email,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (user.showLocation && !user.location.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = user.location!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Stats row – rating, badges, member since
            val totalRates = ratingsSummary?.total ?: 0
            val avg = ratingsSummary?.averageScore
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ProfileStat(
                    label = if (totalRates > 0) "$totalRates ratings" else "Rating",
                    value = if (totalRates > 0 && avg != null) String.format("%.1f", avg) else "—",
                    onClick = onOpenRatings
                )
                ProfileStat(
                    label = "Badges",
                    value = "${badges?.earnedCount ?: 0}/${badges?.totalCount ?: 0}",
                    onClick = onScrollToBadges
                )
                ProfileStat(
                    label = "Member",
                    value = formatMemberJoinDate(user.createdAt).ifBlank { "—" },
                    onClick = null
                )
            }

            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (user.isVerified) {
                        Text(
                            text = "Verified · ",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    val memberDuration = formatMemberSinceDuration(user.createdAt)
                    Text(
                        text = if (memberDuration.isNotBlank()) "Member for $memberDuration" else "Member",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                OutlinedButton(onClick = onEditProfile) { Text("Edit profile") }
            }
        }
    }
}

@Composable
private fun ProfileStat(
    label: String,
    value: String,
    onClick: (() -> Unit)? = null
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .then(
                if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
            )
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun interestStyle(name: String): Pair<ImageVector, Color> {
    val (icon, color) = when (name) {
        "Technology" -> Icons.Filled.Public to Color(0xFF0EA5E9)
        "Design" -> Icons.Filled.Image to Color(0xFF8B5CF6)
        "Language Exchange" -> Icons.Filled.Person to Color(0xFF06B6D4)
        "AI" -> Icons.Filled.School to Color(0xFF6366F1)
        "Music" -> Icons.Filled.Star to Color(0xFFEC4899)
        "Fitness" -> Icons.Filled.TrendingUp to Color(0xFF10B981)
        "Startups" -> Icons.Filled.TrendingUp to Color(0xFFF59E0B)
        "Education" -> Icons.Filled.School to Color(0xFF3B82F6)
        "Gaming" -> Icons.Filled.Star to Color(0xFF14B8A6)
        "Cooking" -> Icons.Filled.Favorite to Color(0xFFEF4444)
        "Photography" -> Icons.Filled.Image to Color(0xFF84CC16)
        "Travel" -> Icons.Filled.Public to Color(0xFF0EA5E9)
        "Science" -> Icons.Filled.School to Color(0xFF8B5CF6)
        "Health" -> Icons.Filled.Favorite to Color(0xFF22C55E)
        "Art" -> Icons.Filled.Image to Color(0xFFEC4899)
        "Writing" -> Icons.Filled.Label to Color(0xFF78716C)
        "Finance" -> Icons.Filled.TrendingUp to Color(0xFF84CC16)
        "Environment" -> Icons.Filled.Public to Color(0xFF22C55E)
        "Sports" -> Icons.Filled.TrendingUp to Color(0xFFF97316)
        "Volunteering" -> Icons.Filled.Favorite to Color(0xFF06B6D4)
        else -> Icons.Filled.Label to Color(0xFF6B7280)
    }
    return icon to color
}

@Composable
private fun InterestsSectionCard(interests: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = "Interests",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(8.dp))
            if (interests.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    interests.forEach { name ->
                        val (icon, tintColor) = interestStyle(name)
                        val bgColor = tintColor.copy(alpha = 0.2f)
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(bgColor)
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = tintColor,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = name,
                                style = MaterialTheme.typography.labelMedium,
                                color = tintColor
                            )
                        }
                    }
                }
            } else {
                Text(
                    text = "No interests added yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    content: String?,
    emptyMessage: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = content?.takeIf { it.isNotBlank() } ?: emptyMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = if (!content.isNullOrBlank()) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LocationSectionCard(
    location: String?,
    onEditProfile: () -> Unit
) {
    val context = LocalContext.current
    val hasLocation = !location.isNullOrBlank()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                if (hasLocation) {
                    try {
                        val uri = Uri.parse("geo:0,0?q=${Uri.encode(location)}")
                        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                    } catch (_: Exception) { }
                } else {
                    onEditProfile()
                }
            },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.LocationOn,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Location",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = location ?: "No location set.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (hasLocation) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SocialLinksSectionCard(links: SocialLinks?) {
    val context = LocalContext.current
    val items = links?.let { l ->
        listOfNotNull(
            l.linkedin?.let { com.hive.hive_app.R.drawable.ic_linkedin to it },
            l.github?.let { com.hive.hive_app.R.drawable.ic_github to it },
            l.twitter?.let { com.hive.hive_app.R.drawable.ic_twitter to it },
            l.website?.let { com.hive.hive_app.R.drawable.ic_globe to it }
        )
    }.orEmpty()
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = "Social links",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(8.dp))
            if (items.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    items.forEach { (drawableId, url) ->
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clickable {
                                    try {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    } catch (_: Exception) { }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            androidx.compose.foundation.Image(
                                painter = painterResource(drawableId),
                                contentDescription = null,
                                modifier = Modifier.size(24.dp),
                                contentScale = ContentScale.Fit,
                                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)
                            )
                        }
                    }
                }
            } else {
                Text(
                    text = "No social links added yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun TimeBankCard(timeBank: com.hive.hive_app.data.api.dto.TimeBankResponse?) {
    var transactionsExpanded by remember { mutableStateOf(false) }
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = "TimeBank",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            if (timeBank != null) {
                Text(
                    text = "Balance: ${String.format("%.1f", timeBank.balance)} h",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                timeBank.maxBalance?.let {
                    Text(
                        text = "Max: ${String.format("%.1f", it)} h",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                timeBank.canEarn?.let {
                    Text(
                        text = if (it) "Can earn" else "At cap",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (timeBank.transactions.isNotEmpty()) {
                    Spacer(Modifier.height(10.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { transactionsExpanded = !transactionsExpanded },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent transactions (${timeBank.transactions.size})",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Icon(
                            imageVector = if (transactionsExpanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                            contentDescription = if (transactionsExpanded) "Collapse" else "Expand",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (transactionsExpanded) {
                        Spacer(Modifier.height(8.dp))
                        timeBank.transactions.take(10).forEach { tx ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = tx.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "${if (tx.amount >= 0) "+" else ""}${String.format("%.1f", tx.amount)} h",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (tx.amount >= 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                    maxLines = 1,
                                    modifier = Modifier.widthIn(min = 52.dp)
                                )
                            }
                        }
                    }
                }
            } else {
                Text(
                    text = "Loading…",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun BadgesCard(badges: com.hive.hive_app.data.api.dto.BadgesResponse?) {
    var showAllBadges by remember { mutableStateOf(false) }
    val badgeList = badges?.badges.orEmpty()
    val displayedBadges = if (showAllBadges) badgeList else badgeList.filter { it.earned }
    val earnedCount = badges?.earnedCount ?: 0
    val totalCount = badges?.totalCount ?: 0
    val earnedColor = Color(0xFF22C55E)
    val unearnedColor = MaterialTheme.colorScheme.onSurfaceVariant
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Badges",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                if (totalCount > 0) {
                    Text(
                        text = "$earnedCount of $totalCount badges earned",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            if (badgeList.isEmpty()) {
                Text(
                    text = "No badges yet. Complete actions to earn badges.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                displayedBadges.chunked(2).forEach { rowBadges ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        rowBadges.forEach { badge ->
                            val isEarned = badge.earned
                            val tint = if (isEarned) earnedColor else unearnedColor
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .then(
                                        if (isEarned) Modifier.border(1.5.dp, earnedColor, RoundedCornerShape(12.dp))
                                        else Modifier
                                    ),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(Modifier.padding(12.dp)) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(tint.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = badgeIcon(badge.key),
                                            contentDescription = null,
                                            tint = tint,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        text = badge.name ?: badge.key ?: "Badge",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = tint,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = badge.description ?: "",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(Modifier.height(6.dp))
                                    if (isEarned) {
                                        Text(
                                            text = "Earned",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = earnedColor
                                        )
                                    } else {
                                        badge.progress?.let { p ->
                                            val target = p.target.toInt().takeIf { it > 0 } ?: 1
                                            val current = p.current.toInt().coerceIn(0, target)
                                            Text(
                                                text = "$current/$target",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            if (target > 0) {
                                                Spacer(Modifier.height(4.dp))
                                                LinearProgressIndicator(
                                                    progress = { (current.toFloat() / target).coerceIn(0f, 1f) },
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(4.dp)
                                                        .clip(RoundedCornerShape(2.dp)),
                                                    color = earnedColor,
                                                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (rowBadges.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                }
                if (badgeList.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    TextButton(
                        onClick = { showAllBadges = !showAllBadges }
                    ) {
                        Text(
                            text = if (showAllBadges) "Show earned only" else "Show all $totalCount badges",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsClickableCard(user: UserResponse, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Settings",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Profile visible: ${if (user.profileVisible) "Yes" else "No"} · Show email: ${if (user.showEmail) "Yes" else "No"} · Notifications ${if (user.emailNotifications || user.serviceMatchesNotifications || user.messagesNotifications) "On" else "Off"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = "Open settings",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SettingsDialog(
    profile: UserResponse,
    onDismiss: () -> Unit,
    onSave: (com.hive.hive_app.data.api.dto.UserSettingsUpdate) -> Unit
) {
    var profileVisible by remember(profile) { mutableStateOf(profile.profileVisible) }
    var showEmail by remember(profile) { mutableStateOf(profile.showEmail) }
    var showLocation by remember(profile) { mutableStateOf(profile.showLocation) }
    var emailNotifications by remember(profile) { mutableStateOf(profile.emailNotifications) }
    var serviceMatches by remember(profile) { mutableStateOf(profile.serviceMatchesNotifications) }
    var messagesNotifications by remember(profile) { mutableStateOf(profile.messagesNotifications) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Settings") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Profile visible"); Switch(checked = profileVisible, onCheckedChange = { profileVisible = it })
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Show email"); Switch(checked = showEmail, onCheckedChange = { showEmail = it })
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Show location"); Switch(checked = showLocation, onCheckedChange = { showLocation = it })
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Email notifications"); Switch(checked = emailNotifications, onCheckedChange = { emailNotifications = it })
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Service matches"); Switch(checked = serviceMatches, onCheckedChange = { serviceMatches = it })
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Messages"); Switch(checked = messagesNotifications, onCheckedChange = { messagesNotifications = it })
                }
            }
        },
        confirmButton = { Button(onClick = { onSave(com.hive.hive_app.data.api.dto.UserSettingsUpdate(profileVisible, showEmail, showLocation, emailNotifications, serviceMatches, messagesNotifications)) }) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ChangePasswordDialog(
    onDismiss: () -> Unit,
    onSubmit: (current: String, new: String, confirm: String) -> Unit
) {
    var current by remember { mutableStateOf("") }
    var new by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change password") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = current, onValueChange = { current = it }, label = { Text("Current password") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = new, onValueChange = { new = it }, label = { Text("New password") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = confirm, onValueChange = { confirm = it }, label = { Text("Confirm") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = { Button(onClick = { onSubmit(current, new, confirm) }) { Text("Change") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun DeleteAccountDialog(
    onDismiss: () -> Unit,
    onConfirm: (password: String) -> Unit
) {
    var password by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete account") },
        text = {
            Column {
                Text("This will permanently delete your account. Enter your password to confirm.")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = { Button(onClick = { onConfirm(password) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("Delete") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
