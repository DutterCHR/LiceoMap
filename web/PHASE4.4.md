# Fase 4.4 — Entrada, primer scroll y rendimiento

Rama verificada: `feature/web-cinematic-intro`. Esta fase modifica únicamente
`web/`, sobre los cambios locales de las fases anteriores. No se realizaron
commits, cambios de rama ni operaciones remotas de Git.

## Diagnóstico y correcciones

### Entrada sincronizada

`initHeroPhone()` animaba únicamente `.phone-entrance`. Los textos del hero
ya estaban visibles durante el fundido de salida del loader: no compartían
la entrada del celular.

Se preparan cinco animaciones nativas pausadas detrás del loader: etiqueta,
título, explicación, llamada a la acción y nota de demostración. Se reproducen
en el mismo callback de IntersectionObserver que inicia el teléfono. Cada
elemento aparece con opacidad y un desplazamiento vertical de 8px, durante
480ms, con desfases de 75ms. La composición textual termina a los 780ms,
dentro de los 1350ms existentes de entrada del teléfono, sin otra espera.

Se conservan los fotogramas, duración y curva de entrada del teléfono, así
como las animaciones y tiempos del loader. No se añadió iluminación de
entrada: se conserva el fondo aprobado.

Saltar, Escape, timeout, foco fuera del loader y demás salidas anticipadas
cancelan los efectos preparados y muestran inmediatamente el contenido.
El primer desplazamiento durante la entrada también entrega el control al
recorrido sin efectos residuales. Abrir administración finaliza la entrada;
ocultar la pestaña pausa las animaciones ya iniciadas. Volver a la pestaña
no reproduce prematuramente las animaciones preparadas detrás del loader.

### Primer desplazamiento

La causa principal era el tramo quieto explícito: el hero comenzaba a salir
en 1.55 y el teléfono comenzaba a desplazarse en 1.78 de una timeline de 10.
No era un retraso de suavizado: `scrub` ya era `true`.

`FIRST_DEPARTURE.idleRatio = .7` adelanta solamente esos comienzos:

| Hito de la timeline | Fase 4.3 | Fase 4.4 |
| --- | ---: | ---: |
| Comienza la salida del hero | 1.55 | 1.085 |
| Comienza el movimiento hacia Salas | 1.78 | 1.246 |
| Llegada a la postura de transición de Salas | 2.32 | 2.32 |
| Postura frontal de lectura de Salas | 2.72 | 2.72 |

El hero termina de salir en 1.55 para dejar libre el cruce del teléfono.
El tween inicial de postura quieta termina en 1, antes del nuevo movimiento;
sus dos extremos siguen siendo iguales. No cambian el pin, su distancia,
`scrub`, la duración global, las pantallas ni los tiempos de las escenas
posteriores.

El primer cambio de opacidad mayor al 1%, medido mediante scroll nativo,
aparece a los **356px frente a 505px** en 1280×720 y **353px frente a 500px**
en 390×844: aproximadamente **29.5% menos** recorrido hasta una respuesta
perceptible. Se mantiene el momento inicial de contemplación.

### Optimización de trabajo redundante

- La entrega de control desde la entrada se comunica una sola vez, en lugar
  de llamar a su limpieza en cada actualización del scroll. La limpieza es
  idempotente y libera observador, animaciones y listener de movimiento.
- Se evita escribir otra vez las variables CSS de encaje durante un refresh
  si sus medidas no cambiaron. La caché de posturas sigue invalidándose para
  recalcular correctamente al redimensionar.
- Se solicita refresh por fuentes solamente cuando todavía están cargando.
  Los archivos locales y la precarga de capturas de 4.3 se conservan.
- Los nuevos efectos usan exclusivamente `transform` y `opacity`, comparten
  el ciclo de vida existente y se liberan al terminar. No se añadieron loops,
  listeners de scroll, filtros, `will-change` ni dependencias.

La inspección no encontró lecturas geométricas repetidas por fotograma en
el código de scroll: la instrumentación de `offsetTop/Width/Height/Parent`
contó cero durante el tramo medido, tanto antes como después. La caché previa
ya evitaba ese coste. Las sombras y perspectiva existentes se conservan;
el filtro del logo es estático y el backdrop del panel no se anima durante
el recorrido. No se atribuye a estos efectos una mejora que no se midió.

## Comparación de rendimiento

Chrome real en modo headless, equipo AMD Athlon Gold 3150U, memoria visible
3,698,143,232 bytes (aproximadamente 3.44GiB). Entrada natural y después 100
posiciones de scroll nativo hasta el 28% del recorrido, con limitación de CPU
4× solamente durante el scroll. Misma instrumentación antes y después,
viewport y devicePixelRatio 1 en esta comparación.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Entrada, intervalo RAF p95, escritorio | 17.3ms | 17.2ms |
| Entrada, intervalo RAF p95, móvil | 17.0ms | 17.0ms |
| Primer scroll, intervalo RAF p95, escritorio, CPU 4× | 216.6ms | 33.3ms |
| Primer scroll, intervalo RAF p95, móvil, CPU 4× | 17.4ms | 18.4ms |
| ScriptDuration acumulado, escritorio | 209.5ms | 89.1ms |
| ScriptDuration acumulado, móvil | 78.2ms | 63.9ms |

Son muestras de diagnóstico, no una garantía de FPS ni una estimación causal
aislada. La muestra anterior de escritorio tuvo un pico de layout de 566ms;
otras ejecuciones variaron considerablemente. En la muestra final persisten
intervalos máximos de 166.6ms en escritorio y 66.7ms en móvil bajo CPU 4×.
El p95 móvil no mejora. Al comenzar antes la transición, el mismo tramo
medido contiene más fotogramas con cambios de estilo (46 → 62 recálculos).
Hace falta evaluar la sensación con Chrome visible y carga real del equipo;
no se simularon presión de RAM ni todos los costes de composición de la GPU.

Referencia anterior guardada en `tests/fixtures/phase43-state.json`.
Resultados posteriores y capturas:
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-T9d4Qp\phase44.json`.

## Protección del diseño aprobado

Los hashes SHA-256 de `index.html`, `style.css`, las tres capturas y las dos
fuentes locales coinciden exactamente con la referencia tomada antes de
editar. No se modificaron esos archivos, textos, proporciones ni responsive.

Se compararon 37 estados por viewport desde 2.8 hasta 9.82 de la timeline:
**74 estados coinciden exactamente** con 4.3, incluyendo transformaciones,
pantallas, tarjetas, líneas de titulares, iluminación, plano, caption,
atributos de accesibilidad, duración y límites del pin. Esta comparación es
un muestreo amplio; no equivale a una comparación de todos los píxeles de
todos los fotogramas.

## Archivos de esta fase

- `app.js`: coordinación y limpieza de la entrada.
- `story.js`: salida inicial anticipada y eliminación de trabajo redundante.
- `tests/phone-lifecycle.cjs`: preparación, reproducción, interrupciones,
  pestaña oculta, administración y fallbacks de la entrada completa.
- `tests/phase2.cjs`: integración de comparación, comprobaciones de Saltar
  y Escape; muestreos de quietud ajustados al tramo inicial más corto.
- `tests/phase44.cjs`: mediciones, regresión contra 4.3 y reversibilidad.
- `tests/fixtures/phase43-state.json`: referencia capturada antes de editar.
- `PHASE4.4.md`: este informe.

## Validación

Comandos ejecutados:

```text
node --check web/app.js
node --check web/story.js
node --check web/tests/phase2.cjs
node --check web/tests/phase44.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/story.test.cjs
node web/tests/phase2.cjs --phase44-verify
node web/tests/phase2.cjs
node web/tests/phase2.cjs --composition --verify-composition
git diff --check
```

La comprobación específica 4.4 valida entrada natural sincronizada en
1280×720 y 390×844, interrupción real por scroll durante la entrada,
respuesta inicial, estado detenido y primera transición idéntica al avanzar
y retroceder en diez puntos. La regresión general valida continuidad del
teléfono al terminar la entrada, reconstrucción al redimensionar, Saltar,
Escape, timeout, menú, consulta RUT demostrativa, administración, foco,
bloqueo de scroll, pestañas, formularios, carga de archivo, movimiento
reducido dinámico y fallbacks sin JavaScript o sin script decorativo/plugin.
Leaflet se comprueba con callbacks deterministas y con ausencia de red;
no se valida la disponibilidad real del servicio externo de mapas.

Se revisan UTF-8 estricto, ausencia de caracteres de sustitución, UBÍCATE,
CONÉCTATE, referencias locales, dimensiones reales de capturas y versiones
fijadas. La auditoría de composición comprueba 1280×720, 1440×900, 390×844
y 320×720, tamaños de lectura, contraste, encaje y superposiciones en los
puntos intermedios del recorrido, también al retroceder. Las capturas se
inspeccionan como imágenes de Chrome; no es una sesión manual interactiva.

Durante la validación se corrigió un muestreo antiguo de la prueba de
resize: comprobaba la quietud en 1.4, cuando la salida ahora empieza en
1.246; se comprueba en 1.0. Una ejecución previa de la medición agotó la
espera de entrada bajo carga del equipo; la repetición con diagnóstico y
las comprobaciones ampliadas finalizaron correctamente.

Resultado final: todos los comandos anteriores finalizaron con éxito. La
auditoría comprobó 93 puntos del recorrido por resolución en ambos sentidos,
sin recortes ni superposiciones detectadas, y las 20 posturas de lectura
mantienen contraste y encaje. La regresión general guardó capturas en
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-iDh60Z`; la auditoría
de composición y sus capturas están en
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-DN7GKV`.

No se detectaron fallos funcionales pendientes en estas pruebas. Quedan la
validación manual de fluidez y GPU con Chrome visible, las variaciones de
carga del PC y la disponibilidad de los servicios externos. Los archivos
temporales de resultados pueden desaparecer al limpiar la carpeta Temp;
la referencia 4.3 y el procedimiento reproducible permanecen en `web/tests/`.
