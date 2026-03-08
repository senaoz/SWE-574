package com.hive.hive_app.ui.main

import android.content.Context
import coil.decode.SvgDecoder
import coil.request.ImageRequest

/**
 * Ensure backend-relative paths (e.g. `/uploads/...`) become absolute URLs.
 */
fun toAbsoluteUrl(pathOrUrl: String?): String? {
    if (pathOrUrl.isNullOrBlank()) return null
    return if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        pathOrUrl
    } else {
        // Backend base URL from openapi.md
        "https://backend-swe.gnahh5.easypanel.host$pathOrUrl"
    }
}

/**
 * Build an ImageRequest that can handle both SVG (DiceBear) and raster images.
 */
fun buildImageRequest(context: Context, pathOrUrl: String?): ImageRequest? {
    val url = toAbsoluteUrl(pathOrUrl) ?: return null
    val builder = ImageRequest.Builder(context)
        .data(url)
        .crossfade(true)
    if (url.contains(".svg") || url.contains("dicebear.com")) {
        builder.decoderFactory(SvgDecoder.Factory())
    }
    return builder.build()
}

