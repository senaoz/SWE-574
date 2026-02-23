package com.hive.hive_app.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.hive.hive_app.ui.main.ActiveItemsScreen
import com.hive.hive_app.ui.main.DiscoverScreen
import com.hive.hive_app.ui.main.ForumScreen
import com.hive.hive_app.ui.main.ProfileScreen

@Composable
fun MainScaffold(
    onLogout: () -> Unit
) {
    var currentDestination by rememberSaveable { mutableStateOf(MainDestinations.DISCOVER) }

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            MainDestinations.entries.forEach { dest ->
                item(
                    icon = {
                        Icon(
                            dest.icon,
                            contentDescription = dest.label
                        )
                    },
                    label = { Text(dest.label) },
                    selected = dest == currentDestination,
                    onClick = { currentDestination = dest }
                )
            }
        }
    ) {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
            when (currentDestination) {
                MainDestinations.DISCOVER -> DiscoverScreen(Modifier.padding(innerPadding))
                MainDestinations.ACTIVE -> ActiveItemsScreen(Modifier.padding(innerPadding))
                MainDestinations.FORUM -> ForumScreen(Modifier.padding(innerPadding))
                MainDestinations.PROFILE -> ProfileScreen(onLogout = onLogout, modifier = Modifier.padding(innerPadding))
            }
        }
    }
}
