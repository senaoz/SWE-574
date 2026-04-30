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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
