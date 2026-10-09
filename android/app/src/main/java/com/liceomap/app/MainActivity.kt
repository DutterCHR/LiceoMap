package com.liceomap.app

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                AppNavigation()
            }
        }
    }
}

@Composable
fun AppNavigation() {
    var isLogged by remember { mutableStateOf(false) }
    var userCourse by remember { mutableStateOf("") }

    if (!isLogged) {
        LoginScreen(onLoginSuccess = { curso ->
            userCourse = curso
            isLogged = true
        })
    } else {
        MainScreen(curso = userCourse)
    }
}

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var rut by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current
    val azulLiceo = Color(0xFF0A2540)

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .shadow(elevation = 8.dp, shape = RoundedCornerShape(20.dp)),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "LiceoMap",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = azulLiceo
                )
                Text(
                    text = "Inicia sesión para continuar",
                    fontSize = 14.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(bottom = 24.dp)
                )

                OutlinedTextField(
                    value = rut,
                    onValueChange = { rut = it },
                    label = { Text("RUT (ej: 12345678-9)") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        if (rut.isBlank() || password.isBlank()) {
                            Toast.makeText(context, "Ingresa RUT y Contraseña", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "Sesión iniciada con éxito", Toast.LENGTH_SHORT).show()
                            onLoginSuccess("3° Medio A")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = azulLiceo),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    Text("Ingresar", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(curso: String) {
    var selectedItem by remember { mutableIntStateOf(0) }
    val azulLiceo = Color(0xFF0A2540)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("LiceoMap - $curso", color = Color.White, fontSize = 18.sp) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = azulLiceo)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.LocationOn, contentDescription = "Mapa") },
                    label = { Text("Mapa") },
                    selected = selectedItem == 0,
                    onClick = { selectedItem = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Horarios") },
                    label = { Text("Horarios") },
                    selected = selectedItem == 1,
                    onClick = { selectedItem = 1 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Notifications, contentDescription = "Anuncios") },
                    label = { Text("Anuncios") },
                    selected = selectedItem == 2,
                    onClick = { selectedItem = 2 }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            when (selectedItem) {
                0 -> MapSection()
                1 -> ScheduleSection(curso)
                2 -> AnnouncementsSection()
            }
        }
    }
}

// --- PLANO INTERACTIVO NATIVO DEL LICEO (SOPORTA ZOOM Y DESPLAZAMIENTO) ---

@Composable
fun MapSection() {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF0F4F8))
            .clipToBounds()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(0.8f, 3f)
                    offset += pan
                }
            }
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offset.x,
                    translationY = offset.y
                )
        ) {
            val canvasWidth = size.width
            val canvasHeight = size.height

            // Patio Principal
            drawRect(
                color = Color(0xFFE2E8F0),
                topLeft = Offset(canvasWidth * 0.15f, canvasHeight * 0.2f),
                size = Size(canvasWidth * 0.7f, canvasHeight * 0.55f)
            )

            // Pabellón A (Salas)
            drawRect(
                color = Color(0xFF0A2540),
                topLeft = Offset(canvasWidth * 0.15f, canvasHeight * 0.15f),
                size = Size(canvasWidth * 0.7f, canvasHeight * 0.08f)
            )

            // Pabellón B (Laboratorios)
            drawRect(
                color = Color(0xFF1E3A8A),
                topLeft = Offset(canvasWidth * 0.15f, canvasHeight * 0.75f),
                size = Size(canvasWidth * 0.7f, canvasHeight * 0.08f)
            )

            // Gimnasio
            drawRect(
                color = Color(0xFF059669),
                topLeft = Offset(canvasWidth * 0.70f, canvasHeight * 0.30f),
                size = Size(canvasWidth * 0.15f, canvasHeight * 0.35f)
            )

            // Marcador Tu Ubicación (Tu Sala)
            drawCircle(
                color = Color(0xFFDC2626),
                radius = 18f,
                center = Offset(canvasWidth * 0.35f, canvasHeight * 0.19f)
            )
        }

        // Overlay con controles e instrucciones
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
                .background(Color.White.copy(alpha = 0.9f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Text("📍 Tu Sala: 3° Medio A (Pabellón A)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text("Pellizca para zoom o arrastra para mover", fontSize = 12.sp, color = Color.Gray)
        }
    }
}

@Composable
fun ScheduleSection(curso: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("📅 Horario de Clases", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Mostrando información para: $curso", color = Color.Gray)
    }
}

@Composable
fun AnnouncementsSection() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("🔔 Avisos y Notificaciones", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Comunicados oficiales del Liceo en tiempo real.", color = Color.Gray)
    }
}