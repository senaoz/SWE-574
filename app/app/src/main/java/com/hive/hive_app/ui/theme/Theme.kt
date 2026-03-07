package com.hive.hive_app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape

// Single theme only: light, lime primary, soft semantics. No light/dark toggle.

private val HiveLightColorScheme = lightColorScheme(
    primary = Lime500,
    onPrimary = OnLime,
    primaryContainer = Lime50,
    onPrimaryContainer = OnBackgroundLight,
    secondary = OnSurfaceVariantLight,
    onSecondary = SurfaceLight,
    secondaryContainer = SurfaceVariantLight,
    onSecondaryContainer = OnSurfaceLight,
    tertiary = SemanticNeed,
    onTertiary = OnLime,
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    outline = OutlineLight,
    outlineVariant = OutlineVariantLight,
    error = SemanticError,
    onError = OnSemanticError,
    errorContainer = SemanticErrorContainer,
    onErrorContainer = OnSurfaceLight,
)

// Pill-style (full radius) for buttons and inputs; cards/dialogs use rounded corners
private val HiveShapes = Shapes(
    extraSmall = RoundedCornerShape(percent = 50),
    small = RoundedCornerShape(percent = 50),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

/** Semantic colors for badges, status, and types (Offer, Need, Category, etc.). */
data class HiveSemanticColors(
    val offer: Color,
    val need: Color,
    val category: Color,
    val tag: Color,
    val active: Color,
    val inProgress: Color,
    val completed: Color,
    val pending: Color,
    val cancelled: Color,
    val expired: Color,
    val muted: Color,
)

val LocalHiveSemanticColors = staticCompositionLocalOf {
    HiveSemanticColors(
        offer = SemanticOffer,
        need = SemanticNeed,
        category = SemanticCategory,
        tag = SemanticTag,
        active = SemanticActive,
        inProgress = SemanticInProgress,
        completed = SemanticCompleted,
        pending = SemanticPending,
        cancelled = SemanticCancelled,
        expired = SemanticExpired,
        muted = OnSurfaceVariantMuted,
    )
}

@Composable
fun HiveappTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = HiveLightColorScheme,
        typography = Typography,
        shapes = HiveShapes,
        content = {
            androidx.compose.runtime.CompositionLocalProvider(
                LocalHiveSemanticColors provides HiveSemanticColors(
                    offer = SemanticOffer,
                    need = SemanticNeed,
                    category = SemanticCategory,
                    tag = SemanticTag,
                    active = SemanticActive,
                    inProgress = SemanticInProgress,
                    completed = SemanticCompleted,
                    pending = SemanticPending,
                    cancelled = SemanticCancelled,
                    expired = SemanticExpired,
                    muted = OnSurfaceVariantMuted,
                )
            ) {
                content()
            }
        }
    )
}

/** Convenience access to Hive semantic colors. */
object HiveTheme {
    val semanticColors: HiveSemanticColors
        @Composable
        get() = LocalHiveSemanticColors.current
}
