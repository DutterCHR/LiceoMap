package com.liceomap.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    course: String,
    destination: AppDestination,
    onDestinationSelected: (AppDestination) -> Unit,
    content: @Composable () -> Unit,
) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("LiceoMap", style = MaterialTheme.typography.titleLarge) }) },
        bottomBar = {
            NavigationBar {
                listOf(
                    Triple(AppDestination.HOME, "Inicio", Icons.Default.Home),
                    Triple(AppDestination.MAP, "Mapa", Icons.Default.LocationOn),
                    Triple(AppDestination.ANNOUNCEMENTS, "Anuncios", Icons.Default.Notifications),
                    Triple(AppDestination.PROFILE, "Perfil", Icons.Default.Person),
                ).forEach { (target, label, icon) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = null) },
                        label = { Text(label) },
                        selected = destination == target || (target == AppDestination.HOME && destination == AppDestination.SCHEDULE),
                        onClick = { onDestinationSelected(target) },
                    )
                }
            }
        }
    ) { padding -> Box(Modifier.padding(padding).fillMaxSize()) { content() } }
}
