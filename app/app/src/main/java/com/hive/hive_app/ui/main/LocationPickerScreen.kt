package com.hive.hive_app.ui.main

import android.content.Context
import android.location.Geocoder
import android.view.View
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import java.io.IOException
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapListener
import org.osmdroid.events.ScrollEvent
import org.osmdroid.events.ZoomEvent
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView

fun reverseGeocodeAddress(context: Context, latitude: Double, longitude: Double): String? {
    return try {
        val geocoder = Geocoder(context, Locale.getDefault())
        val results = geocoder.getFromLocation(latitude, longitude, 1)
        val addr = results?.firstOrNull() ?: return null
        val line = addr.getAddressLine(0)
        line?.takeIf { it.isNotBlank() }
    } catch (_: IOException) {
        null
    } catch (_: Exception) {
        null
    }
}

/**
 * Short label for profiles: city and district only (no street-level address).
 */
fun reverseGeocodeCityDistrict(context: Context, latitude: Double, longitude: Double): String? {
    return try {
        val geocoder = Geocoder(context, Locale.getDefault())
        @Suppress("DEPRECATION")
        val list = geocoder.getFromLocation(latitude, longitude, 1)
        list?.firstOrNull()?.let { addr ->
            val city = addr.locality
                ?: addr.subLocality
                ?: addr.adminArea
                ?: ""
            val district = addr.subAdminArea?.takeIf { it != city }
                ?: addr.subLocality?.takeIf { it != city }
                ?: ""
            when {
                city.isNotEmpty() && district.isNotEmpty() -> "$city, $district"
                city.isNotEmpty() -> city
                district.isNotEmpty() -> district
                else -> null
            }
        }
    } catch (_: IOException) {
        null
    } catch (_: Exception) {
        null
    }
}

@Composable
fun LocationPickerScreen(
    initialLat: Double,
    initialLon: Double,
    canUseMyLocation: Boolean,
    myLat: Double?,
    myLon: Double?,
    onRequestLocationPermission: () -> Unit,
    onBack: () -> Unit,
    onSelected: (lat: Double, lon: Double, address: String?) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var mapRef by remember { mutableStateOf<MapView?>(null) }
    var didInitialCenter by remember { mutableStateOf(false) }
    var centerText by remember { mutableStateOf("") }
    var resolveJob by remember { mutableStateOf<Job?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .navigationBarsPadding()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding(),
            color = MaterialTheme.colorScheme.background,
            tonalElevation = 2.dp,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(
                    text = "Select location",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                OutlinedButton(
                    onClick = {
                        if (!canUseMyLocation) {
                            onRequestLocationPermission()
                            return@OutlinedButton
                        }
                        val map = mapRef ?: return@OutlinedButton
                        map.controller.setCenter(GeoPoint(myLat ?: initialLat, myLon ?: initialLon))
                        map.controller.setZoom(16.0)
                    },
                    enabled = true
                ) {
                    Text("My location")
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            AndroidView(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                factory = { ctx ->
                    Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
                    MapView(ctx).apply {
                        setTileSource(
                            XYTileSource(
                                "Carto Voyager",
                                0,
                                18,
                                256,
                                ".png",
                                arrayOf("https://a.basemaps.cartocdn.com/rastertiles/voyager/"),
                                "© CARTO"
                            )
                        )
                        setMultiTouchControls(true)
                        controller.setZoom(15.0)
                        setLayerType(View.LAYER_TYPE_SOFTWARE, null)
                    }.also { map ->
                        mapRef = map
                    }
                },
                update = { map ->
                    mapRef = map
                    if (!didInitialCenter) {
                        map.controller.setCenter(GeoPoint(initialLat, initialLon))
                        didInitialCenter = true
                    }
                }
            )

            Icon(
                imageVector = Icons.Filled.LocationOn,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(34.dp)
            )
        }

        OutlinedTextField(
            value = centerText,
            onValueChange = {},
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            enabled = false,
            readOnly = true,
            singleLine = false,
            maxLines = 2,
            label = { Text("Selected location") },
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                disabledContainerColor = Color.White,
                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                disabledBorderColor = MaterialTheme.colorScheme.outline,
                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
        )

        DisposableEffect(mapRef) {
            val map = mapRef
            if (map == null) return@DisposableEffect onDispose { }
            fun updateCenter() {
                val c = map.mapCenter as? GeoPoint ?: return
                centerText = "Resolving address…"
                resolveJob?.cancel()
                resolveJob = scope.launch {
                    delay(350)
                    val resolved = withContext(Dispatchers.IO) {
                        reverseGeocodeAddress(context, c.latitude, c.longitude)
                    }
                    centerText = resolved ?: "Address unavailable"
                }
            }
            updateCenter()
            val listener = object : MapListener {
                override fun onScroll(event: ScrollEvent?): Boolean {
                    updateCenter()
                    return false
                }

                override fun onZoom(event: ZoomEvent?): Boolean {
                    updateCenter()
                    return false
                }
            }
            map.addMapListener(listener)
            onDispose {
                map.removeMapListener(listener)
                resolveJob?.cancel()
            }
        }

        Button(
            onClick = {
                val map = mapRef ?: return@Button
                val center = map.mapCenter as? GeoPoint ?: return@Button
                val lat = center.latitude
                val lon = center.longitude
                scope.launch {
                    val resolved = withContext(Dispatchers.IO) {
                        reverseGeocodeAddress(context, lat, lon)
                    }
                    onSelected(lat, lon, resolved)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text("Use this location")
        }
    }
}
