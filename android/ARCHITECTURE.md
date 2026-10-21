# LiceoMap v0.2 — M01 a M06

Proyecto Android en Kotlin, Jetpack Compose, Material 3 y MVVM; minSdk 24.
Versión 0.2.0. Sin nuevas dependencias en M02–M06. Se actualizan únicamente
Espresso a 3.7.0 y la extensión JUnit Android a 1.3.0 para ejecutar las pruebas
en Android 17; Espresso 3.5.1 usaba un método de InputManager eliminado.
La corrección está documentada en las
[notas oficiales de AndroidX Test](https://developer.android.com/jetpack/androidx/releases/test#espresso-3.7.0).

## Responsabilidades

- `MainActivity`: crea la composición.
- `AppNavigation`: observa los ViewModels con `collectAsStateWithLifecycle`,
  aplica la apariencia y presenta login o el contenido de la sesión.
- `AppViewModel`: sesión demo, rutas tipadas, historial, día, sala, filtros de
  anuncios y apariencia. `SavedStateHandle` restaura el estado de la tarea.
- `SchoolContentViewModel`: una carga compartida para Home, Horarios y Anuncios.
  Los dos repositorios son inyectables y sus errores independientes.
  `LoadState` representa carga, contenido y error; listas vacías son contenido
  válido. Reintentar cancela la carga anterior; logout cancela y limpia los datos.
- `ScheduleRepository` y `AnnouncementsRepository`: contratos suspendidos de M01,
  implementados por fuentes locales de demostración.
- `AuthenticationRepository` y `MapRepository`: fronteras para integraciones futuras.
- Pantallas: reciben estado y callbacks, sin cargar datos por su cuenta.
- `SchoolCard`, `DemoNotice`, `StatusCard`, `AnnouncementCard`: componentes compartidos.

## Datos y tiempo

Los horarios, salas, curso y anuncios locales son ficticios y se identifican en
las pantallas. El estudiante demo no tiene nombre: Home usa un saludo genérico.
Si `DemoSession.studentName` está disponible, Home y Perfil lo muestran.

`Lesson.dayOfWeek` usa ISO: lunes=1 a domingo=7. Las horas deben ser HH:mm;
inicio anterior al término; un horario no permite clases superpuestas.
El repositorio debe entregar el curso solicitado. Los anuncios requieren
identificadores únicos, título y cuerpo no vacíos y una fecha válida.

`ScheduleClock.summary(schedule, nowMillis)` es lógica pura con un instante
inyectable y `America/Santiago` explícita. Usa Calendar para funcionar desde API
24 sin agregar desugaring ni dependencias. Inicio inclusivo, término exclusivo;
busca la próxima ocurrencia durante los siete días siguientes, incluso fines
de semana. Calendar conserva la hora local al cruzar cambios de horario de verano.
Home y Horarios reciben el mismo instante y horario.

`rememberSchoolTime` actualiza el instante al volver a primer plano y cada 30 s
mientras la actividad está STARTED. La indicación de clase actual puede cambiar
hasta 30 s después de un límite horario.

Los anuncios se ordenan inicialmente por fecha descendente e ID como desempate.
La lista permite filtrar categoría y cambiar el orden; Home presenta los dos
más recientes del mismo estado, independientemente del filtro de la lista.
Las fechas se muestran en español con la zona de Santiago.

## Navegación y restauración

Cuatro destinos principales: Inicio, Mapa, Anuncios, Perfil.
Horarios es un hijo de Inicio. El detalle es una ruta de Anuncios por ID.

- Login → Inicio: acceso demo sin credenciales.
- Inicio → Horarios → Mapa(sala): Volver recorre Mapa → Horarios → Inicio.
- Inicio → Anuncios → Detalle: Volver recorre Detalle → Anuncios → Inicio.
- Un anuncio reciente de Home abre Detalle con la lista como ruta anterior.
- Seleccionar una pestaña principal reemplaza el historial anterior; Atrás
  vuelve a Inicio. Desde Inicio o Login se deja Atrás al sistema.
- Botón Volver y BackHandler usan la misma transición del ViewModel.
- Rutas e historial se guardan como strings y ArrayList de strings compatibles
  con Bundle; no se guardan modelos ni clases Compose.
- `SaveableStateHolder` conserva scroll por pantalla, separando lista y cada
  detalle. El viewport conserva escala y posición con el Saver de M01.
- El estado de pantallas se dispone al cerrar sesión; se cancelan las cargas.
  El siguiente ingreso empieza en Home sin filtros ni selección de sala.
- La restauración mediante SavedStateHandle depende de que Android conserve
  el estado de la tarea; no es una sesión persistente entre cierres definitivos.

## Apariencia y sesión

`LiceoMapTheme` ofrece modo automático, claro y oscuro. Todos los niveles de
superficie Material 3 usan la paleta verde. Se comprueba contraste AA de los
pares principales de texto. Las tarjetas animan discretamente cambios de tamaño.
La actividad usa edge-to-edge y ajusta los iconos de las barras del sistema al
tema elegido; Scaffold y el formulario respetan los insets y el teclado.

Solo la preferencia de tema se almacena en SharedPreferences. Las credenciales
no se solicitan ni se almacenan. El RUT opcional del formulario institucional se
valida localmente con módulo 11 y se borra al entrar en demo o cerrar sesión;
la validación no acredita identidad. No existe backend, autenticación real
ni servicio remoto. `DemoEntry` devuelve únicamente `DemoSession`.

## Contrato del mapa SVG

Los recursos existentes, incluido `app/src/main/assets/mapa.html`, se conservan.
El Canvas de M01 continúa como esquema ficticio con zoom y desplazamiento.
La selección de una sala muestra su nombre o un aviso de ID desconocido;
el marcador del esquema no representa la ubicación de la sala seleccionada.
No se crea el mapa definitivo ni se inventan coordenadas.

- `RoomId.value`: ID estable compartido entre horario y mapa.
- `RoomReference`: ID y etiqueta legible.
- `DemoRooms`: catálogo exclusivamente demo; IDs `demo-a101`, `demo-a102`.
- `Lesson.roomId`: identidad enviada por la acción Ver sala en mapa.
- `MapScreen.selectedRoom`: destino que debe recibir el renderer futuro.
- `SvgMap.assetPath`: asset del SVG que entregue el equipo.
- `SvgRoomBinding(roomId, elementId)`: vínculo explícito con un elemento SVG.
- `SvgMap.elementFor`: resuelve un vínculo o devuelve null; no asigna ubicación
  por aproximación y rechaza IDs de sala duplicados.

El integrante del mapa debe proporcionar el SVG, catálogo oficial, vínculos
de IDs y renderer interactivo. Al integrarlo, conservar el tratamiento de sala
desconocida y estado de carga/error. `MapRepository` está preparado, pero el
Canvas demo aún no lo consume porque no hay un SVG oficial.

## Integraciones pendientes

Horario y anuncios oficiales mediante implementaciones de sus repositorios;
nombre y curso real del estudiante; autenticación institucional que use
`AuthenticationRepository`; mapa SVG y catálogo oficial de salas.
No se simulan estas integraciones ni se añaden servicios de pago.

## Verificación

Comandos desde `android/`:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug
.\gradlew.bat connectedDebugAndroidTest
```

En este PC se usa el JDK 25 incluido en Android Studio y SDK D:\JS.
La terminal del agente necesita JAVA_HOME y GRADLE_USER_HOME explícitos.
Los ejecutores Gradle fallaban al interpretar la ruta acentuada del usuario:
la opción temporal `-Dorg.gradle.jvmargs=-Xmx2048m -Dfile.encoding=COMPAT`
corrigió la ejecución. No se cambia la codificación UTF-8 del repositorio.
Se usó `--offline --max-workers=2` con las dependencias ya disponibles.
La primera ejecución instrumentada requirió descargar los componentes UTP de
AGP y las actualizaciones de AndroidX Test; las posteriores se ejecutan offline.
Se usa `--no-configuration-cache` para el comando instrumentado en este entorno.

Referencias para el entorno:
[configuración de Gradle](https://docs.gradle.org/current/userguide/build_environment.html)
y [archivos de argumentos de Java](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html).

Las pruebas cubren horarios y Santiago, validación de contenido, filtros y
orden de anuncios, errores/cancelación/reintento, navegación, historial,
sesión, restauración, RUT, contraste y viewport. Las pruebas Compose verifican
flujos completos, recreación de actividad y estados vacíos/carga/error.
El informe de resultados y cambios está en `MIGRATION_REPORT.md`.
