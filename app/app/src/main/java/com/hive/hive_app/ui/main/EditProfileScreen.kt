package com.hive.hive_app.ui.main

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.hive.hive_app.R
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.dto.SocialLinks
import com.hive.hive_app.ui.theme.Lime500
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private const val FALLBACK_LAT = 41.0082
private const val FALLBACK_LON = 28.9784

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    onBack: () -> Unit,
    onSaved: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val profile by viewModel.profile.collectAsState()
    val availableInterests by viewModel.availableInterests.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var userLat by remember { mutableStateOf<Double?>(null) }
    var userLon by remember { mutableStateOf<Double?>(null) }
    var locationPermissionGranted by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        locationPermissionGranted = granted
        if (granted) {
            scope.launch {
                val (lat, lon) = readLastKnownLocation(context)
                userLat = lat
                userLon = lon
            }
        }
    }

    LaunchedEffect(Unit) {
        viewModel.load()
        locationPermissionGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (locationPermissionGranted) {
            val (lat, lon) = readLastKnownLocation(context)
            userLat = lat
            userLon = lon
        }
    }

    var showLocationPicker by rememberSaveable { mutableStateOf(false) }
    var selectedLat by rememberSaveable { mutableStateOf(FALLBACK_LAT) }
    var selectedLon by rememberSaveable { mutableStateOf(FALLBACK_LON) }

    LaunchedEffect(userLat, userLon) {
        val lat = userLat
        val lon = userLon
        if (lat != null && lon != null) {
            selectedLat = lat
            selectedLon = lon
        }
    }

    val user = profile
    if (user == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            if (isLoading) CircularProgressIndicator()
            TextButton(onClick = onBack) { Text("Back") }
        }
        return
    }

    var username by remember(user._id) { mutableStateOf(user.username) }
    var fullName by remember(user._id) { mutableStateOf(user.fullName ?: "") }
    var bio by remember(user._id) { mutableStateOf(user.bio ?: "") }
    var location by remember(user._id) { mutableStateOf(user.location ?: "") }
    var selectedInterests by remember(user._id) { mutableStateOf(user.interests.orEmpty().toSet()) }
    var linkedin by remember(user._id) { mutableStateOf(user.socialLinks?.linkedin ?: "") }
    var github by remember(user._id) { mutableStateOf(user.socialLinks?.github ?: "") }
    var twitter by remember(user._id) { mutableStateOf(user.socialLinks?.twitter ?: "") }
    var website by remember(user._id) { mutableStateOf(user.socialLinks?.website ?: "") }

    fun requestLocationPermission() {
        permissionLauncher.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
    }

    if (showLocationPicker) {
        LocationPickerScreen(
            initialLat = selectedLat,
            initialLon = selectedLon,
            canUseMyLocation = locationPermissionGranted && userLat != null && userLon != null,
            myLat = userLat,
            myLon = userLon,
            onRequestLocationPermission = { requestLocationPermission() },
            onBack = { showLocationPicker = false },
            onSelected = { lat, lon, _ ->
                selectedLat = lat
                selectedLon = lon
                showLocationPicker = false
                scope.launch {
                    val cityDistrict = withContext(Dispatchers.IO) {
                        reverseGeocodeCityDistrict(context, lat, lon)
                    }
                    location = cityDistrict?.takeIf { it.isNotBlank() } ?: ""
                }
            }
        )
        return
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = { Text("Edit profile") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Full name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                label = { Text("Bio") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Location (City & District)") },
                placeholder = { Text("e.g. Istanbul, Kadıköy") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        if (!locationPermissionGranted) {
                            requestLocationPermission()
                            return@OutlinedButton
                        }
                        val lat = userLat
                        val lon = userLon
                        if (lat != null && lon != null) {
                            selectedLat = lat
                            selectedLon = lon
                            scope.launch {
                                val resolved = withContext(Dispatchers.IO) {
                                    reverseGeocodeCityDistrict(context, lat, lon)
                                }
                                location = resolved?.takeIf { it.isNotBlank() } ?: ""
                            }
                        }
                    }
                ) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Use my location")
                }
                OutlinedButton(onClick = { showLocationPicker = true }) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Pick on map")
                }
            }
            Text("Interests", style = MaterialTheme.typography.labelMedium)
            if (availableInterests.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    availableInterests.forEach { interest ->
                        val selected = interest in selectedInterests
                        val outline = if (selected) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        }
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .border(1.dp, outline, RoundedCornerShape(20.dp))
                                .clickable {
                                    selectedInterests =
                                        if (selected) selectedInterests - interest else selectedInterests + interest
                                }
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = interestIcon(interest),
                                contentDescription = null,
                                tint = Lime500,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = interest,
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
            Text("Social links", style = MaterialTheme.typography.labelMedium)
            OutlinedTextField(
                value = linkedin,
                onValueChange = { linkedin = it },
                label = { Text("LinkedIn") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = {
                    Icon(
                        painter = painterResource(R.drawable.ic_linkedin),
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Lime500
                    )
                }
            )
            OutlinedTextField(
                value = github,
                onValueChange = { github = it },
                label = { Text("GitHub") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = {
                    Icon(
                        painter = painterResource(R.drawable.ic_github),
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Lime500
                    )
                }
            )
            OutlinedTextField(
                value = twitter,
                onValueChange = { twitter = it },
                label = { Text("Twitter / X") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = {
                    Icon(
                        painter = painterResource(R.drawable.ic_twitter),
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Lime500
                    )
                }
            )
            OutlinedTextField(
                value = website,
                onValueChange = { website = it },
                label = { Text("Website") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = {
                    Icon(
                        painter = painterResource(R.drawable.ic_globe),
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Lime500
                    )
                }
            )
            Spacer(Modifier.padding(top = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
            ) {
                TextButton(onClick = onBack) { Text("Cancel") }
                Button(
                    onClick = {
                        viewModel.updateProfile(
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
                                ).takeIf { l ->
                                    listOf(l.linkedin, l.github, l.twitter, l.website).any { !it.isNullOrBlank() }
                                }
                            )
                        )
                        onSaved()
                        onBack()
                    }
                ) { Text("Save") }
            }
        }
    }
}

private suspend fun readLastKnownLocation(context: Context): Pair<Double?, Double?> =
    withContext(Dispatchers.IO) {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return@withContext null to null
        val loc =
            lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                ?: lm.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
        loc?.latitude to loc?.longitude
    }

private fun interestIcon(name: String): ImageVector = when (name) {
    "Technology" -> Icons.Filled.Public
    "Design" -> Icons.Filled.Image
    "Language Exchange" -> Icons.Filled.Person
    "AI" -> Icons.Filled.School
    "Music" -> Icons.Filled.Star
    "Fitness" -> Icons.Filled.TrendingUp
    "Startups" -> Icons.Filled.TrendingUp
    "Education" -> Icons.Filled.School
    "Gaming" -> Icons.Filled.Star
    "Cooking" -> Icons.Filled.Favorite
    "Photography" -> Icons.Filled.Image
    "Travel" -> Icons.Filled.Public
    "Science" -> Icons.Filled.School
    "Health" -> Icons.Filled.Favorite
    "Art" -> Icons.Filled.Image
    "Writing" -> Icons.Filled.Label
    "Finance" -> Icons.Filled.TrendingUp
    "Environment" -> Icons.Filled.Public
    "Sports" -> Icons.Filled.TrendingUp
    "Volunteering" -> Icons.Filled.Favorite
    else -> Icons.Filled.Label
}
