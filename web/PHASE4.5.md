# Fase 4.5 — Aparición única del celular

Rama comprobada: `feature/web-cinematic-intro`. Trabajo exclusivamente en
`web/`, conservando los cambios locales previos. Sin commits ni operaciones
remotas de Git.

## Causa exacta

El celular tenía visibilidad normal y postura de lectura como fallback.
`prepare()` preparaba los textos, pero no ocultaba el celular. La salida del
loader comenzaba a los 3000ms y duraba 550ms. La animación del teléfono se
creaba después de esa salida, en el callback de IntersectionObserver.
Durante el fundido podía verse el teléfono final; después, el primer
fotograma de la animación lo devolvía a opacidad cero y fuera de pantalla.
Además, los scripts diferidos permitían pintar el fallback antes de iniciar
el loader. No había una espera de imágenes/fuentes ni un conflicto entre
los dos controladores de transformaciones.

La captura de diagnóstico anterior al cambio encontró 31 oportunidades de
renderizado durante el fundido en cada viewport con el teléfono todavía
visible antes de su entrada. Registro:
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-XhuhQ6\phase45.json`.

## Corrección mínima

- Un script pequeño en el `head`, antes de las hojas de estilo y scripts
  diferidos, añade `intro-preparing` cuando la introducción es viable.
- Una única regla CSS oculta `.phone-entrance` mediante `visibility` mientras
  existe esa preparación. No modifica medidas, opacidad ni transformaciones.
- El controlador existente crea la misma animación nativa y retira la clase
  después de que exista su primer fotograma de opacidad cero. No se añade
  otro controlador de animaciones ni se modifica `story.js`.
- Saltar, Escape, movimiento reducido, scroll inicial y salidas anticipadas
  liberan la preparación mediante la limpieza existente. Los errores al crear
  la animación o el observador también dejan el teléfono visible.
- Si `app.js` no carga, la preparación expira a los 6s. Si expira antes de
  iniciar la entrada, se utiliza el estado estático y no se lanza después una
  entrada tardía sobre un teléfono que ya fue mostrado. `pagehide` libera la
  clase para no conservarla al regresar por el historial.
- Sin JavaScript no se añade ninguna clase y el HTML estático sigue visible.
  Sin GSAP se conserva la entrada nativa y el documento sin pin.

Se mantienen exactamente los dos fotogramas originales del teléfono,
1350ms de duración y su curva `cubic-bezier(0.16, 1, 0.3, 1)`. Los tiempos
del loader, textos, capturas, dimensiones y escenas posteriores no cambian.

## Archivos de esta fase

- `index.html`: preparación temprana y salida de seguridad.
- `style.css`: una regla de visibilidad durante la preparación.
- `app.js`: liberación atómica al crear la entrada y limpieza de fallbacks,
  únicamente dentro de `initHeroPhone()`.
- `tests/phase2.cjs`: punto de entrada de las comprobaciones 4.5.
- `tests/phase45.cjs`: muestreo por fotogramas, recargas, integridad y fallbacks.
- `tests/phone-lifecycle.cjs`: estados de preparación, errores y expiración.
- `tests/fixtures/phase44-integrity.json`: hashes tomados antes de editar.
- `PHASE4.5.md`: este informe.

La comprobación de integridad confirma que `story.js`, capturas y fuentes
se conservan, y que HTML/CSS permanecen iguales al retirar únicamente los
bloques nuevos marcados 4.5. También verifica que `app.js` fuera de
`initHeroPhone()` no cambió: loader, navegación, Leaflet, RUT y administración.
Los hashes de texto normalizan finales de línea CRLF/LF.

## Pruebas y resultados

```text
node --check web/app.js
node --check web/story.js
node --check web/tests/phase2.cjs
node --check web/tests/phase45.cjs
node --check web/tests/phone-lifecycle.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/story.test.cjs
node web/tests/phase2.cjs --phase45-verify
node web/tests/phase2.cjs
git diff --check
```

Todas finalizaron correctamente. La auditoría usa Chrome real headless y
`requestAnimationFrame`, observando visibilidad del marco y sus capturas,
opacidad, transformaciones, overlay y animaciones nativas activas.

Se comprobaron navegación inicial, recarga y recarga forzada en 1280×720 y
390×844: **1861 muestras, incluidas 174 durante el fundido; cero muestras con
aparición prematura y una sola entrada por carga**. Se verifican los
fotogramas originales, duración, curva y liberación a identidad al terminar.
También pasan la navegación con sección en la URL, la entrada sin GSAP y el
timeout con `app.js` bloqueado. Las capturas finales de ambas resoluciones
se inspeccionaron visualmente.

La regresión general comprueba Saltar, Escape, timeout, continuidad entre
entrada y primera postura, scroll reversible, estado detenido, escenas,
crossfades, resize, menú, panel administrativo, foco, bloqueo de scroll,
pestañas, formularios, archivo de ejemplo, RUT demostrativo, movimiento
reducido dinámico, fallback sin JavaScript y callbacks de Leaflet con red
externa bloqueada. Se verificaron UTF-8 estricto y los acentos de UBÍCATE y
CONÉCTATE.

Resultados por fotogramas y capturas:
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-T0Ri8N`.
Capturas de la regresión general:
`C:\Users\Alumno\AppData\Local\Temp\liceomap-phase2-oGLFnm`.
Los resultados temporales pueden desaparecer al limpiar Temp.

## Límites de la validación

El muestreo observa oportunidades de renderizado y estilos computados en
Chrome headless; no es una grabación del compositor/GPU ni una sesión manual
en Chrome visible. No se promete una tasa de FPS.

ScrollTrigger ya deja `history.scrollRestoration` en `manual`. En estas pruebas
Chrome vuelve a cero al recargar. Se conserva ese comportamiento y se
reproduce explícitamente una posición guardada mediante scroll real para
comprobar que se libera el teléfono sin reproducir la entrada. No se afirma
haber implementado restauración automática del historial.

La primera versión de la prueba usaba un límite absoluto desde navegación;
podía cortar el registro antes de acabar una entrada que arrancaba tarde bajo
carga. Se corrigió para esperar desde el comienzo real de la animación.
No se detectaron fallos pendientes en la aparición del celular. Quedan la
confirmación con una grabación del navegador visible y la disponibilidad
real de los servicios externos de Leaflet, fuera de las pruebas sin red.
