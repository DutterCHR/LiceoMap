# LiceoMap 2.0 — Fase 2

Documento histórico de esa fase. El comportamiento vigente y las pruebas
actualizadas se describen en `PHASE4.md`; la flotación se sustituyó por el
recorrido sincronizado al scroll.

Celular construido con HTML/CSS y Web Animations API, usando `captura de salas de esa fase` sin
modificar la captura. No incorpora dependencias, tarjetas narrativas ni scroll
fijado. Los textos anteriores del sitio permanecen intactos.

El loader mantiene su secuencia y su timeout. Al completar normalmente la
introducción, el celular entra desde abajo y gira durante 1,1 segundos cuando
alcanza el viewport. Después flota 6 píxeles durante tres ciclos de 6 segundos.
La animación se pausa fuera de pantalla o con la pestaña oculta y libera sus
observadores al finalizar. Saltar, Escape, navegación mediante foco, scroll y
timeout dejan el celular estático. No se bloquea el scroll ni se retrasa la
navegación para esperar al celular.

El fallback HTML/CSS muestra la captura y el marco sin JavaScript ni APIs de
animación. Con movimiento reducido no se ejecutan las animaciones del celular
y se elimina su inclinación. La composición usa dos columnas desde 1100 px y
apila el celular debajo del texto en pantallas menores. Profundidad, sombra e
iluminación usan bordes, sombras fijas y gradientes; solo se animan transform
y opacity. No añade filtros animados ni bucles requestAnimationFrame.

## Comprobaciones reproducibles

Desde la raíz del repositorio, con Node 22 o posterior:

```text
node --check web/app.js
node --check web/tests/phase2.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase2.cjs
git diff --check
```

`phone-lifecycle.cjs` comprueba la entrega del loader al celular, las salidas
anticipadas, timeout, entrada al viewport, pausa y reanudación, flotación
limitada, movimiento reducido y limpieza de recursos mediante un DOM simulado.

`phase2.cjs` usa Chrome o Edge instalado, sin paquetes npm. Se puede indicar
otro ejecutable mediante `CHROME_PATH`. Lanza un perfil temporal aislado y
cierra ese proceso al terminar. Comprueba UTF-8 estricto, UBÍCATE, CONÉCTATE,
Saltar, transferencia de foco, timeout con animaciones interrumpidas, menú
móvil, formulario de consulta, apertura/cierre administrativo, movimiento
reducido inicial y dinámico, fallback sin JavaScript y composición responsive
a 320, 390, 768, 1100 y 1440 px. Guarda capturas desktop/mobile en el perfil
temporal cuya ruta imprime. El sandbox de este entorno requiere autorización
para conectar la prueba al navegador local.

La temporización de Chrome headless puede activar legítimamente el fallback
estático; la entrega natural se verifica también con la prueba determinista.
El fondo preexistente del hero tiene una transformación scale(1.08) y se
recorta con overflow: hidden: las comprobaciones de tamaños estrechos miden
los límites visibles del hero y del celular. Se ajusta el tamaño del título
por debajo de 360 px para mantenerlo dentro de la columna disponible.

## Límites de la validación

Resultado final: sintaxis JS, UTF-8, pruebas deterministas, prueba de Chrome
y `git diff --check` aprobados. Se verificó además que la lógica de app.js
desde IntersectionObserver de revelado en adelante coincide con HEAD,
normalizando únicamente finales de línea. Esto cubre que navegación,
Leaflet, formularios y administración conservan su implementación anterior.

Las solicitudes externas se bloquean en la prueba de navegador para comprobar
el fallback local. Esto permite verificar el sitio sin CDN, pero no valida
los mosaicos de Leaflet ni las fuentes e iconos externos en línea. Su lógica
no se ha modificado.

Se revisaron capturas estáticas de escritorio y móvil. Queda validar el ritmo
completo de la transición y el comportamiento táctil en dispositivos reales,
especialmente un equipo con 4 GB de RAM. No se midieron FPS ni consumo de
memoria en hardware de esa capacidad.

En 320 px persiste un ensanchamiento del viewport hasta 367 px originado en
la sección preexistente de consulta (`.app-preview-text` / `.app-mockup-card`),
fuera del hero. No se modificó esa sección. El hero y el celular se comprueban
contra los 320 px solicitados, independientemente de ese problema pendiente.
