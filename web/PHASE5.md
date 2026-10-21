# Fase 5 — Historia, propósito y visión de LiceoMap

Trabajo local en `feature/web-cinematic-intro`. Todos los cambios están en
`web/`. Sin cambios de rama, commits, push, merge ni publicación.

## Experiencia

Se integró el antiguo bloque del proyecto y se sustituyó el mapa geográfico
público por una narrativa continua dentro de `#proyecto`. El enlace «Saltar
recorrido» sigue llegando a ese destino. Una navegación de capítulos permanece
visible durante la lectura y señala el capítulo actual con `aria-current`.

1. **La idea / ¿Qué es LiceoMap?** Una apertura editorial con tipografía grande,
   líneas progresivas y una composición de palabras. Explica el proyecto de
   plataforma web y móvil y su enfoque en orientación espacial, organización de
   información escolar y comunicación para estudiantes y docentes.
2. **El desafío.** Tres situaciones cotidianas, representadas por tarjetas que
   entran con distintos desplazamientos y una inclinación máxima de 1,1° hasta
   quedar alineadas. Sin estadísticas, testimonios ni resultados inventados.
3. **El objetivo.** Un diagrama conecta LiceoMap con Orientación, Organización y
   Comunicación. El trazado y los nodos avanzan con el scroll. Los pilares se
   presentan como objetivos que guían el desarrollo y su integración futura.
4. **La visión.** Sitúa el origen en el Liceo Bicentenario de Excelencia Antonio
   Varas de la Barra, Arica. La adaptación a otros establecimientos está
   identificada como visión futura aún no implementada. El cierre enlaza con la
   consulta RUT existente y explica que usa datos de ejemplo.

La nueva sección tiene desplazamiento nativo: no incorpora otro pin, bloqueo de
scroll ni secuencias que deban terminar para continuar leyendo. Las animaciones
usan `scrub: true`, sin interpolación temporal posterior al desplazamiento.
Al subir se recupera el mismo estado; al detenerse se conserva la composición.
Las entradas terminan antes de la pausa de lectura de cada composición.

## Archivos y conservación

- `index.html`: narrativa semántica de cuatro capítulos; navegación pública y
  footer apuntan a `#proyecto`; se retiraron las dos dependencias CDN de Leaflet.
- `style.css`: reglas nuevas con prefijo `purpose-`, adaptación móvil y fallback
  para movimiento reducido. Se eliminaron las reglas exclusivas del proyecto
  anterior y del mapa público. Se conservaron los estilos compartidos de la demo.
- `purpose.js`: controlador independiente con GSAP y ScrollTrigger locales ya
  existentes. Se carga después de `app.js` para medir la narrativa después de
  crear el pin del recorrido aprobado. No modifica ni llama a su coreografía.
- `app.js`: únicamente se retiró la inicialización del mapa geográfico público.
- `tests/phase5.cjs`: auditoría de Chrome a través del arnés CDP existente.
- `tests/phase5-integrity.cjs` y `tests/fixtures/phase5-integrity.json`: hashes
  registrados **antes de editar** para comprobar los segmentos conservados.
- `tests/phase2.cjs`: entrada `--phase5`, sustitución de pruebas del Leaflet
  eliminado y errores explícitos ante cierre o timeout del navegador/CDP.
- `tests/phase45.cjs`: opción `--phase5-integrity` para utilizar la preservación
  por segmentos en la auditoría anterior. La prueba por fotogramas sigue siendo
  la misma; los fixtures históricos no se reescribieron.

`story.js` permanece idéntico. También se conservan íntegros el HTML/CSS del
recorrido, loader, entrada del celular y sus controles; el código de navegación;
el HTML y código de la demo RUT y administración; las capturas y las fuentes.
El hash del footer normaliza exclusivamente el enlace del mapa retirado.
La comparación de CSS administrativo omite exclusivamente `.map-status`, ahora
sin uso. `app-admin.js`, que no está cargado en este documento, sigue intacto.

El panel mantiene sus pestañas, formularios de comunicados y salas, controles
de mapas, selección de archivos, sincronización demostrativa y búsqueda de
usuarios. No se alteraron sus capacidades ni su carácter demostrativo.

## Recursos

Se inspeccionaron los recursos locales: `logo.png`, `home.png`, `mapa.png`,
`anuncios.png` y `login.png`, además de las fuentes y los vendors. Son el logo
y capturas de interfaces; no se presentan como fotografías del establecimiento.
`mapa.png` y la función de orientación del recorrido permanecen disponibles.

La nueva experiencia utiliza CSS, tipografía Outfit/Plus Jakarta Sans locales y
SVG sencillos. No se añadieron fotografías, bibliotecas ni peticiones de mapas.
El gráfico del origen es simbólico y no representa un plano del establecimiento.

Junto a `.purpose-origin-art` hay instrucciones HTML para sustituirlo después
por una fotografía oficial o autorizada, con figura `.purpose-school-photo`,
texto alternativo, dimensiones reales, carga diferida, crédito y autorización.
Sus estilos están preparados y el contenido funciona sin esa fotografía.

## Accesibilidad y rendimiento

- HTML completo y visible por defecto. Sin JavaScript, GSAP, ScrollTrigger o
  `purpose.js`, los capítulos, enlaces y contenido siguen presentes y legibles.
- `gsap.matchMedia()` adapta el movimiento y revierte sus contextos al cambiar
  a `prefers-reduced-motion: reduce`. CSS también fuerza visibilidad y ausencia
  de transformaciones en los elementos animados con esa preferencia.
- En móvil las tarjetas se leen en una columna, sin inclinación; cada entrada
  tiene un rango propio. El diagrama pasa a una conexión vertical con CSS.
- Las entradas de párrafos parten de opacidad 0,72; nunca se oculta información
  con `display`, `visibility`, `aria-hidden` o `inert` en la nueva narrativa.
- Enlaces nativos con foco visible, capítulos con títulos asociados, listas
  semánticas y gráficos decorativos excluidos del árbol accesible.
- No hay bucles propios de `requestAnimationFrame`, listeners de scroll,
  filtros, desenfoques, fotografías nuevas ni animaciones ambientales continuas.
  Se animan transformaciones, opacidad y el trazado SVG. La iluminación utiliza
  gradientes estáticos cuya opacidad varía durante la entrada.
- Los callbacks de navegación actualizan atributos al cruzar capítulos, no en
  cada fotograma. El panel bloquea el scroll como antes, por lo que la nueva
  composición permanece estable mientras está abierto.

## Validación reproducible

Requiere Node 22+ y Chrome o Edge instalado, sin dependencias npm adicionales.
Puede indicarse otro ejecutable con `CHROME_PATH`. Las pruebas bloquean las
peticiones HTTP/HTTPS externas y usan los archivos locales.

```text
node --check web/app.js
node --check web/story.js
node --check web/purpose.js
node --check web/tests/phase2.cjs
node --check web/tests/phase5.cjs
node --check web/tests/phase5-integrity.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase5-integrity.cjs
node web/tests/phase2.cjs --phase5
node web/tests/phase2.cjs
node web/tests/phase2.cjs --phase45-verify --phase5-integrity
git diff --check
```

La auditoría específica cubre 1440×900, 1280×720, 768×1024, 390×844 y 320×720:
cuatro estados de entrada por capítulo, ida/vuelta, pausa y recorrido de todas
las composiciones inferiores. Comprueba geometría, tarjetas sin superposición,
ausencia de recortes y desbordamientos, destinos de enlaces, navegación nativa
de capítulos, indicador activo y fondo estable al abrir administración.

También comprueba movimiento reducido dinámico, limpieza de estilos inline,
reactivación del movimiento y documentos con cada dependencia bloqueada o
JavaScript desactivado. Solo el recorrido original tiene un pin.

La regresión general comprueba el recorrido, escenas y crossfades, scroll
reversible, loader, menú, foco, acceso administrativo, todas sus pestañas,
formularios de comunicados y salas, archivo de ejemplo, sincronización demo,
búsqueda de usuarios, RUT válido/inválido y fallbacks accesibles.

La auditoría de fase 4.5 muestrea la entrada natural y las recargas en escritorio
y móvil, verificando una única aparición del teléfono, sus fotogramas, duración
y curva originales, sin aparición prematura durante el fundido del loader.

**Resultado final:** todas las comprobaciones anteriores finalizaron
correctamente. Se revisaron visualmente las capturas de los cuatro capítulos
en escritorio y móvil, el fallback sin JavaScript, el recorrido original y el
panel administrativo. La auditoría del teléfono registró **2267 muestras en
seis cargas/recargas, incluidas 222 durante el fundido: cero apariciones
prematuras y una sola entrada por carga**.

Durante la validación se corrigieron el orden de inicialización respecto del
pin anterior, la preparación/reversión de las líneas de titulares y los
espacios entre palabras al ocultar saltos de línea en móvil. El arnés espera
la aplicación efectiva de la preferencia de movimiento, en lugar de asumir
que siempre ocurre en dos fotogramas. No se cambió el controlador del celular.

Artefactos temporales de las ejecuciones finales (pueden desaparecer al limpiar
Temp):

- Nueva narrativa, informe y capturas:
  `C:\Users\JOSU~1\AppData\Local\Temp\liceomap-phase2-1rktlm`.
- Regresión general y panel:
  `C:\Users\JOSU~1\AppData\Local\Temp\liceomap-phase2-BbR76v`.
- Auditoría por fotogramas del celular y loader:
  `C:\Users\JOSU~1\AppData\Local\Temp\liceomap-phase2-0SLhOq`.

## Límites

La revisión visual utiliza capturas de Chrome headless y las pruebas emulan
tamaños de pantalla; no equivalen a una sesión manual en teléfonos físicos.
No se promete una tasa de FPS ni se ha probado en hardware de baja gama real.
Los formularios siguen siendo demostrativos y no autentican ni persisten datos.
Chrome necesitó ejecutarse fuera del sandbox: dentro de él falló el proceso
gráfico con acceso denegado. El arnés ahora informa ese cierre como error, en
lugar de terminar sin haber completado las comprobaciones.
