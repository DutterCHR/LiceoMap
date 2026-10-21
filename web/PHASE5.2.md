# Fase 5.2 — Lectura y desenlace interactivo

Trabajo en `feature/web-cinematic-intro`, exclusivamente dentro de `web/`.
Se inspeccionó la copia local aprobada de Fase 5.1 y se conservaron los cambios
previos del workspace. No se realizaron commits ni operaciones remotas de Git.

## Diagnóstico y alcance

La composición de Fase 5.1 funcionaba, pero varios tamaños de lectura se habían
reducido para caber en el pin: párrafos de tarjetas móviles de 9,6 px, visión de
11 px y explicaciones de escritorio entre 12 y 16 px. La demostración posterior
era un formulario independiente. Además, su mensaje de éxito elegía un curso
al azar y decía «estudiante detectado» pese a no consultar una institución.

Se conservaron los titulares, textos y coreografías narrativas. Los cambios de
tamaño de tarjetas, separación y espacio del gráfico responden a las nuevas
medidas tipográficas; mantienen las mismas composiciones y trayectorias.

## Tipografía

Se mantienen Outfit para títulos y Plus Jakarta Sans para lectura e interfaz,
ambas locales. No se modificaron las fuentes ni se añadieron dependencias.

| Uso | Ajuste |
| --- | --- |
| Explicación principal en escritorio | 17–19 px, interlineado 1,65–1,75 y longitud máxima de 43–58 caracteres aproximados por línea. |
| Tarjetas en escritorio | Párrafos de 15,5–16 px, títulos de 22–29 px y etiquetas con más contraste. |
| Explicación principal en móvil | 16 px; visión a 15 px, con interlineado 1,55. |
| Tarjetas en móvil | Párrafos de 14–15 px y títulos de 17 px, conservando la disposición vertical. |
| Etiquetas y textos auxiliares | Jerarquía propia, sin igualarlos al cuerpo principal; mayor tamaño y contraste. |
| Cierre | Titular con `clamp()`, párrafos de 17–19 px en escritorio y 16 px en móvil. |

Se corrigió también un padding móvil heredado de `.app-preview-box` que
estrechaba el contenido y partía «Tu información.» de forma poco natural.

La separación vertical de tarjetas compactas pasa a una variable CSS que la
timeline consulta al inicializar o refrescar sus valores, sin lecturas de layout
en cada fotograma. Se reservó espacio adicional para las explicaciones.

Para evitar recortar los textos ampliados, la narrativa utiliza su fallback
semántico de lectura natural cuando la pantalla compacta tiene menos de 820 px
de alto, o es de hasta 360 px de ancho y menos de 960 px de alto. El escritorio
mantiene el umbral anterior de 720 px. El recorrido inicial conserva su propio
comportamiento; el vuelo y la narrativa cinematográfica permanecen activos en
escritorio y en los móviles con espacio suficiente, como 390×844.

## Continuidad visión → demostración

La timeline maestra del recorrido conserva su duración de 25,2 unidades y su
pin. No se añade otro pin ni distancia de scroll al recorrido aprobado.

El nuevo ScrollTrigger `liceomap-finale` recorre la entrada natural de
`#app-preview`: desde `top bottom` hasta `top 80px`, con `scrub: true`.
Mientras la visión sale por arriba:

- El gráfico de comunidades converge mediante una **envoltura nueva**,
  `.purpose-origin-outro`. La escala del gráfico interior sigue perteneciendo
  únicamente a la timeline original.
- Capas de opacidad cambian la iluminación hacia el azul oscuro del cierre.
  Gradientes complementarios a ambos lados de la unión suavizan la frontera.
- Aparecen las líneas «Tu curso. Tu información. Tu lugar.», con traslación
  vertical y opacidad; las letras conservan su proporción.
- `.demo-interface-reveal` entra con desplazamiento moderado y escala 0,96 → 1.
  Termina en una posición estable y continúa con el flujo nativo.

La entrada es reversible y no inicia la simulación. En móvil, el titular y la
interfaz se leen sucesivamente mediante desplazamiento natural, sin fijarlos
juntos dentro de una pantalla insuficiente.

## Demostración en tres momentos

1. **Identificación de ejemplo.** Perfil ficticio `LM-DEMO-03`, botón «Ver
   demostración» y explicación de que no hace falta escribir un RUT.
2. **Proceso ilustrativo.** Una timeline GSAP finita de 1,05 s recorre perfil,
   validación ilustrativa y consulta institucional simulada. Se indica que no
   se verifica una identidad ni se conecta a sistemas del liceo. «Omitir
   animación y ver resultado» permite terminar inmediatamente.
3. **Curso de ejemplo.** Siempre muestra **3° Medio A**, con etiqueta de datos
   ficticios y aviso de que no se ha asignado un curso real. La confirmación
   utiliza una entrada de 0,28 s. Puede repetirse.

La interacción anima nodos interiores distintos de la envoltura controlada por
scroll. No hay dos controladores escribiendo la misma transformación.
Los tres estados comparten una celda CSS grid: las vistas ocultas reservan su
altura, manteniendo la tarjeta estable. Permanecen con visibilidad oculta e
`inert`, fuera del foco y del árbol accesible, comprobado en Chrome.

La animación se pausa al abrir el panel administrativo mediante una observación
de su clase de estado existente; no modifica el panel ni su código. Al cerrar,
continúa. No hay un bucle propio permanente ni esperas artificiales de red.

## Validador y privacidad

El formulario original permanece bajo «Validar el formato de un RUT
(opcional)», con los mismos IDs, formato automático, conservación del cursor,
dígito verificador y estados válido/inválido. La ayuda aclara que no identifica
estudiantes ni consulta matrículas.

`app.js` solo cambia en la eliminación de la lista aleatoria y en el mensaje de
éxito: confirma el formato y presenta el mismo curso fijo de ejemplo. No afirma
haber detectado un estudiante. Las funciones de validación y sus listeners de
entrada se conservaron literalmente.

La simulación no lee el campo RUT. No se añadieron peticiones, endpoints,
persistencia ni registros de identificadores. El campo sigue sin atributo
`name`: tampoco se serializa como dato de formulario por el navegador.

## Accesibilidad y fallbacks

- Botones nativos, foco visible, omisión accesible y foco en el resultado cuando
  el visitante seguía dentro de la simulación. Si ya navegó a otro control, no
  se le roba el foco al completar.
- Región `role="status"` con `aria-live="polite"` y `aria-atomic="true"`;
  `aria-busy` identifica el proceso ilustrativo.
- El validador utiliza `details/summary` nativos y conserva sus etiquetas,
  ayudas y mensajes de error.
- Con movimiento reducido, la simulación llega al resultado inmediatamente.
  Cambiar la preferencia durante el proceso también lo completa y limpia sus
  estilos. El ScrollTrigger del cierre se revierte.
- Sin GSAP, la simulación funciona con cambio directo de estados. Sin
  ScrollTrigger, la interacción GSAP sigue disponible y la entrada queda estática.
- Sin JavaScript se muestra el perfil y un resultado ficticio mediante
  `noscript`, con todos los textos narrativos en flujo natural.
- Las capas de transición son decorativas y no interceptan puntero ni foco.

## Archivos

- `index.html`: envoltura del gráfico de salida, desenlace y tres estados de
  demostración, validador opcional y referencias a los nuevos archivos.
- `purpose.css`: refinamiento tipográfico y reservas de espacio.
- `purpose.js`: separación compacta adaptable y condición de lectura suficiente;
  se conserva la coreografía anterior.
- `finale.css`, `finale.js`: transición final, interfaz, estados y accesibilidad.
- `app.js`: resultado manual fijo y eliminación del curso aleatorio.
- `tests/phase52.cjs`: pruebas visuales, interacción, privacidad y renderizado.
- `tests/phase52-integrity.cjs`, `tests/fixtures/phase52-integrity.json`:
  protección por segmentos registrados **antes de editar** la Fase 5.1.
- `tests/phase2.cjs`: entrada `--phase52` y UTF-8 de los nuevos archivos.
- `tests/phase51.cjs`: reconoce el fallback de lectura estrecho.
- `tests/phase45.cjs`: admite la protección actual con `--phase52-integrity`.
- `review/phase52/`: capturas representativas, informe y medición sintética.

`story.js`, `style.css`, `app-admin.js`, el loader, navegación, footer, panel,
fuentes, vendors y capturas originales permanecen intactos respecto de la Fase
5.1 local. No se tocaron Android, backend ni base de datos.

## Validación

Pruebas ejecutadas con éxito:

```text
node --check web/app.js
node --check web/purpose.js
node --check web/finale.js
node --check web/tests/phase2.cjs
node --check web/tests/phase51.cjs
node --check web/tests/phase52.cjs
node --check web/tests/phase52-integrity.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase52-integrity.cjs
node web/tests/phase2.cjs
node web/tests/phase2.cjs --phase51
node web/tests/phase2.cjs --phase52
node web/tests/phase2.cjs --phase45-verify --phase52-integrity
git diff --check
```

Chrome necesitó ejecutarse fuera del sandbox por restricciones de acceso de su
proceso gráfico. Las pruebas bloquean las peticiones HTTP/HTTPS externas.

La suite nueva cubre 1280×720, 1440×900, 768×1024, 390×844, 320×720 y
375×780. Comprueba lectura y ausencia de recortes en los capítulos fijados,
fallback natural en los tamaños pequeños, cinco puntos de la transición final
y sus estados inversos, inicio por Enter, omisión, repetición, resultado fijo,
estabilidad de altura, validador válido/inválido y modo reducido dinámico.

Se verificó el árbol accesible de Chrome: el botón tiene nombre y el resultado
oculto no se expone antes de tiempo. La prueba de privacidad cuenta operaciones
sin guardar valores: **cero llamadas de red, cero escrituras en almacenamiento,
cero logs y solo los dos submits manuales solicitados por la prueba**. Desplazar
y ejecutar la simulación no envían el formulario.

Los colores de cuerpo comprobados superan una relación de contraste 4,5:1
frente a un fondo ambiental conservador `#2b5555`. Se inspeccionaron también
capturas reales; esta comprobación no constituye una auditoría WCAG completa.

La regresión general conserva todas las pestañas y formularios administrativos,
archivo, búsqueda, sincronización demo, foco, bloqueo del scroll, menú y RUT.
La suite de Fase 5.1 sigue verificando los 36 estados originales, el vuelo,
cobertura, pausa, inversión y fallbacks. La auditoría de entrada registró 2213
oportunidades de renderizado, 222 durante el fundido: cero apariciones
prematuras del teléfono en seis cargas/recargas.

Se inspeccionaron capturas de todos los capítulos, transición intermedia,
identificación, proceso, resultado y validador, en escritorio y móvil. Se
corrigieron padding heredado, unión de fondos, espacio del cierre móvil,
preparación reversible de las líneas y limpieza dinámica de estilos.

## Artefactos y límites

[Resultados](review/phase52/checks.json) ·
[Medición de renderizado](review/phase52/performance.json) ·
[Resultado móvil](review/phase52/390-result.png) ·
[Transición intermedia](review/phase52/1280-finale-0.5.png).

La muestra de renderizado usa 179 intervalos de `requestAnimationFrame` durante
un desplazamiento sintético del desenlace: mediana de 13,9 ms, percentil 95 de
14 ms y ningún intervalo superior a 34 ms. Se conserva la medición exacta en el
JSON; no equivale a FPS garantizados en equipos modestos ni a una comparación
controlada de hardware.

Pendientes de validación real: ritmo con trackpad y gestos táctiles; teléfonos
físicos y equipos de baja gama; Safari/Firefox; zoom elevado y lector de pantalla
real. Se validaron teclado y árbol accesible de Chrome headless, sin afirmar
haber realizado una sesión manual con NVDA o VoiceOver.
