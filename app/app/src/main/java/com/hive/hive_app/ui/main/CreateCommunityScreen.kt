package com.hive.hive_app.ui.main

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hive.hive_app.data.repository.WikidataTagSuggestion

@Composable
fun CreateCommunityScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    viewModel: ForumViewModel = hiltViewModel()
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var ruleInput by remember { mutableStateOf("") }
    var addedRules by remember { mutableStateOf<List<String>>(emptyList()) }
    var tagQuery by remember { mutableStateOf("") }
    var selectedTags by remember { mutableStateOf<List<WikidataTagSuggestion>>(emptyList()) }
    var selectedCoverImageUri by remember { mutableStateOf<Uri?>(null) }
    var selectedAvatarImageUri by remember { mutableStateOf<Uri?>(null) }
    var localError by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    val pickCoverLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        selectedCoverImageUri = uri
    }
    val pickAvatarLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        selectedAvatarImageUri = uri
    }

    val createCommunityState by viewModel.createCommunityState.collectAsState()
    val tagSuggestions by viewModel.tagSuggestions.collectAsState()
    val tagSearchLoading by viewModel.tagSearchLoading.collectAsState()
    val tagSearchError by viewModel.tagSearchError.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        CommonCreateHeader(title = "Create community", onBack = onBack)
        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = name,
            onValueChange = {
                name = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Name") },
            singleLine = true
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = description,
            onValueChange = {
                description = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Description") },
            minLines = 4,
            shape = RoundedCornerShape(8.dp)
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text("Rules", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = ruleInput,
                onValueChange = { ruleInput = it },
                modifier = Modifier.fillMaxWidth(0.75f),
                label = { Text("Add a rule") },
                placeholder = { Text("Be respectful") },
                singleLine = true,
                shape = RoundedCornerShape(8.dp)
            )
            Button(
                onClick = {
                    val rule = ruleInput.trim()
                    if (rule.isNotBlank() && rule !in addedRules) {
                        addedRules = addedRules + rule
                    }
                    ruleInput = ""
                }
            ) {
                Text("Add")
            }
        }
        if (addedRules.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                addedRules.forEach { rule ->
                    FilterChip(
                        selected = true,
                        onClick = { addedRules = addedRules.filterNot { it == rule } },
                        label = { Text(rule) },
                        colors = commonLimeFilterChipColors()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        CommonTagSelectorSection(
            tagQuery = tagQuery,
            onTagQueryChange = {
                tagQuery = it
                viewModel.setTagSearchQuery(it)
            },
            tagSuggestions = tagSuggestions,
            tagSearchLoading = tagSearchLoading,
            tagSearchError = tagSearchError,
            selectedTags = selectedTags,
            onAddTag = {
                selectedTags = selectedTags + it
                tagQuery = ""
                viewModel.setTagSearchQuery("")
            },
            onRemoveTag = { suggestion ->
                selectedTags = selectedTags.filterNot { it.id == suggestion.id }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))
        CommonSectionLabel("Community Images")
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = { pickCoverLauncher.launch("image/*") },
                enabled = !createCommunityState.isSubmitting,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Filled.AddAPhoto, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (selectedCoverImageUri == null) "Pick Cover" else "Change Cover")
            }
            OutlinedButton(
                onClick = { pickAvatarLauncher.launch("image/*") },
                enabled = !createCommunityState.isSubmitting,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Filled.AddAPhoto, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (selectedAvatarImageUri == null) "Pick Avatar" else "Change Avatar")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(modifier = Modifier.weight(1f)) {
                if (selectedCoverImageUri != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(selectedCoverImageUri).crossfade(true).build(),
                        contentDescription = "Cover preview",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(96.dp)
                            .clip(RoundedCornerShape(10.dp))
                    )
                } else {
                    Text("No cover selected", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Box(modifier = Modifier.weight(1f)) {
                if (selectedAvatarImageUri != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(selectedAvatarImageUri).crossfade(true).build(),
                        contentDescription = "Avatar preview",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(96.dp)
                            .clip(RoundedCornerShape(10.dp))
                    )
                } else {
                    Text("No avatar selected", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        if (!localError.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(localError!!, color = MaterialTheme.colorScheme.error)
        }
        if (createCommunityState.error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(createCommunityState.error!!, color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                if (name.trim().length < 3) {
                    localError = "Name must be at least 3 characters"
                    return@Button
                }
                if (description.trim().isBlank()) {
                    localError = "Description is required"
                    return@Button
                }
                localError = null
                viewModel.createCommunityRich(
                    name = name,
                    description = description,
                    rules = addedRules,
                    tags = selectedTags,
                    coverImageUri = selectedCoverImageUri,
                    avatarImageUri = selectedAvatarImageUri
                ) { id ->
                    onCreated(id)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !createCommunityState.isSubmitting
        ) {
            if (createCommunityState.isSubmitting) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text("Create community")
            }
        }
    }
}
