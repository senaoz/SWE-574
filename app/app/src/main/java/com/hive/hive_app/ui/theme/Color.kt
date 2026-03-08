package com.hive.hive_app.ui.theme

import androidx.compose.ui.graphics.Color

// —— Primary / brand (lime) ——
val Lime500 = Color(0xFF84CC16)       // Primary accent: #84cc16
val Lime600 = Color(0xFF65A30D)      // Primary pressed/darker
val Lime50 = Color(0xFFF7FEE7)       // Primary container (very light lime)
val OnLime = Color(0xFF1A1D0F)       // On primary (dark, readable)

// —— Surfaces and neutrals (light theme only) ——
val BackgroundLight = Color(0xFFFAFAF9)   // Page background
val SurfaceLight = Color(0xFFFFFFFF)      // Cards/panels
val SurfaceVariantLight = Color(0xFFF5F5F4) // Secondary panels
val OutlineLight = Color(0xFFE7E5E4)       // Borders
val OutlineVariantLight = Color(0xFFD6D3D1)

val OnBackgroundLight = Color(0xFF1C1917)   // High-contrast text (near black)
val OnSurfaceLight = Color(0xFF1C1917)
val OnSurfaceVariantLight = Color(0xFF57534E) // Muted / secondary text (gray-11 style)
val OnSurfaceVariantMuted = Color(0xFF78716C)  // Footer / muted (one step down)

// —— Semantic (soft, no hard colors) ——
val SemanticOffer = Color(0xFFB39DDB)      // Purple soft (badge)
val SemanticNeed = Color(0xFF90CAF9)      // Blue soft (badge)
val SemanticCategory = Color(0xFFFFE082)   // Yellow soft (badge)
val SemanticTag = Color(0xFF81C784)        // Green soft (tags)
val SemanticActive = Color(0xFF81C784)     // Green soft (active / success / live)
val SemanticInProgress = Color(0xFF90CAF9) // Blue soft
val SemanticCompleted = Color(0xFF9E9E9E)  // Gray
val SemanticPending = Color(0xFF9E9E9E)   // Gray
val SemanticCancelled = Color(0xFFE57373) // Red soft
val SemanticExpired = Color(0xFFFFB74D)    // Orange soft
val SemanticError = Color(0xFFE57373)     // Error / cancel (soft red)
val SemanticErrorContainer = Color(0xFFFFEBEE) // Error surface
val OnSemanticError = Color(0xFF5D4037)

// Legacy names for any XML or compatibility (optional)
val Black = Color(0xFF000000)
val White = Color(0xFFFFFFFF)
