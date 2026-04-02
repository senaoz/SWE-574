package com.hive.hive_app.ui.main

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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hive.hive_app.data.api.dto.RatingResponse
import com.hive.hive_app.data.api.dto.TransactionResponse
import com.hive.hive_app.data.api.dto.UserResponse
import com.hive.hive_app.util.formatApplicationDate

/** Same lime accent as Manage Service / rating flows. */
private val RatingTagLime = Color(0xFFC6E600)

@Composable
private fun RatingStarsRow(score: Int, max: Int = 5) {
    val filled = score.coerceIn(0, max)
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
        repeat(max) { index ->
            Icon(
                imageVector = Icons.Filled.Star,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = if (index < filled) {
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.48f)
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f)
                }
            )
        }
    }
}

@Composable
fun UserRatingsScreen(
    userId: String,
    title: String,
    onBack: () -> Unit,
    onOpenRaterProfile: (raterUserId: String) -> Unit,
    onOpenExchange: (serviceId: String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: UserRatingsViewModel = hiltViewModel()
) {
    val ratings by viewModel.ratings.collectAsState()
    val total by viewModel.total.collectAsState()
    val averageScore by viewModel.averageScore.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val hasMore by viewModel.hasMore.collectAsState()
    val raterById by viewModel.raterById.collectAsState()
    val transactionById by viewModel.transactionById.collectAsState()
    val tagCounts by viewModel.tagCounts.collectAsState()

    LaunchedEffect(userId) { viewModel.load(userId, reset = true) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        if (total > 0 || averageScore != null) {
            val avg = averageScore ?: 0.0
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .border(1.5.dp, RatingTagLime, RoundedCornerShape(12.dp)),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(end = 4.dp)
                        )
                        Text(
                            text = String.format("%.1f", avg),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "($total ratings)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (tagCounts.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "Most common tags",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(8.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            tagCounts.forEach { (label, count) ->
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    modifier = Modifier.border(1.dp, RatingTagLime, RoundedCornerShape(16.dp))
                                ) {
                                    Text(
                                        text = "$label ×$count",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        error?.let { msg ->
            Text(
                text = msg,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp)
            )
        }

        when {
            isLoading && ratings.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            ratings.isEmpty() && !isLoading -> {
                Text(
                    text = "No ratings yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp)
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(ratings, key = { it._id ?: "${it.transactionId}_${it.createdAt}" }) { item ->
                        RatingListItem(
                            rating = item,
                            rater = item.raterId?.let { raterById[it] },
                            transaction = item.transactionId?.let { transactionById[it] },
                            onOpenRaterProfile = onOpenRaterProfile,
                            onOpenExchange = onOpenExchange
                        )
                    }
                    if (isLoading && ratings.isNotEmpty()) {
                        item {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(modifier = Modifier.height(32.dp))
                            }
                        }
                    }
                    if (hasMore) {
                        item {
                            OutlinedButton(
                                onClick = { viewModel.loadMore(userId) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                enabled = !isLoading
                            ) {
                                Text("Load more")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RatingListItem(
    rating: RatingResponse,
    rater: UserResponse?,
    transaction: TransactionResponse?,
    onOpenRaterProfile: (String) -> Unit,
    onOpenExchange: (String) -> Unit
) {
    val context = LocalContext.current
    val raterId = rating.raterId
    val displayName = rater?.fullName?.takeIf { it.isNotBlank() } ?: rater?.username ?: "User"
    val canOpenRater = raterId != null

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                RatingStarsRow(score = rating.score)
                rating.createdAt?.let { created ->
                    Text(
                        text = formatApplicationDate(created),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (raterId != null) {
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .then(
                            if (canOpenRater) Modifier.clickable { onOpenRaterProfile(raterId) }
                            else Modifier
                        ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface)
                    ) {
                        val pic = rater?.profilePicture
                        if (!pic.isNullOrBlank()) {
                            val req = buildImageRequest(context, pic)
                            if (req != null) {
                                AsyncImage(
                                    model = req,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Icon(
                                    Icons.Filled.Person,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(8.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        } else {
                            Icon(
                                Icons.Filled.Person,
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(8.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "From ",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = displayName,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                Spacer(Modifier.height(10.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Spacer(Modifier.height(10.dp))
            }

            rating.transactionId?.let {
                val txn = transaction
                val serviceId = txn?.serviceId
                val desc = txn?.description?.trim().orEmpty()
                val label = when {
                    desc.isNotBlank() -> desc
                    serviceId != null -> "Exchange"
                    else -> ""
                }
                if (label.isNotBlank()) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (serviceId != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .fillMaxWidth()
                            .then(
                                if (serviceId != null) Modifier.clickable { onOpenExchange(serviceId) }
                                else Modifier
                            )
                    )
                    Spacer(Modifier.height(8.dp))
                }
            }

            rating.tags.orEmpty().filter { it.isNotBlank() }.takeIf { it.isNotEmpty() }?.let { tags ->
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    tags.forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            modifier = Modifier.border(1.5.dp, RatingTagLime, RoundedCornerShape(12.dp))
                        ) {
                            Text(
                                text = tag,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }

            rating.comment?.takeIf { it.isNotBlank() }?.let { c ->
                Text(
                    text = c,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 6,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
