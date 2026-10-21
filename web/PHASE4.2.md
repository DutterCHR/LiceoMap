# Fase 4.2 — Movimiento cinematográfico equilibrado

Rama verificada: `feature/web-cinematic-intro`. Trabajo limitado a `web/`.
Se revisaron los cambios ya existentes, `index.html`, `app.js`, `story.js`,
`style.css`, recursos y pruebas antes de editar. Los cambios de fases anteriores
y las imágenes añadidas/eliminadas por el usuario se conservaron.

## Diagnóstico y ajustes

La línea de tiempo anterior tenía giros laterales de hasta 34°, inclinaciones
de hasta 12°, escalas solicitadas de 1.48 y desplazamientos de hasta el 29 %
del viewport. El ajuste geométrico podía reducir esas escalas; no eran todas
necesariamente las escalas finalmente dibujadas. El primer estado de scroll
también partía inclinado y volvía a girar después de la entrada.

Ahora `STORY_MOTION`, al comienzo de `story.js`, concentra la postura de
lectura, el zoom de transición y los recorridos/duraciones de las tarjetas.

- **Lectura y transiciones:** rotación X/Y/Z de 0°. Sin órbitas ni flotación
  continua; se eliminan los desplazamientos decorativos del teléfono.
- **Zoom:** máximo solicitado 1.04, un 4 % sobre la escala de lectura 1.
  `fitPose` lo limita al espacio disponible, incluso suprimiéndolo en móvil.
  La adaptación geométrica móvil mantiene los tamaños de lectura de 4.1.
- **Posición:** centrado horizontal; conserva la base vertical de lectura.
  Solamente se recoloca lo necesario para encajar entre encabezado, tarjeta y
  controles. En los cuatro tamaños medidos, cada ajuste vertical entre
  lecturas contiguas es inferior a 24px. No hay movimiento durante la lectura.
- **Contenido:** fundidos de pantalla y entrada de tarjetas coordinados en la
  misma línea de tiempo. Paneles con recorrido de 12px, tarjetas de 16px,
  sin el escalado anterior de las tarjetas. La salida de la tarjeta hereda
  el desplazamiento corto del panel, evitando acumular dos desplazamientos
  hacia el teléfono.
- **Iluminación:** variaciones de opacidad de los gradientes azul y petróleo/
  menta existentes. Se eliminan su desplazamiento y escalado progresivos.
  Sombras estáticas y borde sutil refuerzan las tarjetas; sin filtros nuevos.
- **Cierre:** el teléfono conserva su protagonismo central. El plano se
  distribuye en la columna izquierda de escritorio; en compacto aparece
  dentro del teléfono, con etiqueta accesible correspondiente, dejando sitio
  a la tarjeta completa y sus enlaces. Se mantienen todos los textos y CTA.

La entrada espectacular de `app.js` sigue intacta: la Web Animations API
controla exclusivamente `.phone-entrance`, desde fuera de pantalla hasta
identidad. GSAP controla `.phone-story`, cuya primera postura ahora ya es
frontal y coincide con la lectura. Desplazarse cancela la entrada pendiente
como antes, sin demorar la navegación. La primera postura se incluye como
un tramo inmóvil de la línea de tiempo, con valores reevaluados al refrescar;
redimensionar no restaura dimensiones antiguas.

Se conservan GSAP/ScrollTrigger **3.15.0**, un único pin, `scrub: true`, el
scroll nativo, la reversibilidad y el estado al detenerse. No se añaden
listeners, bibliotecas, RAF continuos ni controladores de transformaciones.
El cálculo de encaje se guarda en caché por postura y se invalida al refrescar.
La suspensión del recorrido durante administración y al ocultar la pestaña
sigue utilizando el controlador existente. Los fallbacks lineales sin JS,
sin ScrollTrigger y con movimiento reducido permanecen disponibles.

## Archivos de esta fase

- `story.js`: parámetros, postura inicial, transiciones, tarjetas e iluminación.
- `style.css`: composición central, título de presentación legible en su columna,
  profundidad de tarjetas y ubicación responsive del plano de cierre.
- `tests/phase2.cjs`: regresiones de continuidad, inmovilidad durante lectura,
  refresco inicial, límites y superposiciones durante transiciones.
- `PHASE4.2.md`: este informe.

`app.js`, `index.html`, los originales de imágenes, las bibliotecas y el panel
administrativo se inspeccionaron y no se editaron en esta fase.

## Pruebas y resultados

```text
node --check web/story.js
node --check web/tests/phase2.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase2.cjs
node web/tests/phase2.cjs --composition --verify-composition
git diff --check
```

Pruebas aprobadas en Chrome instalado, en modo headless, usando el sitio local:

- Loader natural, Saltar, timeout y salidas anticipadas; entrada conservada.
- Comparación del último fotograma de entrada con el estado sin animación y
  con la primera escena: sin salto geométrico, tolerancia de 0.05px.
- Lecturas inmóviles, avance/retroceso, fundidos de Salas, Horarios y Anuncios,
  conservación del estado al detener el scroll y un único pin tras resize.
- Refresco entre dos resoluciones de escritorio sin cruzar un breakpoint:
  la primera postura mantiene continuidad con la lectura.
- Modal/dashboard, pausa, foco, bloqueo/restauración de scroll, pestañas y
  teclado, formularios demostrativos, selección CSV y consulta RUT.
- Menú móvil, callbacks Leaflet simulados y fallback de carga del mapa.
- Movimiento reducido inicial/dinámico, scripts decorativos ausentes y sin JS.
- Recursos locales, UTF-8, acentos, sintaxis, versiones fijadas y diff limpio
  de errores de espacios. Git conserva su aviso previo de conversión LF/CRLF.

La auditoría de composición revisa 20 posturas de lectura y 324 posiciones
intermedias en **1280 × 720, 1440 × 900, 390 × 844 y 320 × 720**. También
repite cinco posiciones por resolución en sentido inverso. No encuentra
recortes contra navegación/controles, texto esencial cubierto durante lecturas
o transiciones visibles, ni exceso del presupuesto de movimiento. Se revisaron
visualmente capturas reales de Chrome de escritorio y móvil.

Altura del teléfono durante lectura, en píxeles CSS redondeados:

| Resolución | Inicio | Salas | Horarios | Anuncios | Cierre |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280 × 720 | 494 | 494 | 494 | 494 | 494 |
| 1440 × 900 | 636 | 636 | 636 | 636 | 636 |
| 390 × 844 | 406 | 418 | 402 | 402 | 382 |
| 320 × 720 | 313 | 300 | 300 | 281 | 248 |

Las lecturas de Inicio, Salas, Horarios y Anuncios mantienen los tamaños de
4.1. El cierre aumenta su presencia en escritorio y 390px; en 320px conserva
su tamaño para alojar el texto y las llamadas a la acción. Las capturas siguen
usando `object-fit: contain`, sin filtros ni cambios en los originales.

Evidencias de esta ejecución (perfiles temporales que imprime el test):

- Regresión completa: `liceomap-phase2-y8bk4O`.
- Composición final, capturas y `composition.json`: `liceomap-phase2-mkfh98`.

## Limitaciones pendientes

Chrome headless no sustituye la validación de tacto en dispositivos físicos,
Safari/Firefox ni la medición de FPS y memoria en un equipo real de 4GB.
Las peticiones externas se bloquean en las pruebas: Leaflet se verifica con
callbacks controlados y fallback, sin afirmar una validación de mosaicos online.

Inicio y Anuncios siguen siendo JPEG de 691 × 1536, pese a la extensión PNG.
No se recupera la información perdida por esa compresión. Para DPR 3 o mayor
detalle se necesitan originales PNG sin pérdidas de al menos 1080px de ancho.
El plano sigue siendo una referencia de demostración; no existe una captura
actualizada de horarios completos ni un recurso SVG en los archivos disponibles.
El panel y la consulta RUT siguen siendo demostraciones sin conexión a datos
reales; esta fase no altera ese alcance.
