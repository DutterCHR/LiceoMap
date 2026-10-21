# Fase 5.3 — Cinematic Motion Polish

Trabajo sobre `feature/web-cinematic-intro`, limitado a `web/`. Sin commits,
push, merge, cambios de rama ni dependencias nuevas.

## 1. Diagnóstico previo

Se inspeccionaron `story.js`, `purpose.js`, `finale.js`, `app.js`, `style.css`,
`purpose.css` y `finale.css` antes de modificar la coreografía. Se registró la
Fase 5.2 real en Chrome antes de editar esos archivos:
[referencia](review/phase53/baseline.json),
[geometría y hashes](tests/fixtures/phase53-baseline.json).

Problemas de coreografía identificados:

- Ambos ScrollTrigger utilizaban `scrub: true`: cada incremento de rueda se
  trasladaba directamente al reloj visual, con escalones perceptibles.
- En el recorrido del teléfono, los cambios de pose tenían una concentración
  de velocidad mayor en el centro; las salidas de tarjetas duraban sólo 0,2
  unidades de narrativa y numerosos fundidos eran lineales.
- El vuelo aceleraba con `power2.in` y terminaba antes de completar el relevo
  al fondo. La desaparición posterior del escenario duraba 0,01 unidades.
  Aunque el color coincidía, la cámara llegaba a un estado detenido muy pronto.
- El título inicial del proyecto viajaba un 110% de su propia altura. Otros
  titulares entraban con desplazamientos de 38–65 px, varios linealmente.
- La reorganización de las tres tarjetas comenzaba simultáneamente. El relevo
  entre necesidades y pilares tenía poca separación respecto de ese movimiento.
- Visión y el cierre combinaban varias interpolaciones lineales; la interfaz
  terminaba de entrar justo al final del tramo de scroll.

Rendimiento: la referencia **no mostró** tareas largas ni intervalos rAF mayores
de 34 ms en el recorrido medido. No hay evidencia para atribuir la rigidez a
un cuello de botella de JavaScript en este equipo. `fitPose` ya usa caché y
resuelve el encuadre al inicializar/refrescar; los ambientes ya animaban opacidad,
sin filtros gigantes. Se conservó esa arquitectura.

## 2. Scrub, curvas y coordinación

### Scroll nativo y reloj accesible

| Región | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| Recorrido + proyecto, escritorio | `true` | `0.35` | Amortiguar la rueda manteniendo respuesta rápida |
| Recorrido + proyecto, compacto | `true` | `0.25` | Menor retraso sobre una composición más estrecha |
| Desenlace en flujo natural | `true` | `0.25` | Asentar pronto la interfaz interactiva |

El proyecto sigue dentro del mismo timeline y pin del recorrido. No se
añadieron listeners de rueda, scroll artificial, normalización del scroll,
snapping ni bucles permanentes en producción.

La prueba inicial con rueda nativa CDP comparó `true`, 0,25, 0,35 y 0,45:
asentamiento observado, incluyendo despacho y comprobación, de aproximadamente
47, 271, 362 y 475 ms. Se descartó 0,45 por su cola más perceptible. Es una
medición de laboratorio, no un plazo exacto garantizado para cada dispositivo.

Los controles, el estado activo, `inert`, `aria-hidden` y `aria-current` siguen
actualizándose desde el **timeline renderizado**, también después de parar la
rueda. Los enlaces directos del proyecto completan su interpolación después
de que el navegador confirme el scroll, y entonces enfocan el capítulo visible.
Los hashes del recorrido también completan ese salto directo.

Al salir de los tramos se completa el scrub pendiente. La prueba detectó un
caso especial real: ScrollTrigger coloca el inicio del pin en `-0.001px`,
de modo que llegar a `scrollY === 0` no dispara `onLeaveBack`. Se cubrió ese
límite explícitamente, conservando el scroll nativo. El cierre también se
pausa al abrir administración o al ocultar el documento y limpia sus listeners
al revertir la preferencia de movimiento.

### Coreografía

- **Celular:** `sine.inOut` para viajar entre las poses existentes; se mantienen
  sus destinos, encuadre, dimensiones, inclinaciones máximas y pausas de lectura.
  Tarjetas y titulares entran con una llegada más progresiva y salidas algo
  más largas. Los ambientes funden con `sine.inOut` durante 0,7 unidades.
- **Cámara:** centrado de 0,45 unidades con `sine.inOut`, seguido sin pausa
  de una aproximación de 1,4 con `power1.in`. Se conservan la escala objetivo,
  profundidad de 240 y posición final. La superficie comienza a fundir antes;
  el fondo entra en 0,3 unidades y el escenario sale en 0,18, una vez cubierto.
  El crecimiento sigue bajo el relevo de superficies del mismo color.
- **¿Qué es LiceoMap?:** líneas desde 18 px, `power3.out`, 0,62 unidades y
  stagger de 0,12. Sin alterar fuente, tamaño, texto ni destino tipográfico.
  La salida reduce el alejamiento de escala y el desplazamiento del conjunto.
- **El problema:** mismas posiciones de origen y destino de las tarjetas;
  llegada de 0,85 unidades con `power3.out`, manteniendo su escalonamiento.
  Los orígenes dependientes del viewport se recalculan durante refresh.
- **La solución:** reorganización con `sine.inOut`, pequeño desfase de 0,04
  entre tarjetas y relevo de contenido mientras terminan de alinearse. El
  titular entra desde 24 px; los pilares desde 14 px. Se mantiene el intervalo
  de lectura antes de iniciar la expansión de visión.
- **Nuestra visión:** salida del deck algo más anticipada y suave; entrada del
  conjunto desde 24 px; expansión del gráfico con `sine.inOut`. Los elementos
  de comunidad, futuro y enlace final conservan sus entradas escalonadas.
- **Desenlace:** titular desde 24 px y `power3.out`; la interfaz termina su
  llegada al 88% del tramo. Fondo y bordes comparten curva para evitar uniones
  de color desfasadas. La simulación sigue siendo finita y accionada por botón:
  pasos cada 0,34 s, proceso de 1,22 s y confirmación de 0,36 s.

Se conservan interpolaciones lineales donde conviene una correspondencia
directa con el scroll: crossfades de capturas, trazado de conexiones, wordmark
y beats de duración. Las duraciones del recorrido son unidades relativas de
timeline; sólo scrub y la demostración independiente se expresan en segundos
de reloj.

## 3. Diferencias comprobadas frente a 5.2

- Referencia registrada antes de modificar la animación, sin reconstruirla
  después a partir del resultado nuevo.
- **46 estados de lectura** comparados en seis viewports: mismo conjunto de
  elementos visibles y sus cajas dentro de 0,15 px de tolerancia. Se conservan
  las poses y tamaños finales del teléfono y la composición de los capítulos.
- HTML, `app.js`, administración, las tres hojas CSS inspeccionadas y vendors
  conservan sus hashes. Loader, entrada WAAPI, textos, fuentes, responsive,
  formularios y RUT permanecen en sus implementaciones originales.
- La rueda tiene ahora un asentamiento corto y convergente, sin oscilación ni
  deriva posterior. Los saltos directos y los extremos del pin quedan alineados.
- La inspección de capturas muestra el mismo teléfono llenando gradualmente
  la cámara y dando paso al título con un recorrido tipográfico más corto.
  La reorganización conserva las tarjetas y sus destinos; el contenido se
  releva durante la alineación. En el cierre, los titulares y la interfaz
  alcanzan antes su posición de lectura.
- Los estados intermedios cambian deliberadamente: no se exige que sus hashes
  visuales sean idénticos a 5.2. Las fixtures históricas no se sobrescribieron
  para hacer pasar esa comparación incompatible con el objetivo de esta fase.

Capturas antes/después en [galería comparativa](review/phase53/index.html).
Secuencia representativa de 20 estados de cámara, capítulos y transformación:
[galería](review/phase53/motion/index.html). Es una secuencia de capturas
asentadas, **no una grabación temporal** ni una prueba subjetiva con ratón físico.

## 4. Rendimiento disponible

Chrome 155 headless en este PC, 1440×900, mismo recorrido sintético de ida y
vuelta, 299 intervalos rAF por región y por versión, sin lecturas de layout
dentro del bucle de medición. Las peticiones HTTP/HTTPS externas se bloquean.

| Región | Versión | Mediana rAF | p95 | Máximo | >34 ms | Tareas largas |
| --- | --- | --- | --- | --- | --- | --- |
| Recorrido + proyecto | 5.2 | 10,0 ms | 10,1 ms | 11,9 ms | 0 | 0 |
| Recorrido + proyecto | 5.3 | 10,0 ms | 10,1 ms | 10,8 ms | 0 | 0 |
| Desenlace | 5.2 | 10,0 ms | 10,1 ms | 10,2 ms | 0 | 0 |
| Desenlace | 5.3 | 10,0 ms | 10,1 ms | 10,2 ms | 0 | 0 |

[Datos previos](review/phase53/baseline.json) ·
[Datos posteriores](review/phase53/checks.json) ·
[Muestra adicional del cierre](review/phase53/regression/performance.json).

No se observa una regresión material en esta muestra; tampoco se afirma una
aceleración del sitio. La mejora buscada es la calidad de la interpolación y
del ritmo. `PerformanceObserver` no registró tareas de más de 50 ms. No se
midieron por separado Paint/Raster/GPU ni el coste exacto de cada tween. Los
intervalos rAF de headless no garantizan FPS presentados ni 60 FPS reales.

No se añadieron filtros, capas decorativas, `will-change`, cálculos de layout
por fotograma, librerías ni efectos permanentes. Se conservaron la caché de
encuadre y las animaciones basadas principalmente en transform y opacidad.

## 5. Archivos modificados

- `story.js`: scrub diferenciado, curvas y ritmo del recorrido, hashes y límites.
- `purpose.js`: vuelo, títulos, tarjetas, visión y foco de anclas.
- `finale.js`: entrada, fondos, pequeña interacción y pausa del scrub.
- `tests/phase2.cjs`: rutas 5.3 y espera de asentamiento en auditorías existentes.
- `tests/phase52.cjs`: espera de scrub y directorio alternativo para sus pruebas,
  conservando los artefactos históricos 5.2.
- `tests/phase53.cjs`, `tests/phase53-motion.cjs`: comparación y movimiento real
  en Chrome mediante CDP, sin instalar dependencias de pruebas.
- `tests/fixtures/phase53-baseline.json`: geometría y hashes anteriores.
- `review/phase53/`: referencia, comparaciones, secuencia y resultados.
- `PHASE5.3.md`: diagnóstico y entrega.

`app.js`, `style.css`, `purpose.css` y `finale.css` fueron inspeccionados y no
necesitaron cambios. No se modificaron Android, backend ni base de datos.

## 6. Pruebas y limitaciones

Comandos de la fase:

```text
node --check web/story.js
node --check web/purpose.js
node --check web/finale.js
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase2.cjs --phase53-baseline  # ejecutado sólo antes de editar
node web/tests/phase2.cjs --phase53
node web/tests/phase2.cjs --phase53-motion
node web/tests/phase2.cjs --phase53-regression
node web/tests/phase2.cjs --composition --verify-composition --viewport=1280
node web/tests/phase2.cjs --composition --verify-composition --viewport=390
git diff --check
```

Chrome se ejecutó con perfil temporal aislado fuera del sandbox: su proceso
gráfico fallaba por restricciones de permisos dentro del entorno.

Cobertura: rueda nativa CDP lenta, rápida y reversa antes de terminar scrub;
pausa intermedia, convergencia sin oscilaciones y estabilidad; reproducción
inversa exacta en 20 estados; cobertura completa de pantalla antes del relevo;
150 muestras de escala y profundidad monotónicas durante el vuelo; extremos
del pin; anclas de capítulos, hashes y botones de navegación nativa; pausa al
abrir administración; resize dentro de un breakpoint y entre escritorio,
390×844 y orientación 844×390, incluyendo restauración del fallback natural.

La sonda de accesibilidad comprobó **2.731 frames**, **1.874 durante scrub**,
sin desajustes de controles, `aria-current`, `aria-hidden` o `inert` respecto al
reloj renderizado. Los contadores pertenecen a esa ejecución concreta.

La regresión funcional reutiliza la suite 5.2 en 1280×720, 1440×900, 390×844,
768×1024, 320×720 y 375×780. Comprueba títulos y tarjetas legibles, ausencia
de recortes, desenlace reversible, simulación por Enter, omisión/repetición,
resultado ficticio estable, altura reservada, RUT válido/inválido, foco, árbol
accesible, movimiento reducido inicial y dinámico, GSAP/ScrollTrigger ausentes
y HTML sin JavaScript. La sonda registra cero peticiones, escrituras y logs de
la demostración; sólo los submits manuales solicitados por la prueba.

La regresión general también verifica loader, handoff del teléfono, capturas,
menú, todas las pestañas y formularios administrativos, archivo, búsqueda,
sincronización demo, trampa/restauración del foco y bloqueo del scroll.

La auditoría geométrica del recorrido comprobó además **93 posiciones por
viewport, hacia adelante y hacia atrás**, en 1280×720 y 390×844, sin recortes
ni cruces del teléfono con el texto. Resultados:
[escritorio](review/phase53/composition-desktop-motion.json) y
[móvil](review/phase53/composition-mobile-motion.json).

Pendientes: apreciación subjetiva con ratón y trackpad físicos, gestos táctiles
en dispositivos reales, equipos modestos, Safari/Firefox, perfiles detallados
de GPU/raster y lector de pantalla real. La prueba automatizada de rueda usa
eventos nativos de Chrome; no sustituye esas sesiones manuales.

Referencia técnica utilizada para scrub numérico, actualización desde la
animación y finalización puntual del tween:
[documentación oficial de ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
