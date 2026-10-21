# Fase 4.1 — Nitidez, escala y composición

Rama comprobada: `feature/web-cinematic-intro`. Cambios limitados a `web/`.
No se cambiaron versiones de GSAP/ScrollTrigger ni se reconstruyó el recorrido.

## Diagnóstico anterior a los cambios

Se midieron las cinco posturas en Chrome antes de modificar el diseño, en
1280 × 720 (DPR 1), 1440 × 900 (DPR 2), 390 × 844 y 320 × 720 (DPR 2).
Se inspeccionaron las capturas originales y sus dimensiones reales.

- La base del celular estaba limitada a 29svh en escritorio y 170px/21svh
  en compacto. Las escenas de explicación lo reducían a escala .97–.98.
- Las posturas de lectura conservaban 15–19° de giro lateral y hasta 5°
  de giro en el plano. Esa perspectiva estrechaba la interfaz y obligaba
  al navegador a remuestrear el texto rasterizado sobre una superficie oblicua.
- `force3D: true` y dos capas con `preserve-3d` mantenían una composición 3D
  incluso al detener el scroll. Son fuentes posibles de remuestreo adicional;
  no se atribuye a ellas una degradación cuantificada de píxeles.
- No se encontraron filtros de desenfoque/enfoque sobre la pantalla. Los
  fundidos son intencionales durante las transiciones; en lectura la captura
  correspondiente está completamente opaca.
- `home.png` y `anuncios.png` son JPEG de **691 × 1536**, pese a la extensión.
  La compresión ya está en las fuentes. `mapa.png` es PNG de **1080 × 2400**.
  No hay otra versión de mayor resolución de esas mismas interfaces en web/.
- Se detectó solapamiento del teléfono con el título del cierre y, en 320px,
  con la tarjeta de Anuncios. El enlace para saltar compartía la tira de pasos.

## Ajustes realizados

La base pasa a 35.5svh, con límite de 340px en escritorio; en compacto pasa
a 26svh, con límite de 210px. Una cota conservadora de la proyección limita
escala y posición según el tamaño real del dispositivo y el espacio entre
encabezado, tarjetas y controles. Se calcula al inicializar/refrescar cada
postura y se guarda en caché; no añade un listener ni cálculos de layout por
cada frame de scroll.

Se conservan los giros, las rutas, los fundidos y la línea de tiempo scrub.
Las explicaciones terminan frontales, con escala cercana a 1 cuando cabe.
`force3D: auto` permite resolver esas pausas en 2D; las capas intermedias ya
no preservan profundidad innecesaria. La perspectiva, sombras, marco e
iluminación cinematográfica siguen presentes durante las transiciones.

Las tarjetas entran cuando el celular ya está recuperando su postura de
lectura. Sus textos, tamaños de fuente y padding se conservan. El cierre
desplaza el teléfono debajo de su título. En compacto se oculta únicamente
la píldora decorativa redundante de notificaciones; la tarjeta principal y su
icono se mantienen. El caption conserva su nombre accesible sin ocupar
espacio visual en compacto.

Los pasos y el enlace Saltar recorrido tienen contenedores separados. Los
botones de escena llevan a una postura de lectura, sin detener ni sustituir
la sincronización con el scroll. Se ajusta el título de presentación para
que deje sitio al dispositivo. No se añadieron filtros, versiones ampliadas
artificialmente ni nuevas librerías. Los archivos de imagen originales no
se reescribieron y continúa usándose object-fit: contain.

## Medición de presencia visual

Altura proyectada del teléfono en las posturas de lectura, redondeada a px:

| Escena | 1280 × 720 antes → después | Mejora | 1440 × 900 antes → después | Mejora |
| --- | --- | --- | --- | --- |
| Presentación | 486 → 494 | 2 % | 632 → 636 | 1 % |
| Salas/plano | 388 → 494 | 27 % | 503 → 636 | 26 % |
| Horarios/Inicio | 396 → 494 | 25 % | 514 → 636 | 24 % |
| Anuncios | 396 → 494 | 25 % | 514 → 636 | 24 % |
| Cierre | 267 → 346 | 30 % | 346 → 446 | 29 % |

La presentación ya era grande: se conserva su presencia y se mejora el
ángulo. En 390 × 844, las escenas centrales pasan de 327–337px a 402–418px
(aproximadamente 20–28 %). En 320 × 720 se prioriza evitar superposiciones:
Anuncios pasa de 294 a 281px porque el texto de la tarjeta necesita más
altura. No se fuerza un aumento incompatible con ese espacio ni se reduce
la tipografía de las tarjetas para conseguirlo.

## Validación

```text
node --check web/story.js
node --check web/tests/phase2.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase2.cjs --composition --verify-composition
node web/tests/phase2.cjs
git diff --check
```

La auditoría de composición guarda capturas reales y composition.json en el
perfil temporal de Chrome cuya ruta imprime. Se comprobaron veinte posturas
de lectura y **324 posiciones intermedias** de scroll en los cuatro tamaños:
sin recortes contra navegación/controles, sin texto esencial cubierto durante
la lectura, ángulos frontales y separación entre pasos y salida. Las capturas
de escritorio y móvil se revisaron visualmente, comparándolas con las previas.

La regresión funcional completa aprobó: reversibilidad exacta, pose detenida,
fundidos, un único pin al redimensionar, loader y Saltar, timeout, menú,
consulta RUT válida/inválida, Leaflet con callbacks simulados y fallback,
modal/dashboard, pausa de transformaciones durante administración, foco,
pestañas y teclado, formularios, selección CSV, movimiento reducido y fallos
de scripts/JavaScript. También aprobaron integridad de recursos, UTF-8,
acentos, sintaxis JS y git diff --check.

## Límites de nitidez y pruebas pendientes

En los estados de lectura medidos, las imágenes tienen más píxeles de ancho
que el ancho CSS renderizado multiplicado por DPR; el margen mínimo observado
en 1440 × 900 / DPR 2 es aproximadamente **1.24×**. La reducción de tamaño y
los ángulos eran los problemas principales en estos tamaños, no un escalado
por encima de la resolución original.

Ese margen no recupera el detalle perdido por compresión JPEG. Para maximizar
la nitidez de Inicio y Anuncios en monitores DPR 3 o acercamientos mayores,
conviene reemplazar **home.png y anuncios.png** por capturas originales PNG
sin pérdidas de al menos **1080px de ancho**, exportadas desde la aplicación,
sin interpolarlas a partir de las actuales. La lectura de textos pequeños
también dispone de enlaces a las imágenes completas.

Continúan pendientes Safari/Firefox, tacto en dispositivos físicos, mosaicos
Leaflet en línea y medición de FPS/memoria en un equipo real de 4GB. Las
pruebas Chrome bloquean peticiones externas. No se midió una mejora de
rendimiento numérica ni se afirma que la compresión se haya eliminado.
