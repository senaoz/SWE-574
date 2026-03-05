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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import androidx.compose.ui.platform.LocalContext
import com.hive.hive_app.data.api.dto.BadgesResponse
import com.hive.hive_app.data.api.dto.SocialLinks
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.util.formatApplicationDate

@Composable
fun UserProfileScreen(
    userId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: UserProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val badges by viewModel.badges.collectAsState()
    val ratings by viewModel.ratings.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(userId) { viewModel.load(userId) }

    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Text(
                text = "Profile",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
        when {
            isLoading && user == null -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            error != null -> {
                Text(
                    text = error!!,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp)
                )
            }
            user != null -> {
                val u = user!!
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    UserProfileHeaderCard(user = u, badges = badges, ratings = ratings)
                    Spacer(Modifier.height(12.dp))
                    UserProfileSectionCard(
                        title = "Bio",
                        content = u.bio?.takeIf { it.isNotBlank() },
                        emptyMessage = "No bio added yet."
                    )
                    Spacer(Modifier.height(12.dp))
                    UserProfileLocationCard(location = u.location?.takeIf { it.isNotBlank() })
                    Spacer(Modifier.height(12.dp))
                    UserProfileInterestsCard(interests = u.interests.orEmpty())
                    Spacer(Modifier.height(12.dp))
                    UserProfileSocialLinksCard(links = u.socialLinks)
                    Spacer(Modifier.height(12.dp))
                    UserProfileTimeBankCard(balance = u.timebankBalance)
                    Spacer(Modifier.height(12.dp))
                    UserProfileBadgesCard(badges = badges)
                }
            }
        }
    }
}

@Composable
private fun UserProfileHeaderCard(
    user: UserResponse,
    badges: BadgesResponse?,
    ratings: com.hive.hive_app.data.api.dto.RatingListResponse?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        val context = LocalContext.current
        Column(
            modifier = Modifier.padding(16.dp),
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
                val initials = (user.fullName ?: user.username)
                    .trim()
                    .split(" ")
                    .filter { it.isNotBlank() }
                    .take(2)
                    .joinToString("") { it.first().uppercase() }
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
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
            ratings?.averageScore?.let { avg ->
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "%.1f".format(avg),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                UserProfileStat(label = "Hours", value = String.format("%.1f", user.timebankBalance))
                UserProfileStat(label = "Badges", value = "${badges?.earnedCount ?: 0}/${badges?.totalCount ?: 0}")
                UserProfileStat(label = "Member", value = formatApplicationDate(user.createdAt))
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Member since ${formatApplicationDate(user.createdAt)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun UserProfileStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
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

@Composable
private fun UserProfileSectionCard(title: String, content: String?, emptyMessage: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
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
private fun UserProfileLocationCard(location: String?) {
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (!location.isNullOrBlank()) Modifier.clickable {
                    try {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(location)}")))
                    } catch (_: Exception) { }
                } else Modifier
            ),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(text = "Location", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(4.dp))
                Text(
                    text = location ?: "No location set.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (!location.isNullOrBlank()) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private fun userProfileInterestStyle(name: String): Pair<ImageVector, Color> = when (name) {
    "Technology" -> Icons.Default.Public to Color(0xFF0EA5E9)
    "Design" -> Icons.Default.Image to Color(0xFF8B5CF6)
    "Language Exchange" -> Icons.Default.Person to Color(0xFF06B6D4)
    "AI" -> Icons.Default.School to Color(0xFF6366F1)
    "Music" -> Icons.Default.Star to Color(0xFFEC4899)
    "Fitness" -> Icons.Default.TrendingUp to Color(0xFF10B981)
    "Startups" -> Icons.Default.TrendingUp to Color(0xFFF59E0B)
    "Education" -> Icons.Default.School to Color(0xFF3B82F6)
    "Gaming" -> Icons.Default.Star to Color(0xFF14B8A6)
    "Cooking" -> Icons.Default.Favorite to Color(0xFFEF4444)
    "Photography" -> Icons.Default.Image to Color(0xFF84CC16)
    "Travel" -> Icons.Default.Public to Color(0xFF0EA5E9)
    "Science" -> Icons.Default.School to Color(0xFF8B5CF6)
    "Health" -> Icons.Default.Favorite to Color(0xFF22C55E)
    "Art" -> Icons.Default.Image to Color(0xFFEC4899)
    "Writing" -> Icons.Default.Label to Color(0xFF78716C)
    "Finance" -> Icons.Default.TrendingUp to Color(0xFF84CC16)
    "Environment" -> Icons.Default.Public to Color(0xFF22C55E)
    "Sports" -> Icons.Default.TrendingUp to Color(0xFFF97316)
    "Volunteering" -> Icons.Default.Favorite to Color(0xFF06B6D4)
    else -> Icons.Default.Label to Color(0xFF6B7280)
}

@Composable
private fun UserProfileInterestsCard(interests: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(text = "Interests", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            if (interests.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    interests.forEach { name ->
                        val (icon, tintColor) = userProfileInterestStyle(name)
                        val bgColor = tintColor.copy(alpha = 0.2f)
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(bgColor)
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(imageVector = icon, contentDescription = null, tint = tintColor, modifier = Modifier.size(18.dp))
                            Text(text = name, style = MaterialTheme.typography.labelMedium, color = tintColor)
                        }
                    }
                }
            } else {
                Text(text = "No interests added yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun UserProfileSocialLinksCard(links: SocialLinks?) {
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
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(text = "Social links", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
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
                Text(text = "No social links added yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun UserProfileTimeBankCard(balance: Double) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(text = "TimeBank", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Balance: $balance hours",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

private fun userProfileBadgeIcon(key: String?): ImageVector = when (key) {
    "newcomer" -> Icons.Default.Person
    "profile_complete" -> Icons.Default.Image
    "tagged", "well_tagged" -> Icons.Default.Label
    "rated" -> Icons.Default.Star
    "popular" -> Icons.Default.TrendingUp
    "community_favorite" -> Icons.Default.Favorite
    "helper", "helper_hero", "master_helper" -> Icons.Default.School
    "generous_giver" -> Icons.Default.Schedule
    else -> Icons.Default.Star
}

@Composable
private fun UserProfileBadgesCard(badges: BadgesResponse?) {
    var showAllBadges by remember { mutableStateOf(false) }
    val badgeList = badges?.badges.orEmpty()
    val displayedBadges = if (showAllBadges) badgeList else badgeList.filter { it.earned }
    val earnedCount = badges?.earnedCount ?: 0
    val totalCount = badges?.totalCount ?: 0
    val earnedColor = Color(0xFF22C55E)
    val unearnedColor = MaterialTheme.colorScheme.onSurfaceVariant
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Badges", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
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
                    text = "No badges yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    displayedBadges.forEach { badge ->
                        val isEarned = badge.earned
                        val tint = if (isEarned) earnedColor else unearnedColor
                        Card(
                            modifier = Modifier
                                .width(160.dp)
                                .then(if (isEarned) Modifier.border(1.5.dp, earnedColor, RoundedCornerShape(12.dp)) else Modifier),
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
                                        imageVector = userProfileBadgeIcon(badge.key),
                                        contentDescription = null,
                                        tint = tint,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = badge.name ?: badge.key ?: "Badge",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = tint
                                )
                                Text(
                                    text = badge.description ?: "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 2
                                )
                                Spacer(Modifier.height(6.dp))
                                if (isEarned) {
                                    Text(text = "Earned", style = MaterialTheme.typography.labelSmall, color = earnedColor)
                                } else {
                                    badge.progress?.let { p ->
                                        val target = p.target.toInt().takeIf { it > 0 } ?: 1
                                        val current = p.current.toInt().coerceIn(0, target)
                                        Text(text = "$current/$target", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        if (target > 0) {
                                            Spacer(Modifier.height(4.dp))
                                            LinearProgressIndicator(
                                                progress = { (current.toFloat() / target).coerceIn(0f, 1f) },
                                                modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                                                color = earnedColor,
                                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (totalCount > 0) {
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { showAllBadges = !showAllBadges }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
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
