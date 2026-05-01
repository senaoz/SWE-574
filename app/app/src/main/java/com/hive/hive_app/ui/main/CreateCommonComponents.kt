package com.hive.hive_app.ui.main

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Public
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.hive.hive_app.data.api.dto.CommunityResponse
import com.hive.hive_app.data.repository.WikidataTagSuggestion
import com.hive.hive_app.ui.theme.Lime50
import com.hive.hive_app.ui.theme.Lime500

@Composable
fun CommonCreateHeader(
    title: String,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun CommonSectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
fun commonLimeFilterChipColors() = FilterChipDefaults.filterChipColors(
    selectedContainerColor = Lime50,
    selectedLabelColor = Lime500,
    selectedLeadingIconColor = Lime500
)

@Composable
fun CommonTagSelectorSection(
    tagQuery: String,
    onTagQueryChange: (String) -> Unit,
    tagSuggestions: List<WikidataTagSuggestion>,
    tagSearchLoading: Boolean,
    tagSearchError: String?,
    selectedTags: List<WikidataTagSuggestion>,
    onAddTag: (WikidataTagSuggestion) -> Unit,
    onRemoveTag: (WikidataTagSuggestion) -> Unit
) {
    CommonSectionLabel("Tags (Wikidata)")
    Spacer(modifier = Modifier.height(8.dp))
    OutlinedTextField(
        value = tagQuery,
        onValueChange = onTagQueryChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text("Search tags") },
        placeholder = { Text("Start typing") },
        singleLine = true,
        shape = RoundedCornerShape(12.dp)
    )

    if (tagSearchLoading) {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Searching...",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
    if (!tagSearchError.isNullOrBlank()) {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = tagSearchError,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error
        )
    }
    if (tagSuggestions.isNotEmpty() && tagQuery.isNotBlank()) {
        Spacer(modifier = Modifier.height(8.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(8.dp)) {
                tagSuggestions.forEach { suggestion ->
                    val alreadySelected = selectedTags.any { it.id == suggestion.id }
                    androidx.compose.material3.TextButton(
                        onClick = { if (!alreadySelected) onAddTag(suggestion) },
                        enabled = !alreadySelected
                    ) {
                        Text(suggestion.label)
                    }
                }
            }
        }
    }
    if (selectedTags.isNotEmpty()) {
        Spacer(modifier = Modifier.height(10.dp))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            selectedTags.forEach { suggestion ->
                FilterChip(
                    selected = true,
                    onClick = { onRemoveTag(suggestion) },
                    label = { Text(suggestion.label) },
                    colors = commonLimeFilterChipColors(),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = true,
                        borderColor = Lime500,
                        selectedBorderColor = Lime500
                    )
                )
            }
        }
    }
}

@Composable
fun CommonImagePickerSection(
    selectedImageUris: List<Uri>,
    onImagesChanged: (List<Uri>) -> Unit,
    enabled: Boolean
) {
    val context = LocalContext.current
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (!uris.isNullOrEmpty()) {
            onImagesChanged(selectedImageUris + uris)
        }
    }

    CommonSectionLabel("Images")
    Spacer(modifier = Modifier.height(8.dp))
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = { imagePickerLauncher.launch("image/*") },
            enabled = enabled
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add images")
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add images")
        }
        if (selectedImageUris.isNotEmpty()) {
            OutlinedButton(
                onClick = { onImagesChanged(emptyList()) },
                enabled = enabled,
                modifier = Modifier.weight(1f)
            ) {
                Text("Clear (${selectedImageUris.size})")
            }
        }
    }

    if (selectedImageUris.isNotEmpty()) {
        Spacer(modifier = Modifier.height(10.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(selectedImageUris, key = { it.toString() }) { uri ->
                Box(modifier = Modifier.size(72.dp)) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(uri).crossfade(true).build(),
                        contentDescription = "Selected image",
                        modifier = Modifier
                            .size(72.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                    )
                    IconButton(
                        onClick = {
                            onImagesChanged(selectedImageUris.filterNot { it == uri })
                        },
                        enabled = enabled,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(26.dp)
                    ) {
                        Icon(
                            Icons.Filled.Close,
                            contentDescription = "Remove image",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ReadOnlyPickerField(
    value: String,
    label: String,
    placeholder: String,
    onClick: () -> Unit
) {
    Box(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            enabled = false,
            readOnly = true,
            shape = RoundedCornerShape(12.dp)
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .clip(RoundedCornerShape(12.dp))
                .clickable(
                    onClick = onClick,
                    indication = null,
                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                )
        )
    }
}

@Composable
fun CommunitySelectorSection(
    selectedCommunityId: String?,
    communities: List<CommunityResponse>,
    isLoading: Boolean,
    loadError: String?,
    onOpenPicker: () -> Unit
) {
    val selectedCommunity = communities.firstOrNull { it.id == selectedCommunityId }

    CommonSectionLabel("Associated Community")
    Spacer(modifier = Modifier.height(8.dp))
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpenPicker),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (selectedCommunity != null) {
                SelectorCommunityAvatar(
                    name = selectedCommunity.name,
                    avatarUrl = selectedCommunity.avatarUrl,
                    size = 34.dp
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = selectedCommunity.name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Posting under selected community",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Public,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Public (no community)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "No community selected",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Text(
                text = "Change",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }

    if (isLoading) {
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Loading communities...",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    } else if (!loadError.isNullOrBlank()) {
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = loadError,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error
        )
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun CommunitySelectorDialog(
    communities: List<CommunityResponse>,
    selectedCommunityId: String?,
    onSelect: (String?) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Choose community",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(10.dp))

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onSelect(null)
                        onDismiss()
                    },
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedCommunityId == null) {
                        MaterialTheme.colorScheme.primaryContainer
                    } else {
                        MaterialTheme.colorScheme.surfaceVariant
                    }
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Public,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Public (no community)",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "Visible without community context",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (selectedCommunityId == null) {
                        Text(
                            text = "Selected",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(10.dp))

            LazyColumn(modifier = Modifier.fillMaxWidth().heightIn(max = 360.dp)) {
                items(communities, key = { it.id }) { community ->
                    val isSelected = community.id == selectedCommunityId
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clickable {
                                onSelect(community.id)
                                onDismiss()
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) {
                                MaterialTheme.colorScheme.primaryContainer
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant
                            }
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            SelectorCommunityAvatar(
                                name = community.name,
                                avatarUrl = community.avatarUrl,
                                size = 30.dp
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = community.name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${community.memberCount} members",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (isSelected) {
                                Text(
                                    text = "Selected",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            TextButton(
                onClick = onDismiss,
                modifier = Modifier.align(Alignment.End)
            ) {
                Text("Close")
            }
        }
    }
}

@Composable
private fun SelectorCommunityAvatar(
    name: String,
    avatarUrl: String?,
    size: androidx.compose.ui.unit.Dp
) {
    val context = LocalContext.current
    Card(
        modifier = Modifier.size(size),
        shape = CircleShape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = ImageRequest.Builder(context).data(avatarUrl).crossfade(true).build(),
                contentDescription = null,
                modifier = Modifier
                    .size(size)
                    .clip(CircleShape)
            )
        } else {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = name.firstOrNull()?.uppercase() ?: "C",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}
