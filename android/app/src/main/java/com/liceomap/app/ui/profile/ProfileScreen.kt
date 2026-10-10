package com.liceomap.app.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.liceomap.app.model.DemoSession
import com.liceomap.app.ui.components.*
import com.liceomap.app.ui.theme.ThemeMode

@Composable
fun ProfileScreen(session: DemoSession, mode: ThemeMode, version: String, onThemeChanged: (ThemeMode) -> Unit, onLogout: () -> Unit) {
    var confirmLogout by rememberSaveable { mutableStateOf(false) }
    LazyColumn(modifier = Modifier.testTag("profile-list"), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Text("Tu espacio", style = MaterialTheme.typography.headlineLarge) }
        item {
            SchoolCard {
                Text(session.studentName ?: "Estudiante de demostración", style = MaterialTheme.typography.titleLarge)
                Text(session.course)
                DemoNotice()
                Text("Esta sesión es local y no acredita una identidad del colegio.")
            }
        }
        item {
            SchoolCard {
                Text("A tu manera", style = MaterialTheme.typography.titleLarge)
                Text("Apariencia")
                ThemeMode.entries.forEach { theme ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        RadioButton(selected = mode == theme, onClick = { onThemeChanged(theme) },
                            modifier = Modifier.testTag("theme-${theme.name}"))
                        TextButton(onClick = { onThemeChanged(theme) }) { Text(theme.label) }
                    }
                }
            }
        }
        item { Text("LiceoMap · Versión $version", style = MaterialTheme.typography.bodyMedium) }
        item {
            OutlinedButton(onClick = { confirmLogout = true }, modifier = Modifier.fillMaxWidth().testTag("logout")) {
                Text("Cerrar sesión")
            }
        }
    }
    if (confirmLogout) AlertDialog(
        onDismissRequest = { confirmLogout = false },
        title = { Text("¿Cerrar la sesión de demostración?") },
        text = { Text("Podrás volver a explorar la aplicación desde el inicio.") },
        confirmButton = { TextButton(onClick = { confirmLogout = false; onLogout() },
            modifier = Modifier.testTag("confirm-logout")) { Text("Cerrar sesión") } },
        dismissButton = { TextButton(onClick = { confirmLogout = false }) { Text("Cancelar") } },
    )
}
