# Fase 3 — Inventario previo

Documento histórico. La experiencia vigente se describe en `PHASE4.md`.

Rama verificada: `feature/web-cinematic-intro`. Solo se modifica `web/`.

| Bloque previo | Referencias | Decisión |
| --- | --- | --- |
| Introducción | `app-preloader`, `intro-skip`, `initCinematicIntro` | Conservar secuencia, salidas y timeout |
| Hero y celular | `concepto`, `hero-title`, `hero-phone`, `initHeroPhone` | Reutilizar celular en un solo recorrido |
| Editorial | `editorial-split-section` | Sustituir por escenas |
| Tarjetas expansibles | `servicios`, `explore-pin-wrapper`, `explore-track`, `card-toggle`, `preview-*` | Trasladar contenido; retirar controlador horizontal y expansión |
| Leaflet | `mapa-container`, `map`, `map-status` | Conservar inicialización, marcador, tiles y errores |
| Tablón estático | `anuncios`, `anuncio-card` | Trasladar al relato; retirar comunicados de muestra con fechas |
| Consulta | `app-preview`, `student-demo-form`, `rut-input`, `student-demo-status` | Conservar validación, formato y resultado simulado |
| Navegación/footer | `hamburger-toggle`, `nav-links-menu`, `btn-open-admin`, `footer-admin-link` | Conservar acceso y destinos |
| Administración | `admin-modal`, `admin-login-form`, `admin-dashboard`, `tab-*`, `demo-*`, `file-upload` | Conservar DOM y eventos; pausar decoración al abrir |

`app-admin.js` no figura en ningún script de index.html. Es legado: usa
`login-error-msg`, `.tab-panel`, clases hidden y una sesión ficticia en
localStorage. No se carga, reutiliza ni elimina.

La búsqueda de archivos SVG (incluido `git ls-files '*.svg'`) no devuelve
recursos. No se inventará un plano del establecimiento: la escena de
orientación mostrará `mapa.png`, separada del mapa geográfico Leaflet.

## Implementación

La landing tiene un solo recorrido con cinco escenas: presentación, salas,
horarios, anuncios y orientación. Reutiliza un único celular y cambia su
captura entre `captura de salas de esa fase`, `captura de horarios de esa fase`, `anuncios.png` y `mapa.png`.
El recorrido termina en la presentación del proyecto y sus llamadas a la
acción, conservando debajo el mapa y la consulta de demostración.

El posicionamiento usa CSS sticky; `story.js` mantiene un único listener de
scroll y agrupa eventos en un requestAnimationFrame. Interpola posición,
inclinación y escala entre escenas sin un bucle perpetuo ni scroll artificial.
La aparición conserva Web Animations API en una capa independiente y se
asienta al empezar a desplazarse. Se retira la flotación autónoma de fase 2
para que el recorrido tenga un solo dueño de los movimientos.

Se sustituyeron el hero fotográfico, editorial, carrusel horizontal, tarjetas
expandibles y tablón con fechas de muestra. Se retiraron sus estilos,
IntersectionObserver de revelado, interpolación horizontal y listeners de
expansión después de retirar las referencias del HTML. No se borraron imágenes
ni archivos completos del proyecto. Los estilos administrativos se conservaron.

La navegación se adapta con un menú desplegable que conserva su controlador,
IDs, estado aria-expanded e inert. El nuevo grid de la consulta evita el
desbordamiento preexistente en 320 px. No hay tarjetas antiguas ocultas detrás
de la nueva experiencia.

## Administración y demostraciones

Modal, dashboard, IDs, formularios, pestañas, búsqueda y selección de archivo
permanecen. Abrir administración descarta la entrada decorativa pendiente,
pausa el controlador narrativo, establece inert en el contenido público y
conserva su gestión de foco/overflow. Al cerrar, restaura el estado y vuelve
a medir el recorrido. El sticky no crea contenedores de scroll ni pin-spacers;
los índices de apilamiento quedan por debajo del modal y el dashboard.

Si `story.js` no está disponible, app.js sigue inicializando navegación,
Leaflet, formularios y administración. Se identifica explícitamente el login
y el panel como demostraciones: no autentican, no guardan datos ni envían
comunicados. Se corrigieron mensajes de éxito simulados para no sugerir
persistencia o sincronización real.

Sin JavaScript se muestran el celular y todos los textos. Cada módulo tiene
un enlace directo a su captura. Con movimiento reducido no hay giro ni scroll
fijado del celular; el contenido continúa en el flujo normal y las capturas
siguen accesibles. El controlador no programa frames cuando la pestaña está
oculta y deja de escribir transformaciones al salir del intervalo narrativo.

## Verificación

```text
node --check web/app.js
node --check web/story.js
node --check web/tests/phase2.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/story.test.cjs
node web/tests/phase2.cjs
git diff --check
```

`phase2.cjs` se mantiene como punto de entrada de la regresión de navegador y
se actualizó para la fase 3. Requiere Chrome/Edge instalado (o CHROME_PATH),
Node 22+ y permiso de conexión al navegador local en este sandbox. Usa un
perfil temporal aislado, bloquea peticiones externas y guarda capturas en la
ruta temporal que imprime.

Las pruebas deterministas verifican loader, Saltar, Escape, timeout, foco,
API no disponible, entrega natural al celular, limpieza de observadores,
cinco escenas y pantallas, coalescencia de frames, pausa administrativa,
movimiento reducido y visibilidad de la pestaña.

Chrome comprueba el recorrido completo, capturas reales, modal, login demo,
dashboard, formularios, pestañas y flechas de teclado, ciclo de foco, Escape,
restauración de overflow/inert, selección CSV, consulta RUT válida e inválida,
menú móvil, tamaños 320/390/768/1100/1440 px, movimiento reducido inicial y
dinámico, ausencia de JavaScript y fallo de carga del script decorativo.
Leaflet se comprueba con callbacks deterministas de tiles y fallback sin CDN.

También se comparó la implementación Leaflet con HEAD (idéntica, salvo finales
de línea), se verificaron todos los IDs administrativos, destinos de anclas,
IDs duplicados, sintaxis JS y UTF-8 estricto. UBÍCATE, CONÉCTATE y Saltar
introducción se comprueban mediante escapes Unicode en las pruebas.

Resultado final: las tres regresiones (loader/celular, controlador narrativo y
Chrome), las comprobaciones de sintaxis y `git diff --check` aprobaron. La
última ejecución de Chrome verificó también el ciclo de foco, selección de
archivo y administración con `story.js` bloqueado. Se revisaron las capturas
generadas, sin publicar el sitio ni generar commits.

## Límites pendientes

- No hay SVG del plano en los recursos actuales; se usa su captura sin
  inventar geometría ni navegación interior. Puede sustituirse al aportar el SVG.
- Los mosaicos en línea, fuentes e iconos externos no se validan en la prueba
  offline. La lógica Leaflet y sus dependencias fijadas se conservan.
- Las capturas revisadas cubren escritorio, escenas, móvil y administración.
  Falta probar tacto, Safari/Firefox y continuidad del movimiento en dispositivos
  físicos. No se midieron FPS ni memoria en un equipo de 4 GB de RAM.
- La consulta y el panel continúan siendo demostrativos; conectar backend y
  autenticación real queda fuera de esta fase.
