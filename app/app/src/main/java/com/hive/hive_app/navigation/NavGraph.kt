package com.hive.hive_app.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.hilt.navigation.compose.hiltViewModel
import com.hive.hive_app.data.api.UnauthorizedHandler
import com.hive.hive_app.ui.auth.LoginScreen
import com.hive.hive_app.ui.auth.LoginViewModel
import com.hive.hive_app.ui.auth.RegisterScreen
import com.hive.hive_app.ui.auth.RegisterViewModel
import com.hive.hive_app.ui.main.MainViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    mainViewModel: MainViewModel,
    unauthorizedHandler: UnauthorizedHandler
) {
    val isLoggedIn by mainViewModel.isLoggedIn.collectAsState(initial = null)

    LaunchedEffect(unauthorizedHandler) {
        unauthorizedHandler.onUnauthorized = {
            mainViewModel.onSessionExpired()
        }
    }

    when (isLoggedIn) {
        null -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        false -> {
            NavHost(
                navController = navController,
                startDestination = "login",
                route = "auth"
            ) {
                composable("login") {
                    val loginViewModel: LoginViewModel = hiltViewModel()
                    LoginScreen(
                        viewModel = loginViewModel,
                        onLoginSuccess = mainViewModel::onLoginSuccess,
                        onNavigateToRegister = { navController.navigate("register") }
                    )
                }
                composable("register") {
                    val registerViewModel: RegisterViewModel = hiltViewModel()
                    RegisterScreen(
                        viewModel = registerViewModel,
                        onRegisterSuccess = mainViewModel::onLoginSuccess,
                        onNavigateToLogin = { navController.popBackStack() }
                    )
                }
            }
        }
        true -> {
            MainScaffold(onLogout = mainViewModel::logout)
        }
    }
}
