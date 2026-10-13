# LiceoMap v0.2 — Informe M02–M06

Fecha: 10 de octubre de 2026.
Rama: `feature/android-v0.2-home-casa`.
Base inspeccionada: `bf7113c`, árbol limpio, únicamente M01 disponible.
Alcance: archivos del proyecto dentro de `android/`. Sin push, merge ni PR.

## Migraciones completadas

| Fase | Resultado | Commit | Pruebas unitarias al verificar |
| --- | --- | --- | --- |
| M02 | Paleta Material 3, claro/oscuro/automático, tipografía, componentes y animación discreta | `e6f1e52` | 18 |
| M03 | Home posterior al login, clase actual/próxima, curso, accesos y fuentes compartidas | `1aaa4f1` | 21 |
| M04 | Semana, selector de día, horario/sala, clase actual y navegación de sala | `2172189` | 29 |
| M05 | Anuncios/detalle/filtros/orden, perfil/tema/logout, RUT local y contrato SVG | `e6c6aef` | 31 |
| M06 | Cuatro destinos principales, historial/Atrás, restauración, errores y pruebas completas | Commit local que contiene este informe; consultar `git log -1` | 39 |

Cada fase se compiló y sus pruebas pasaron antes de su commit.
La versión de la aplicación es 0.2.0, versionCode 2, minSdk 24.
Se conservaron Kotlin, Compose, Material 3 y MVVM. No se incorporaron nuevas
dependencias; se actualizaron dos dependencias de pruebas para Android 17.

## Pantallas funcionales

- Login: presentación moderna, exploración demo sin credenciales y validación
  opcional de RUT por formato/módulo 11; acceso institucional pendiente.
- Inicio: bienvenida personalizada si existe nombre, curso, clase actual/próxima,
  fecha/horas/sala, accesos, anuncios recientes y perfil.
- Horarios: siete días, asignaturas, inicio/término, sala, clase actual y acceso al mapa.
- Mapa: esquema existente de demostración con zoom/desplazamiento y sala seleccionada.
  Un ID desconocido se informa sin inventar coordenadas.
- Anuncios: tarjetas con categoría, fecha, resumen, filtros y orden.
- Detalle: cuerpo completo; estados de carga/error/anuncio retirado.
- Perfil: usuario demo, curso, tema persistente, versión y cierre de sesión.

Los horarios y anuncios usan repositorios compartidos con Home.
El reloj siempre calcula en America/Santiago; límites de término exclusivos y
próxima clase hasta la semana siguiente. Se actualiza al volver a primer plano
y cada 30 segundos. Los datos demo están identificados en las pantallas.
No se solicitan ni se almacenan contraseñas, tokens o credenciales.

## Verificación final

- `assembleDebug`: aprobado.
- `testDebugUnitTest`: 39 pruebas aprobadas; 0 fallos/errores/omitidas.
- `lintDebug`: aprobado; 0 errores, 18 advertencias.
- `connectedDebugAndroidTest`: 8 pruebas aprobadas; 0 fallos/errores/omitidas.
- Emulador: Pixel_10, Android 17/API 37, modo read-only; se conserva el AVD original.
- Flujos probados: Login → Home → Horarios → Mapa; Home → Anuncios → Detalle;
  retorno con Volver, recreación de actividad, día/filtros/sala restaurados,
  tema y logout. La apariencia de la barra de estado también se comprueba.
- El ajuste final del tono primario oscuro se verificó con el test de contraste,
  compilación, unitarias y lint después de la suite instrumentada.
- Estados UI probados: carga, horario/anuncios vacíos, anuncio inexistente y reintento.
- Unitarias adicionales: horario semanal/recreos/fines de semana/cambios de hora,
  contraste AA, datos malformados/superpuestos/duplicados, cancelación/limpieza,
  orden de anuncios, historial y sesión/restauración.
- Revisión visual en emulador de Login, Home y Perfil oscuro; capturas locales ignoradas por Git
  en `.gradle/screenshots/`.
- `git diff --check`: aprobado.
- El asset `app/src/main/assets/mapa.html` no se modificó.

Artefactos locales:
`app/build/outputs/apk/debug/app-debug.apk`,
`app/build/reports/tests/testDebugUnitTest/index.html`,
`app/build/reports/lint-results-debug.html`,
`app/build/reports/androidTests/connected/debug/index.html`.

## Errores resueltos y advertencias

La terminal no tenía JAVA_HOME; se utilizó el JDK 25 incluido en Android Studio.
Gradle necesitó su caché local y una opción temporal de codificación COMPAT
para las rutas acentuadas de Windows. La primera ejecución offline de UTP
requirió descargar sus componentes oficiales. Espresso 3.5.1 fallaba antes de
interactuar con la UI por un método eliminado en Android 17: se actualizó a
3.7.0 junto con JUnit Android 1.3.0 y se volvió a aprobar la suite completa.
[Corrección oficial de Espresso](https://developer.android.com/jetpack/androidx/releases/test#espresso-3.7.0).

No quedan errores de compilación, pruebas o lint.
Las 18 advertencias de lint corresponden a versiones disponibles (AGP, Kotlin
y dependencias), siete recursos existentes sin uso, etiqueta redundante del
manifiesto y declaración previa de iconos fuera del catálogo TOML.
Permanece el aviso experimental existente `android.overridePathCheck`.
No se eliminó material existente ni se actualizaron dependencias de producción.

Un reintento con AVD de 1 GB terminó antes de las pruebas porque Android cerró
el proceso de pruebas por falta de memoria (lowmemorykiller). Se volvió a usar
2 GB y se liberaron los procesos de compilación iniciados por esta tarea antes
de la comprobación final. El AVD se ejecutó sin ventana y sin guardar snapshots.
Esta comprobación no sustituye una prueba en dispositivo físico ni en API 24.

## Integraciones pendientes

- SVG definitivo y renderer interactivo del otro integrante.
- Catálogo de salas oficiales y vínculos RoomId → ID de elemento SVG.
- Horarios y anuncios oficiales mediante los repositorios existentes.
- Nombre/curso del estudiante real y autenticación institucional.
- Validación en dispositivo físico y dispositivos con API 24.

El mapa de demostración conserva la geometría original. Su marcador no representa
la ubicación exacta de la sala seleccionada. El contrato compartido y las
responsabilidades de integración se documentan en `ARCHITECTURE.md`.

## Estado de Git

Cinco commits locales por fase sobre `bf7113c`, en la rama solicitada.
El informe se incluye en el commit M06. Árbol de trabajo limpio después del commit;
sin archivos del proyecto modificados fuera de android/. No se hizo push, merge
ni Pull Request. Los APK, reports, capturas y cachés siguen ignorados.

## Archivos creados y modificados

Rutas relativas a android/, comparadas con bf7113c. A = creado; M = modificado.

| Estado | Archivo |
| --- | --- |
| M | `app/build.gradle.kts` |
| A | `app/src/androidTest/java/com/liceomap/app/AppFlowTest.kt` |
| A | `app/src/androidTest/java/com/liceomap/app/SchoolStatesTest.kt` |
| M | `app/src/main/java/com/liceomap/app/data/demo/DemoEntry.kt` |
| A | `app/src/main/java/com/liceomap/app/data/demo/DemoRepositories.kt` |
| A | `app/src/main/java/com/liceomap/app/data/repository/ThemePreferences.kt` |
| A | `app/src/main/java/com/liceomap/app/domain/AnnouncementQuery.kt` |
| A | `app/src/main/java/com/liceomap/app/domain/ChileanRut.kt` |
| A | `app/src/main/java/com/liceomap/app/domain/ScheduleClock.kt` |
| M | `app/src/main/java/com/liceomap/app/MainActivity.kt` |
| M | `app/src/main/java/com/liceomap/app/model/DemoSession.kt` |
| A | `app/src/main/java/com/liceomap/app/model/LoadState.kt` |
| A | `app/src/main/java/com/liceomap/app/model/RoomId.kt` |
| M | `app/src/main/java/com/liceomap/app/model/SchoolContent.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/announcements/AnnouncementsScreen.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/components/SchoolComponents.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/components/SchoolFormatting.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/content/SchoolClock.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/content/SchoolContentViewModel.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/home/HomeScreen.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/login/LoginScreen.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/map/MapScreen.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/navigation/AppDestination.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/navigation/AppNavigation.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/navigation/AppRoute.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/navigation/AppUiState.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/navigation/AppViewModel.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/navigation/MainScreen.kt` |
| A | `app/src/main/java/com/liceomap/app/ui/profile/ProfileScreen.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/schedule/ScheduleScreen.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/theme/Color.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/theme/Theme.kt` |
| M | `app/src/main/java/com/liceomap/app/ui/theme/Type.kt` |
| M | `app/src/test/java/com/liceomap/app/data/demo/DemoEntryTest.kt` |
| A | `app/src/test/java/com/liceomap/app/domain/AnnouncementQueryTest.kt` |
| A | `app/src/test/java/com/liceomap/app/domain/ChileanRutTest.kt` |
| A | `app/src/test/java/com/liceomap/app/domain/ScheduleClockTest.kt` |
| A | `app/src/test/java/com/liceomap/app/model/SchoolContentTest.kt` |
| A | `app/src/test/java/com/liceomap/app/model/SvgMapTest.kt` |
| A | `app/src/test/java/com/liceomap/app/ui/content/SchoolContentViewModelTest.kt` |
| M | `app/src/test/java/com/liceomap/app/ui/navigation/AppViewModelTest.kt` |
| A | `app/src/test/java/com/liceomap/app/ui/theme/ThemeContrastTest.kt` |
| A | `app/src/test/java/com/liceomap/app/ui/theme/ThemeModeTest.kt` |
| M | `ARCHITECTURE.md` |
| M | `gradle/libs.versions.toml` |
| A | `MIGRATION_REPORT.md` |
