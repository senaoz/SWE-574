package com.hive.hive_app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.UnauthorizedHandler
import com.hive.hive_app.navigation.AppNavGraph
import com.hive.hive_app.ui.main.MainViewModel
import com.hive.hive_app.ui.theme.HiveappTheme
import com.hive.hive_app.work.NotificationPollingWorker
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var unauthorizedHandler: UnauthorizedHandler

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HiveappTheme {
                HiveappApp(
                    unauthorizedHandler = unauthorizedHandler,
                    pendingDestination = intent.getStringExtra(NotificationPollingWorker.EXTRA_DESTINATION)
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}

@Composable
fun HiveappApp(
    unauthorizedHandler: UnauthorizedHandler,
    pendingDestination: String? = null
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    LaunchedEffect(pendingDestination) {
        if (pendingDestination != null) mainViewModel.setPendingDestination(pendingDestination)
    }
    AppNavGraph(
        mainViewModel = mainViewModel,
        unauthorizedHandler = unauthorizedHandler
    )
}
