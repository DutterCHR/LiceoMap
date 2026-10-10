package com.liceomap.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    destination: AppDestination,
    isDetail: Boolean,
    canGoBack: Boolean,
    onBack: () -> Unit,
    onDestinationSelected: (AppDestination) -> Unit,
    content: @Composable () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isDetail) "Anuncio" else when (destination) {
                    AppDestination.HOME -> "LiceoMap"
                    AppDestination.SCHEDULE -> "Horarios"
                    AppDestination.MAP -> "Mapa"
                    AppDestination.ANNOUNCEMENTS -> "Anuncios"
                    AppDestination.PROFILE -> "Perfil"
                }, style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    if (canGoBack) IconButton(onClick = onBack, modifier = Modifier.testTag("navigate-back")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                },
            )
        },
        bottomBar = {
            NavigationBar {
                listOf(
                    Triple(AppDestination.HOME, "Inicio", Icons.Default.Home),
                    Triple(AppDestination.MAP, "Mapa", Icons.Default.LocationOn),
                    Triple(AppDestination.ANNOUNCEMENTS, "Anuncios", Icons.Default.Notifications),
                    Triple(AppDestination.PROFILE, "Perfil", Icons.Default.Person),
                ).forEach { (target, label, icon) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = null) }, label = { Text(label) },
                        selected = destination == target || (target == AppDestination.HOME && destination == AppDestination.SCHEDULE),
                        onClick = { onDestinationSelected(target) }, modifier = Modifier.testTag("nav-${target.name}"),
                    )
                }
            }
        }
    ) { padding -> Box(Modifier.padding(padding).fillMaxSize()) { content() } }
}
