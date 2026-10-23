package com.liceomap.app.ui.components
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
@Composable
fun SchoolCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier.fillMaxWidth().animateContentSize(), shape = MaterialTheme.shapes.medium) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
    }
}
@Composable
fun DemoNotice() {
    Text("Demostración · Datos ficticios", style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant)
}
@Composable
fun StatusCard(title: String, message: String, loading: Boolean = false, onRetry: (() -> Unit)? = null) {
    SchoolCard {
        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(message, style = MaterialTheme.typography.bodyMedium)
        if (onRetry != null) OutlinedButton(onClick = onRetry) { Text("Reintentar") }
    }
}
