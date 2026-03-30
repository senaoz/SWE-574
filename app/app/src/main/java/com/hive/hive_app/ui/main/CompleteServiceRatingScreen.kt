package com.hive.hive_app.ui.main

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

/** Selected filter chips / checkbox accent (lime-ish, not grey). */
private val LimeSelected = Color(0xFFC6E600)
private val LimeSelectedContainer = Color(0xFFE8F5B8)
private val OnLimeDark = Color(0xFF2D3A00)

private val FEEDBACK_TAGS = listOf(
    "Clear Communicator", "Prepared", "Organized", "Responsible", "Trustworthy",
    "Helpful", "Kind", "Respectful", "Flexible", "Patient", "Reliable",
    "Collaborative", "Understanding", "Appreciative", "Easy to Work With"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompleteServiceRatingScreen(
    args: CompleteServiceRatingArgs,
    onBack: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: ActiveItemsViewModel = hiltViewModel()
) {
    var confirmed by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }
    var selectedTags by remember { mutableStateOf(setOf<String>()) }
    var comment by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Confirm completion & rate") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(20.dp)
        ) {
            Text(
                text = "Confirm completion & rate",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Service: ${args.serviceTitle}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(top = 12.dp)
            )
            Text(
                text = "With: ${args.otherName}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Credits: ${if (args.creditsHours == 1.0) "1 hour" else "${args.creditsHours} hours"}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 16.dp)) {
                Checkbox(
                    checked = confirmed,
                    onCheckedChange = { confirmed = it },
                    colors = CheckboxDefaults.colors(
                        checkedColor = LimeSelected,
                        checkmarkColor = OnLimeDark,
                        uncheckedColor = MaterialTheme.colorScheme.outline
                    )
                )
                Text(
                    text = "I confirm that the service was completed as agreed.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Surface(
                modifier = Modifier.padding(top = 8.dp),
                color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Once confirmed, the time credits will be transferred and this action cannot be undone.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }

            Text(
                text = "Rate this exchange*",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(top = 16.dp)
            )
            Row(modifier = Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                (1..5).forEach { s ->
                    IconButton(onClick = { score = s }) {
                        Icon(
                            imageVector = if (s <= score) Icons.Filled.Star else Icons.Outlined.Star,
                            contentDescription = "$s stars",
                            tint = if (s <= score) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    }
                }
            }

            Text(
                text = "Feedback*",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(top = 12.dp)
            )
            FlowRow(
                modifier = Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                FEEDBACK_TAGS.forEach { tag ->
                    FilterChip(
                        selected = tag in selectedTags,
                        onClick = {
                            selectedTags = if (tag in selectedTags) selectedTags - tag else selectedTags + tag
                        },
                        label = { Text(tag) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = LimeSelectedContainer,
                            selectedLabelColor = OnLimeDark,
                            selectedLeadingIconColor = OnLimeDark,
                            selectedTrailingIconColor = OnLimeDark,
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }

            Text(
                text = "Additional Comments (Optional)",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(top = 12.dp)
            )
            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                placeholder = { Text("How was your experience?") },
                minLines = 2,
                shape = RoundedCornerShape(12.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TextButton(onClick = onBack) { Text("Cancel") }
                val canSubmit = confirmed && score in 1..5 && selectedTags.isNotEmpty()
                Button(
                    onClick = {
                        if (canSubmit) {
                            viewModel.confirmAndRate(
                                args.transactionId,
                                args.ratedUserId,
                                score,
                                selectedTags.toList(),
                                comment.takeIf { it.isNotBlank() }
                            ) { ok, _ ->
                                if (ok) onSuccess()
                            }
                        }
                    },
                    enabled = canSubmit,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("Confirm & Rate", modifier = Modifier.padding(start = 4.dp))
                }
            }
        }
    }
}
