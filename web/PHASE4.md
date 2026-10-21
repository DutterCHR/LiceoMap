# Fase 4 — Cinemática sincronizada al scroll

Los ajustes posteriores de escala, nitidez y composición están documentados
en `PHASE4.1.md`.

Rama: `feature/web-cinematic-intro`. Cambios de proyecto limitados a `web/`.
Los documentos PHASE2 y PHASE3 describen estados históricos; este documento
describe la experiencia vigente.

## Inspección de las imágenes, anterior a los cambios

| Archivo disponible | Formato real | Dimensiones | Contenido verificado / uso |
| --- | --- | --- | --- |
| home.png | JPEG | 691 × 1536 | Inicio, próxima clase y accesos rápidos; datos ficticios |
| anuncios.png | JPEG | 691 × 1536 | Comunidad al día; categorías y comunicados de demostración |
| login.png | JPEG | 691 × 1536 | Acceso/demo; se conserva, no se presenta como horario |
| logo.png | JPEG | 1254 × 1254 | Logo LM; sustituye todas las referencias al logo retirado |
| mapa.png | PNG | 1080 × 2400 | Captura anterior del plano, bloques y pasillos; referencia visual |

Las extensiones de los cuatro primeros archivos son .png, pero sus bytes
son JPEG; se identificaron por sus cabeceras reales y se inspeccionaron
visualmente. No se reescribieron ni eliminaron estos originales.

No hay una captura actual de horario completo ni de búsqueda de salas.
La escena de horarios utiliza Inicio, que sí contiene la próxima clase;
no se atribuye a login.png una función que no muestra. La escena de salas
utiliza el plano disponible, identificado como captura de referencia.
No hay SVG del plano en los recursos existentes. Las referencias activas a
imágenes eliminadas se sustituyeron y se comprueban automáticamente.

Se conserva la imagen completa, incluidas las barras Android de las nuevas
capturas. El marco no añade otro notch ni barras de sistema. `object-fit:
contain`, el aspecto reservado y las dimensiones intrínsecas evitan deformar
la interfaz. Las tres capas de pantalla se reutilizan en todo el recorrido:
Inicio se prioriza, las demás imágenes se cargan bajo demanda y se anticipan
al activar la experiencia. El logo utiliza el recurso nuevo.

## Composición y control

GSAP y ScrollTrigger **3.15.0** se distribuyen localmente en `web/vendor/`,
con sus avisos de licencia intactos. Los dos bundles suman 117 502 bytes sin
comprimir. No requieren un CDN, npm en producción ni modificar package.json.
No se incorporan React, Three.js, Blender ni un motor de scroll adicional.

Una sola línea de tiempo y un único ScrollTrigger (`liceomap-cinema`)
controlan el escenario. Se sustituyó el controlador nativo de fase 3; no
quedan su listener de scroll ni su bucle de interpolación. El navegador
conserva el desplazamiento nativo. `pin` mantiene un viewport ocupado por
la composición y `scrub: true` vincula el estado exactamente al scroll, sin
inercia posterior ni reproducción autónoma. El avance, retroceso y parada
se comprueban en navegador.

Referencia de API utilizada: [documentación oficial de ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

El teléfono entra desde 100vh por debajo de la pantalla al terminar el
loader. Su entrada usa una capa independiente y se asienta al comenzar a
desplazarse. Durante el recorrido gira en tres ejes, se desplaza lateralmente,
se acerca y recupera una escala equilibrada. Las tarjetas aparecen y salen
en la misma línea de tiempo, alternando lados. Las pantallas se funden entre
capas, sin cambiar src en mitad del movimiento. La luz ambiental cambia
mediante opacidad y transformaciones de gradientes estáticos, sin filtros
animados. El cierre reduce el teléfono y presenta el plano independiente.

Los botones de escena y los enlaces del menú llevan al tramo correspondiente
del scroll. Se conserva un enlace visible para saltar todo el recorrido.
Las alturas de scroll son 4,5 viewports en escritorio y 3,8 en formato
compacto; todo ese intervalo muestra la composición, sin secciones vacías.

## Fallbacks y protección administrativa

La mejora solo se activa con GSAP + ScrollTrigger, movimiento permitido y
al menos 600 px de altura. En dispositivos compactos se reducen los giros
y acercamientos y se reorganizan las tarjetas. En movimiento reducido,
paisajes muy bajos, ausencia de librerías o JavaScript, el documento conserva
todos los textos, enlaces a capturas y llamadas a la acción en flujo normal.
El cambio dinámico a movimiento reducido revierte la línea de tiempo y retira
el pin-spacer.

Abrir el modal/dashboard desactiva las actualizaciones de ScrollTrigger sin
revertir la geometría del pin (`disable(false)`), evitando saltos de contenido.
Se conservan inert, gestión de foco, bloqueo de overflow y restauración al
cerrar. El recorrido también se suspende al ocultar la pestaña. Los estilos
administrativos y su lógica de formularios, pestañas y selección de archivos
se conservan. `app-admin.js` continúa sin cargarse. El panel y la consulta
siguen identificados como demostraciones, sin autenticación ni persistencia.

## Comprobaciones

```text
node --check web/app.js
node --check web/story.js
node --check web/tests/phase2.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/story.test.cjs
node web/tests/phase2.cjs
git diff --check
```

El archivo phase2.cjs se mantiene como entrada de regresión, actualizado a
fase 4. Chrome comprueba la versión local, un solo pin-spacer, recorrido
completo, cambios de postura entre escenas, pose detenida, reversibilidad
exacta y fundido simultáneo de pantallas. También cubre loader, Saltar,
timeout, foco, dashboard, formularios, pestañas y teclado, selección CSV,
consulta RUT, menú, responsive, movimiento reducido dinámico, ausencia de
JavaScript, fallo del script decorativo y fallo de ScrollTrigger.

La validación de recursos comprueba formato/dimensiones reales, archivos
locales, anclas, IDs, UTF-8 estricto y acentos mediante escapes Unicode.
Leaflet mantiene su implementación y se comprueba con callbacks deterministas
y fallback sin CDN. La prueba de navegador guarda capturas en un perfil
temporal aislado y bloquea peticiones externas.

Resultado final: sintaxis JS, integridad de recursos, UTF-8/acentos, ciclo
loader/celular, regresión Chrome y `git diff --check` aprobados. Se verificó
la reconstrucción de un único pin al cambiar entre escritorio y tablet, sin
dejar pin-spacers duplicados. Se revisaron capturas de escritorio, las cinco
escenas, fundido, tablet, móvil y panel administrativo. Los IDs administrativos
y la implementación Leaflet se compararon con HEAD y se conservaron. Los
bundles locales son idénticos, byte a byte, al paquete instalado 3.15.0.

## Pendientes

- Incorporar las capturas actuales de horario completo y Salas/Mapa cuando
  estén disponibles; no se inventaron ni generaron interfaces.
- Sustituir el plano de referencia por el recurso SVG real si se aporta.
- Validar tacto y continuidad de movimiento en móviles físicos, Safari y
  Firefox. No se midieron FPS ni memoria en hardware de 4 GB.
- Validar mosaicos Leaflet, fuentes e iconos externos en línea; la regresión
  automatizada bloquea esas peticiones.
- El video de referencia no está adjunto en esta conversación: la composición
  responde a la descripción de giros, acercamientos y tarjetas alrededor del
  teléfono, sin afirmar una reproducción exacta del video.
