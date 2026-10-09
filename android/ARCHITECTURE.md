# LiceoMap v0.2 — M01

El módulo conserva Kotlin, Jetpack Compose y Material 3. `MainActivity` solo
crea la composición y mantiene el `MaterialTheme` que utilizaba el prototipo.

## Estructura

Dentro de `app/src/main/java/com/liceomap/app/`:

```text
MainActivity.kt
model/
  Authentication.kt
  DemoSession.kt
  SchoolContent.kt
data/
  demo/
    DemoData.kt
    DemoEntry.kt
  repository/
    AuthenticationRepository.kt
    MapRepository.kt
    ScheduleRepository.kt
    AnnouncementsRepository.kt
ui/
  navigation/
    AppNavigation.kt
    MainScreen.kt
    AppDestination.kt
    AppUiState.kt
    AppViewModel.kt
  login/LoginScreen.kt
  map/
    MapScreen.kt
    MapViewport.kt
  schedule/ScheduleScreen.kt
  announcements/AnnouncementsScreen.kt
  theme/               Recursos de tema existentes, conservados.
```

`AppNavigation` observa `AppViewModel.uiState` mediante
`collectAsStateWithLifecycle`. Las pantallas reciben valores y callbacks. El
ViewModel valida el ingreso demo y conserva la sesión local y la pestaña activa.
Las tres pestañas tienen destinos tipados; la navegación y su comportamiento al
presionar Atrás permanecen centralizados, sin agregar una biblioteca de navegación.

Horarios y anuncios siguen siendo las vistas informativas del prototipo: aún no
hay contenido que cargar ni lógica que justifique ViewModels adicionales.

## Estado

- El ViewModel sobrevive a la recreación de la actividad. `SavedStateHandle`
  permite restaurar RUT, curso de demostración y pestaña tras la muerte del proceso
  cuando Android conserva el estado de la tarea.
- La contraseña solo vive en memoria: sobrevive a los cambios de configuración,
  se borra después del ingreso y no se escribe en el estado guardado. Después de
  la muerte del proceso debe escribirse de nuevo si el usuario seguía en login.
- El mapa utiliza `rememberSaveable` con un `Saver` para escala y coordenadas.
  `SaveableStateHolder` conserva esos valores al cambiar de pestaña, incluso si
  la actividad se recrea mientras otra pestaña está visible.
- No hay persistencia de sesión permanente ni credenciales, tokens o backend.

Esta separación sigue la documentación oficial de
[estado guardado en ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate)
y [estado guardado en Compose](https://developer.android.com/develop/ui/compose/state-saving).

## Demostración y futuras integraciones

`DemoEntry` acepta cualquier RUT y contraseña que no estén en blanco, igual que
el prototipo. Devuelve exclusivamente `DemoSession`; nunca una identidad
autenticada. El subtítulo del formulario y el mensaje de ingreso indican que es
una demostración, manteniendo el diseño, dimensiones, estilos y controles.

`DemoData` contiene el curso y la geometría normalizada del Canvas original. Se
conservan los cuatro sectores, marcador, colores y límites de zoom (0.8 a 3).
El recurso `assets/mapa.html` permanece intacto.

Los contratos de `data/repository/` no tienen implementaciones:

- `AuthenticationRepository.authenticate`: resultado autenticado o rechazado,
  separado del acceso demo. Una integración real deberá tratar también errores
  de comunicación y sustituir explícitamente el flujo demo.
- `MapRepository.loadMap`: referencia a un recurso SVG, sin renderer definitivo.
- `ScheduleRepository.loadSchedule`: horario del curso solicitado.
- `AnnouncementsRepository.loadAnnouncements`: lista de comunicados.

Las operaciones son suspendidas para permitir futuras fuentes locales o remotas.
Los fallos de carga/comunicación se comunicarán mediante excepciones y deberán
traducirse a estados de carga/error en los ViewModels que incorporen esas fuentes.
No se agregan clientes HTTP, inyección de dependencias ni repositorios ficticios.

## Verificación

Desde `android/`, con JDK 25 y el SDK configurado para el proyecto:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug
```

Las pruebas unitarias cubren campos en blanco, acceso exclusivamente demo,
transiciones de sesión y navegación, restauración del estado, ausencia de
contraseña en el estado guardado y límites/acumulación de los gestos del mapa.

Pruebas agregadas en `app/src/test/java/com/liceomap/app/`:

- `data/demo/DemoEntryTest.kt`: 4 pruebas.
- `ui/navigation/AppViewModelTest.kt`: 8 pruebas.
- `ui/map/MapViewportTest.kt`: 4 pruebas.

La prueba de ejemplo existente permanece: total de 17 pruebas unitarias.

## Informe del checkpoint

Estado inicial verificado: Git limpio, rama `feature/integrar-android-kotlin`,
commit `34f54f23afad57032c51242c8271807b44fce438`. Rama de trabajo creada:
`feature/android-v0.2-base`.

Archivos existentes modificados: `MainActivity.kt`, `app/build.gradle.kts` y
`gradle/libs.versions.toml`. Se agregan este documento, los archivos de modelos,
datos y pantallas enumerados arriba, y las tres clases de pruebas. Las nuevas
dependencias son las integraciones de Lifecycle con Compose/ViewModel/estado
guardado y `core-testing` exclusivamente para pruebas.

Verificaciones ejecutadas con el JDK 25 de Android Studio y el SDK local:

- `assembleDebug`: correcto.
- `testDebugUnitTest`: 17 pruebas, sin fallos, errores ni pruebas omitidas.
- `lintDebug`: correcto, 0 errores y 20 advertencias. Las advertencias corresponden
  a versiones de dependencias, una etiqueta redundante en el manifiesto,
  recursos existentes sin uso y la declaración existente de iconos fuera del
  catálogo. No se actualizan dependencias ajenas a la migración ni se eliminan
  recursos existentes. Gradle también avisa de la opción experimental existente
  `android.overridePathCheck`.
- Alcance: únicamente archivos dentro de `android/`; recursos, assets, tema y
  manifiesto conservados.
- `git diff --check`: sin problemas.

No quedan errores de compilación, pruebas o lint. No había dispositivo ni
emulador conectado: no se ejecutaron pruebas instrumentadas ni una comparación
visual en dispositivo. La restauración se cubre mediante pruebas unitarias del
ViewModel; la integración real con el ciclo de vida y la restauración del Canvas
quedan pendientes de esa comprobación en dispositivo.
