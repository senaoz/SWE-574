package com.hive.hive_app.ui.main

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.repository.WikidataTagSuggestion

@Composable
fun CreateDiscussionScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    viewModel: ForumViewModel = hiltViewModel()
) {
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var tagQuery by remember { mutableStateOf("") }
    var selectedTags by remember { mutableStateOf<List<WikidataTagSuggestion>>(emptyList()) }
    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var selectedCommunityId by remember { mutableStateOf<String?>(null) }
    var showCommunityDialog by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }

    val createState by viewModel.createState.collectAsState()
    val tagSuggestions by viewModel.tagSuggestions.collectAsState()
    val tagSearchLoading by viewModel.tagSearchLoading.collectAsState()
    val tagSearchError by viewModel.tagSearchError.collectAsState()
    val communitiesState by viewModel.communitiesListState.collectAsState()

    LaunchedEffect(Unit) {
        if (communitiesState.communities.isEmpty() && !communitiesState.isLoading) {
            viewModel.loadCommunities(1)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        CommonCreateHeader(title = "Create discussion", onBack = onBack)
        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = title,
            onValueChange = {
                title = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Title") },
            placeholder = { Text("What would you like to discuss?") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = body,
            onValueChange = {
                body = it
                localError = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Body") },
            placeholder = { Text("Share context, details, and your question.") },
            minLines = 5,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        CommunitySelectorSection(
            selectedCommunityId = selectedCommunityId,
            communities = communitiesState.communities,
            isLoading = communitiesState.isLoading,
            loadError = communitiesState.error,
            onOpenPicker = { showCommunityDialog = true }
        )

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
            onAddTag = { suggestion ->
                selectedTags = selectedTags + suggestion
                tagQuery = ""
                viewModel.setTagSearchQuery("")
            },
            onRemoveTag = { suggestion ->
                selectedTags = selectedTags.filterNot { it.id == suggestion.id }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))
        CommonImagePickerSection(
            selectedImageUris = selectedImageUris,
            onImagesChanged = { selectedImageUris = it },
            enabled = !createState.isSubmitting
        )

        if (!localError.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(localError!!, color = MaterialTheme.colorScheme.error)
        }
        if (createState.error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(createState.error!!, color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                if (title.trim().length < 3) {
                    localError = "Title must be at least 3 characters"
                    return@Button
                }
                if (body.trim().isBlank()) {
                    localError = "Body is required"
                    return@Button
                }
                localError = null
                viewModel.createDiscussionRich(
                    title = title,
                    body = body,
                    tags = selectedTags,
                    communityId = selectedCommunityId,
                    imageUris = selectedImageUris
                ) { id ->
                    onCreated(id)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !createState.isSubmitting
        ) {
            if (createState.isSubmitting) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text("Create discussion")
            }
        }
    }

    if (showCommunityDialog) {
        CommunitySelectorDialog(
            communities = communitiesState.communities,
            selectedCommunityId = selectedCommunityId,
            onSelect = { selectedCommunityId = it },
            onDismiss = { showCommunityDialog = false }
        )
    }
}
