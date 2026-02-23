package com.hive.hive_app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.UnauthorizedHandler
import com.hive.hive_app.navigation.AppNavGraph
import com.hive.hive_app.ui.main.MainViewModel
import com.hive.hive_app.ui.theme.HiveappTheme
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
                HiveappApp(unauthorizedHandler = unauthorizedHandler)
            }
        }
    }
}

@Composable
fun HiveappApp(
    unauthorizedHandler: UnauthorizedHandler
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    AppNavGraph(
        mainViewModel = mainViewModel,
        unauthorizedHandler = unauthorizedHandler
    )
}
