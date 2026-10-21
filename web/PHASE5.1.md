# Fase 5.1 — Atravesar el dispositivo, entrar en la historia

Trabajo local en `feature/web-cinematic-intro`, exclusivamente en `web/`.
Se conservaron los cambios locales de Fase 5 encontrados al comenzar. No se
hicieron commits, cambios de rama ni operaciones remotas de Git.

## Diagnóstico

La Fase 5 tenía cuatro bloques independientes en flujo natural. Sus titulares
recorrían 24 px, las tarjetas 25–73 px y el resto se revelaba con opacidad.
Después de cada entrada, la composición quedaba prácticamente estática. El
diagrama de los pilares utilizaba otros elementos: no resolvía visualmente las
tarjetas del problema. El pin del celular terminaba sin un enlace espacial con
el proyecto.

La jerarquía editorial era legible, pero faltaban un objeto continuo, un cambio
de escala de cámara y relaciones entre escenas. Se sustituyó esa coreografía,
reutilizando el HTML semántico y los recursos locales.

Referencias de dirección indicadas por el encargo:
[ERA Residence](https://www.era-residence.com/) y su
[ficha de Awwwards](https://www.awwwards.com/sites/era-residence).
Se consultó el contenido del primer sitio; la ficha no permitió acceso mediante
la herramienta web. La composición, los gráficos y la implementación son propios;
no se incorporaron código, fotografías ni otros recursos de esas referencias.

## Celular → narrativa

Se eligió extender controladamente la timeline existente y conservar **un solo
pin**. Un segundo pin con un teléfono duplicado o un título de relevo habría
introducido más estados que sincronizar al invertir el scroll o redimensionar.

El HTML del recorrido y las animaciones de sus primeros diez tiempos se
conservan. A partir del tiempo 10:

1. Salen los textos finales, el plano secundario, el pie del teléfono y los
   controles del recorrido. La navegación principal permanece disponible.
2. El mismo `.phone-story` vuelve al centro y queda frontal. Su aproximación
   utiliza escala y profundidad Z dentro de la perspectiva existente.
3. Una superficie CSS petróleo, dentro de `.phone-screen`, sustituye
   progresivamente la captura antes del acercamiento extremo. No se amplía una
   captura rasterizada indefinidamente.
4. La escala final se calcula desde las dimensiones reales de pantalla y
   viewport, con margen de cobertura. Solo cuando la pantalla cubre las cuatro
   esquinas aparece el fondo equivalente de la narrativa.
5. Entran los dos bloques de «¿QUÉ ES LICEOMAP?». Después aparecen la explicación
   y la composición Espacios / Información / Comunidad.

No se cambia `src`, no se crea otro teléfono, no hay negro ni segundo loader.
La superficie de relevo es gráfica y del mismo color; no contiene una segunda
captura del dispositivo. Al retroceder se reconstruyen el marco, la captura y
la escena final original.

## Arquitectura GSAP

- `story.js` sigue creando `liceomap-cinema`. `purpose.js`, cargado después de
  `app.js`, añade una secuencia hija a su timeline en el tiempo 10.
- Solo esa timeline maestra y su ScrollTrigger controlan el recorrido completo.
  `scrub: true` conserva estados intermedios y no introduce avance temporal
  cuando el visitante deja de desplazarse.
- Se trasladan los **mismos nodos** de `#proyecto` al viewport del pin durante
  la mejora cinematográfica. No se duplican títulos, anclas ni capítulos.
- Las tres tarjetas se trasladan a una composición compartida. Los nodos de
  los pilares entran dentro de esas mismas tarjetas; sus superficies se
  enderezan, alinean y conectan mientras cambia el contenido.
- La duración completa es 25,2 unidades de timeline, no segundos de espera.
  La distancia del pin mantiene la densidad original por unidad: los primeros
  diez tiempos siguen usando aproximadamente 450% del alto en escritorio y
  380% en compacto. La historia añade 684% y 577,6%, respectivamente.
  ScrollTrigger redondea la distancia final a píxeles enteros.
- `story.js` solo cambia en el cálculo de navegación, que ahora usa la duración
  real, y en el estado accesible al abandonar sus cinco escenas. Sus poses,
  capturas, intervalos de lectura y curvas anteriores siguen intactos.
- El callback original se conserva y se encadena. El estado accesible y
  `aria-current` solo se actualizan al cambiar de capítulo.
- El bloqueo administrativo original deshabilita el mismo trigger y pausa la
  misma timeline, congelando también la nueva narrativa.

`gsap.matchMedia()` revierte la mejora. Como la secuencia hija cambia de padre,
se conserva además una instantánea de los estilos originales del documento:
la limpieza la restaura explícitamente y devuelve cada nodo a su contenedor.
Esto evita que sobrevivan los estados iniciales ocultos de tweens `fromTo`
al cambiar dinámicamente de preferencia o de tamaño.

## Cuatro capítulos

| Capítulo | Coreografía y continuidad |
| --- | --- |
| La idea | Entrada tipográfica en dos bloques; explicación posterior; movimiento lateral sutil de las palabras. El conjunto se aleja y sube para abrir espacio al problema. |
| El desafío | Tres trayectorias distintas, escalas y pequeñas inclinaciones. Las preguntas quedan separadas con un intervalo de lectura. Después las tarjetas se acercan y enderezan. |
| El objetivo | Las mismas tarjetas pasan a Orientación, Organización y Comunicación. Cambian sus textos, se dibujan conexiones SVG y aparece el nodo LiceoMap. Hay una pausa para leer los tres pilares. |
| La visión | La composición conectada reduce su escala. Se abre un campo más luminoso, crece el gráfico simbólico de Arica y aparecen otras comunidades posibles. El texto conserva expresamente el carácter futuro de la expansión. |

El cierre presenta la demostración existente y su aviso de datos de ejemplo.
Al terminar el pin, la visión sale con el flujo nativo y deja entrar la demo.

## Responsive, teclado y fallbacks

- Escritorio: tarjetas en profundidad lateral y resolución en tres columnas.
- Compacto: entradas desde lados alternos y reorganización vertical. Se
  reducen inclinaciones y se reserva separación entre las tres tarjetas.
- Por debajo de 720 px de alto la nueva narrativa permanece en flujo natural,
  conservando el comportamiento original del recorrido. Esto permite leer en
  ventanas bajas, orientación horizontal y pantallas con poco espacio vertical.
- `prefers-reduced-motion` deja todos los capítulos ordenados y visibles, sin
  la fijación cinematográfica. El cambio durante la sesión también está probado.
- Sin JavaScript, GSAP, ScrollTrigger o controlador de propósito, el HTML
  permanece en el documento con todos los contenidos y enlaces.
- Los capítulos inactivos usan `inert` y `aria-hidden`. Las tarjetas compartidas
  exponen el texto correspondiente a problema o solución. La limpieza restaura
  el documento accesible completo.
- Los enlaces de capítulos y los hashes llevan a tiempos legibles del pin.
  La navegación por enlace devuelve el foco al capítulo. Un único
  `requestAnimationFrame` sincroniza ese foco con el scroll nativo; no anima
  la transición ni se repite permanentemente.
- «Ir a la demo» permite abandonar la historia desde cualquier capítulo y
  funciona con teclado. Se conservan «Saltar introducción», «Saltar recorrido»,
  los enlaces existentes y la navegación principal.

## Archivos de esta fase

- `index.html`: titulares y texto base, acceso a la demo, comunidades simbólicas
  y enlace al CSS específico. El HTML del celular, demo, footer y panel queda
  conservado respecto del estado local inicial.
- `purpose.js`: secuencia, integración, navegación, accesibilidad y reversión.
- `purpose.css`: estilos cinematográficos aislados; no modifica el CSS aprobado
  de las fases anteriores.
- `story.js`: cambios mínimos de conexión descritos arriba.
- `tests/phase51.cjs` y `tests/fixtures/phase51-scenes.json`: comparación con
  estados registrados **antes de editar**, auditoría de la narrativa y vídeo.
- `tests/phase2.cjs`: geometría de las escenas originales por tiempo absoluto
  de timeline, validación UTF-8 de los nuevos archivos y entrada de la suite.
  `--phase5` es ahora alias de la auditoría actualizada `--phase51`.
- `tests/phase5-integrity.cjs`: excepción explícita `--phase51-integrity` para
  normalizar únicamente los cambios permitidos de conexión en `story.js`.
  El fixture anterior no se reescribió.
- `review/phase51/`: siete capturas, clip WebM y muestra de rendimiento.
- `PHASE5.1.md`: este registro. `PHASE5.md` describe la versión anterior.

`app.js`, `style.css` y `tests/phase45.cjs` ya tenían cambios locales de Fase 5
al comenzar; esta fase no añadió modificaciones en ellos. Tampoco cambió
`app-admin.js`, vendors, capturas, fuentes, Android, backend ni base de datos.

## Validación efectuada

Chrome instalado, controlado mediante CDP, con HTTP/HTTPS externos bloqueados.
Su proceso gráfico necesitó ejecución fuera del sandbox por acceso denegado.

```text
node --check web/app.js
node --check web/story.js
node --check web/purpose.js
node --check web/tests/phase2.cjs
node --check web/tests/phase51.cjs
node --check web/tests/phase5-integrity.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase5-integrity.cjs --phase51-integrity
node web/tests/phase2.cjs
node web/tests/phase2.cjs --phase51 --video
node web/tests/phase2.cjs --phase45-verify --phase5-integrity --phase51-integrity
git diff --check
```

Todos finalizaron correctamente. La auditoría nueva cubre 1280×720,
1440×900, 768×1024, 390×844 y 320×720, con 17 estados por resolución,
recorrido inverso y pausa. Comprueba cobertura antes del relevo, un único
dispositivo/pin, ausencia de desbordamiento, lectura sin recortes, separación
de tarjetas, anclas, foco, salto con Enter y pausa administrativa. También
comprueba la reversión dinámica, viewport corto 390×640, dependencia ausente
y JavaScript desactivado.

La preservación comprueba los 36 hashes originales con la mejora bloqueada y
compara su geometría al habilitarla, con tolerancia inferior a 0,12 px por el
redondeo del pin ampliado. La prueba de integridad protege los segmentos de
loader, celular, demo, footer, administración, capturas y fuentes.

La regresión general pasó los formularios RUT válido/inválido, acceso y cierre
administrativo, pestañas y flechas de teclado, comunicados, salas, selección de
archivo, sincronización demo, búsqueda de usuarios, foco y bloqueo del scroll.
Se inspeccionó visualmente también su captura del panel.

La auditoría de entrada original registró **2186 oportunidades de renderizado**
en seis cargas/recargas de escritorio y móvil, **222 durante el fundido**, con
**cero apariciones prematuras** y una única entrada por carga.

Se abrieron e inspeccionaron capturas de la escena final, inicio/medio/final
del vuelo, cobertura del viewport, título, lectura y convergencia de tarjetas,
pilares, apertura de visión y versiones móviles. Durante esa revisión se
corrigieron recorte del cierre en escritorio, separación de tarjetas móviles,
espacio interior de tarjetas, foco al saltar y limpieza de estilos al revertir.

## Artefactos y rendimiento

[Clip de revisión](review/phase51/recorrido.webm), capturas en
`review/phase51/` y [medición sintética](review/phase51/performance.json).
El clip se codifica con MediaRecorder nativo a partir de 104 capturas de Chrome,
a 12 fps de muestreo: permite revisar la coreografía, pero **no mide FPS reales**.

La muestra separada registra 239 intervalos entre oportunidades de renderizado
al recorrer la historia en Chrome headless. Los valores de la última ejecución
se guardan en el JSON; no se extrapolan a equipos modestos ni teléfonos físicos.
Se priorizan transformaciones y opacidad, sin filtros grandes, bucles propios
permanentes, biblioteca de smooth scrolling ni dependencias nuevas.

## Pendiente de validación real

- Revisión humana del ritmo con rueda, trackpad y gestos táctiles, especialmente
  el acercamiento y los intervalos de lectura.
- Teléfonos físicos con barras de navegador dinámicas y equipos de baja gama.
- Safari/iOS y Firefox; la verificación visual realizada usa Chrome headless.
- Prueba manual con lector de pantalla y zoom del navegador. Se comprobaron
  mecánicamente semántica, foco y estados accesibles, no un lector real.

Estos límites no se sustituyen por las cifras sintéticas ni por las capturas.
