package com.hive.hive_app.ui.main

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.SocialLinks
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.util.formatApplicationDate

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val profile by viewModel.profile.collectAsState()
    val timeBank by viewModel.timeBank.collectAsState()
    val badges by viewModel.badges.collectAsState()
    val availableInterests by viewModel.availableInterests.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    var showEditProfile by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showChangePassword by remember { mutableStateOf(false) }
    var showDeleteAccount by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.load() }

    if (showEditProfile && profile != null) {
        EditProfileDialog(
            profile = profile!!,
            availableInterests = availableInterests,
            onDismiss = { showEditProfile = false },
            onSave = { update ->
                viewModel.updateProfile(update)
                showEditProfile = false
            }
        )
    }
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
                    .verticalScroll(rememberScrollState())
            ) {
                profile?.let { user ->
                    Spacer(Modifier.height(12.dp))

                    // 1. Profile header card
                    ProfileHeaderCard(user = user, onEditProfile = { showEditProfile = true })

                    // 2. Bio section (always show, empty state + Add)
                    Spacer(Modifier.height(12.dp))
                    SectionCard(
                        title = "Bio",
                        content = user.bio?.takeIf { it.isNotBlank() },
                        emptyMessage = "No bio added yet.",
                        onAddOrEdit = { showEditProfile = true }
                    )

                    // 3. Location section (always show, empty state + Add)
                    Spacer(Modifier.height(12.dp))
                    SectionCard(
                        title = "Location",
                        content = user.location?.takeIf { it.isNotBlank() },
                        emptyMessage = "No location set.",
                        onAddOrEdit = { showEditProfile = true }
                    )

                    // 4. Interests section (always show, empty state + Add)
                    Spacer(Modifier.height(12.dp))
                    SectionCard(
                        title = "Interests",
                        content = user.interests?.takeIf { it.isNotEmpty() }?.joinToString(", "),
                        emptyMessage = "No interests added yet.",
                        onAddOrEdit = { showEditProfile = true }
                    )

                    // 5. Social links section (always show, empty state + Add)
                    Spacer(Modifier.height(12.dp))
                    SocialLinksSectionCard(user.socialLinks, onAddOrEdit = { showEditProfile = true })

                    // 6. TimeBank card (always show)
                    Spacer(Modifier.height(12.dp))
                    TimeBankCard(timeBank = timeBank)

                    // 7. Badges card (always show)
                    Spacer(Modifier.height(12.dp))
                    BadgesCard(badges = badges)

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
                }
                Spacer(Modifier.height(24.dp))
            }
        }
        Spacer(Modifier.weight(1f))
        Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("Log out") }
    }
}

@Composable
private fun ProfileHeaderCard(user: UserResponse, onEditProfile: () -> Unit) {
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.fullName?.takeIf { it.isNotBlank() } ?: user.username,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "@${user.username}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (user.showEmail) {
                        Text(
                            text = user.email,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = "Role: ${user.role}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (user.isVerified) {
                        Text(
                            text = "Verified",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                OutlinedButton(onClick = onEditProfile) { Text("Edit profile") }
            }
            Text(
                text = "Member since ${formatApplicationDate(user.createdAt)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    content: String?,
    emptyMessage: String,
    onAddOrEdit: () -> Unit
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
            if (!content.isNullOrBlank()) {
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onAddOrEdit) { Text("Edit") }
            } else {
                Text(
                    text = emptyMessage,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onAddOrEdit) { Text("Add") }
            }
        }
    }
}

@Composable
private fun SocialLinksSectionCard(links: SocialLinks?, onAddOrEdit: () -> Unit) {
    val nonNull = links?.let { l ->
        listOfNotNull(
            l.linkedin?.let { "LinkedIn" to it },
            l.github?.let { "GitHub" to it },
            l.twitter?.let { "Twitter" to it },
            l.website?.let { "Website" to it }
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
            if (nonNull.isNotEmpty()) {
                Text(
                    text = nonNull.joinToString(" · ") { "${it.first}: ${it.second}" },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onAddOrEdit) { Text("Edit") }
            } else {
                Text(
                    text = "No social links added yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onAddOrEdit) { Text("Add") }
            }
        }
    }
}

@Composable
private fun TimeBankCard(timeBank: com.hive.hive_app.data.api.dto.TimeBankResponse?) {
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
                    text = "Balance: ${timeBank.balance} hours",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                timeBank.maxBalance?.let { Text(text = "Max: $it hours", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                timeBank.canEarn?.let { Text(text = if (it) "Can earn" else "At cap", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                if (timeBank.transactions.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(8.dp))
                    Text(text = "Recent transactions", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    timeBank.transactions.take(10).forEach { tx ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = tx.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                            Text(
                                text = "${if (tx.amount >= 0) "+" else ""}${tx.amount}h",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (tx.amount >= 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                            )
                        }
                        Text(text = formatApplicationDate(tx.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
    val badgeList = badges?.badges.orEmpty()
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
                badges?.let { b ->
                    Text(
                        text = "${b.earnedCount ?: 0}/${b.totalCount ?: 0} earned",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            if (badgeList.isEmpty()) {
                Text(
                    text = "No badges yet. Complete actions to earn badges.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                badgeList.forEach { badge ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = badge.name ?: badge.key ?: "Badge",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (badge.earned) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        badge.progress?.let { p ->
                            val target = p.target.toInt().takeIf { it > 0 } ?: 1
                            val current = p.current.toInt().coerceIn(0, target)
                            Text(
                                text = " $current/$target",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }
                        if (badge.earned) {
                            Text(
                                text = " ✓",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(start = 4.dp)
                            )
                        }
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
private fun EditProfileDialog(
    profile: UserResponse,
    availableInterests: List<String>,
    onDismiss: () -> Unit,
    onSave: (com.hive.hive_app.data.api.dto.UserUpdate) -> Unit
) {
    var username by remember(profile) { mutableStateOf(profile.username) }
    var fullName by remember(profile) { mutableStateOf(profile.fullName ?: "") }
    var bio by remember(profile) { mutableStateOf(profile.bio ?: "") }
    var location by remember(profile) { mutableStateOf(profile.location ?: "") }
    var selectedInterests by remember(profile) { mutableStateOf(profile.interests.orEmpty().toSet()) }
    var linkedin by remember(profile) { mutableStateOf(profile.socialLinks?.linkedin ?: "") }
    var github by remember(profile) { mutableStateOf(profile.socialLinks?.github ?: "") }
    var twitter by remember(profile) { mutableStateOf(profile.socialLinks?.twitter ?: "") }
    var website by remember(profile) { mutableStateOf(profile.socialLinks?.website ?: "") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit profile") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.verticalScroll(rememberScrollState())
            ) {
                OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text("Username") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = fullName, onValueChange = { fullName = it }, label = { Text("Full name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = bio, onValueChange = { bio = it }, label = { Text("Bio") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = location, onValueChange = { location = it }, label = { Text("Location") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Text("Interests", style = MaterialTheme.typography.labelMedium)
                if (availableInterests.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        availableInterests.chunked(2).forEach { row ->
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                row.forEach { interest ->
                                    val selected = interest in selectedInterests
                                    TextButton(
                                        onClick = {
                                            selectedInterests = if (selected) selectedInterests - interest else selectedInterests + interest
                                        },
                                        colors = if (selected) ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.primary) else ButtonDefaults.textButtonColors()
                                    ) {
                                        Text(if (selected) "✓ $interest" else interest)
                                    }
                                }
                            }
                        }
                    }
                }
                Text("Social links", style = MaterialTheme.typography.labelMedium)
                OutlinedTextField(value = linkedin, onValueChange = { linkedin = it }, label = { Text("LinkedIn") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = github, onValueChange = { github = it }, label = { Text("GitHub") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = twitter, onValueChange = { twitter = it }, label = { Text("Twitter") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = website, onValueChange = { website = it }, label = { Text("Website") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(onClick = {
                onSave(
                    com.hive.hive_app.data.api.dto.UserUpdate(
                        username = username,
                        fullName = fullName.takeIf { it.isNotBlank() },
                        bio = bio.takeIf { it.isNotBlank() },
                        location = location.takeIf { it.isNotBlank() },
                        interests = selectedInterests.toList().takeIf { it.isNotEmpty() },
                        socialLinks = SocialLinks(
                            linkedin = linkedin.takeIf { it.isNotBlank() },
                            github = github.takeIf { it.isNotBlank() },
                            twitter = twitter.takeIf { it.isNotBlank() },
                            website = website.takeIf { it.isNotBlank() }
                        ).takeIf { l -> listOf(l.linkedin, l.github, l.twitter, l.website).any { !it.isNullOrBlank() } }
                    )
                )
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
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
