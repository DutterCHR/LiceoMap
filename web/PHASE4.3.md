# Fase 4.3 — Coreografía narrativa y tipografía

Rama comprobada: `feature/web-cinematic-intro`. Cambios exclusivamente en
`web/`, conservando los cambios previos del usuario. Sin commits, cambios de
rama ni operaciones remotas de Git.

## Diagnóstico y coreografía

En 4.2 las cinco escenas compartían X = 0 y rotaciones de 0°. El pequeño
pulso de escala no cambiaba la composición. Se mantuvo la arquitectura y se
ajustó su línea de tiempo GSAP/ScrollTrigger **3.15.0**:

1. Se retiran tarjetas y textos anteriores antes del cruce.
2. El teléfono se desplaza con aceleración/desaceleración suaves, un giro
   lateral de hasta 3° y un acercamiento limitado por el espacio disponible.
3. Cambia la pantalla mediante un fundido real entre capturas, sin cambiar src.
4. Entran el titular por líneas, la explicación y la tarjeta, escalonados.
5. El teléfono termina frontal y quieto para leer. El scroll detenido conserva
   el estado y al retroceder se reproduce la misma coreografía en sentido inverso.

Salas combina teléfono a la izquierda y contenido a la derecha. Horarios
invierte la composición. Anuncios vuelve cerca del centro, con contenido a
ambos lados y etiquetas de noticias/comunicados en su tarjeta. El cierre
distribuye mensaje y CTA a la izquierda, plano en una columna propia y teléfono
a la derecha. En compacto el teléfono permanece centrado y el plano final se
muestra dentro de su pantalla, como en 4.2.

La entrada espectacular del loader permanece intacta en `app.js`. La capa
WAAPI `.phone-entrance` termina en identidad sobre la postura inicial frontal
de `.phone-story`. Esta última sigue teniendo un solo controlador: la línea
de tiempo de scroll. Se conserva un único pin y scroll nativo con `scrub: true`.

## Límites y medidas

`STORY_MOTION` centraliza postura, posiciones, giro, escala, recorridos y
duraciones. El desplazamiento base de escritorio es el 9.5 % del viewport,
limitado a **100–140px** respecto al centro. Los factores por escena son
`[0, -1, 1, .18, 1]`.

| Lectura | X en 1280 × 720 | X en 1440 × 900 |
| --- | ---: | ---: |
| Inicio | 0px | 0px |
| Salas | −121.6px | −136.8px |
| Horarios | +121.6px | +136.8px |
| Anuncios | +21.9px | +24.6px |
| Cierre | +121.6px | +136.8px |

El cruce completo Salas → Horarios mide **243.2/273.6px** en esos tamaños,
porque conecta posiciones opuestas. No se confunde ese recorrido con el
desplazamiento individual respecto al centro. La rotación de transición
alcanza **±3° en Y**; X/Z permanecen en 0°. Todas las lecturas vuelven a 0°.

El zoom solicitado se limita a **1.06** sobre la escala CSS de lectura 1.
El encaje geométrico lo reduce cuando hace falta: el máximo efectivo medido
es **1.0386 en 1280 × 720** y **1.06 en 1440 × 900**. En móvil X y las
rotaciones permanecen en 0; escala/altura se ajustan al espacio entre titular,
tarjeta y controles. No se fuerza un zoom cuando no cabe.

Alturas de lectura medidas en Chrome, redondeadas a píxeles CSS:

| Resolución | Inicio | Salas | Horarios | Anuncios | Cierre |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280 × 720 | 494 | 494 | 494 | 494 | 494 |
| 1440 × 900 | 636 | 636 | 636 | 636 | 636 |
| 390 × 844 | 408 | 419 | 419 | 419 | 398 |
| 320 × 720 | 334 | 313 | 313 | 313 | 257 |

Se conservan o aumentan los tamaños de 4.1 y 4.2 en las cuatro resoluciones.
Las capturas originales, su proporción y `object-fit: contain` permanecen
intactos. No hay filtros de enfoque/desenfoque nuevos ni escalado del texto
HTML durante sus animaciones.

Las tarjetas entran con hasta 28px horizontales en escritorio y 8px verticales;
en móvil solo 8px verticales. Las líneas del titular recorren 14px y el párrafo
12px. La iluminación usa únicamente opacidad de los gradientes existentes.
No se añaden bibliotecas, bucles permanentes ni listeners de scroll.

## Tipografía, redacción y responsive

Se mantienen **Outfit** para títulos y **Plus Jakarta Sans** para textos. Ahora
se sirven localmente dos WOFF2 variables con licencia SIL OFL 1.1 y
`font-display: swap`: **59,640 bytes** en total. `fonts/README.md` documenta las
fuentes exactas y las licencias originales incluidas. El sitio no depende del
CDN para mostrar la tipografía prevista.

- Titulares de peso 600, tracking moderado, tamaños con `clamp()` y palabras
  clave en menta `#a7eed9`. Las animaciones actúan por líneas completas.
- Párrafos claros con interlineado 1.75; tarjetas con 1.6 en escritorio y
  1.5 en compacto. En móvil los párrafos pasan de 11.52px a 12.8–14.4px;
  también crecen títulos de tarjeta y etiquetas, sin reducir el teléfono.
- Textos más breves que conectan problema, propuesta y beneficio. Se aclara
  la ausencia de búsqueda activa de salas, los datos ficticios de Inicio y
  que esta web no recibe avisos en tiempo real. Se conservan enlaces y CTA.
- Columnas de contenido con flujo vertical en escritorio. Al refrescar se
  reserva el ancho real del teléfono mediante tres variables CSS de layout;
  así el texto y el plano también respetan el espacio en ventanas estrechas.
  Estos cálculos se realizan al inicializar/refrescar, no en cada frame.
- En móvil se mantienen titulares arriba y tarjetas debajo. Se omiten las
  etiquetas decorativas redundantes de Anuncios. En 320px se reduce solo la
  separación entre pasos, manteniendo el tamaño de los botones y un espacio
  superior a 16px hasta «Saltar recorrido».

El contraste calculado para textos narrativos en lectura supera 4.5:1 frente
a una cota conservadora de las superficies más luminosas (`#29465f`);
el mínimo observado es aproximadamente **5.79:1**. Esto no describe los frames
de fundido, donde la opacidad cambia deliberadamente.

## Pruebas

```text
node --check web/app.js
node --check web/story.js
node --check web/tests/phase2.cjs
node --check web/tests/story.test.cjs
node web/tests/story.test.cjs
node web/tests/phone-lifecycle.cjs
node web/tests/phase2.cjs
node web/tests/phase2.cjs --composition --verify-composition --all-sizes
git diff --check
```

La auditoría usa Chrome instalado en modo headless y archivos locales. Comprueba
las cuatro resoluciones solicitadas y **1024 × 900 / 1100 × 720**: 30 posturas
de lectura y 93 puntos intermedios por resolución, repetidos en sentido inverso
(558 de ida y 558 de vuelta). Incluye picos y finales de transición. Compara
exactamente transformaciones del teléfono y estilos de pantallas, líneas y
tarjetas; comprueba límites, tamaño, recortes, superposiciones, separación de
controles, plano de cierre y contraste. Verifica las fuentes realmente usadas
para dibujar glifos mediante el protocolo de Chrome, además de su carga.
Se revisaron visualmente capturas de escritorio, móvil, transiciones y panel.

La regresión funcional verifica loader/Saltar/timeout, continuidad de entrada,
lecturas quietas, reversibilidad, fundidos, un único pin al redimensionar,
modal/dashboard, suspensión durante administración, foco, teclado, pestañas,
formularios, selección CSV, RUT y menú. También movimiento reducido inicial y
dinámico, fallo de scripts decorativos, ausencia de ScrollTrigger y sin JS.
Leaflet se prueba con callbacks controlados y fallback de carga.
Para comparar la entrada en Chrome, la prueba pausa únicamente su animación
WAAPI y avanza al último fotograma; el loader termina de forma natural. Esto
evita perder una animación de 1.35s por la latencia del protocolo. Se comprueba
la finalización mediante su evento real, además de las pruebas de ciclo de vida.

Se verifican referencias locales, IDs, dimensiones de imágenes, integridad
WOFF2/licencias, UTF-8, acentos y versiones fijadas. `git diff --check` no
reporta errores; conserva el aviso previo sobre conversión LF/CRLF.

Evidencias finales en los perfiles temporales de Chrome que imprime la prueba:
`liceomap-phase2-Vp2bIH` (regresión funcional) y `liceomap-phase2-GppR8a`
(capturas, `composition.json` y `motion.json` de las seis resoluciones).

Errores encontrados y corregidos durante la implementación:

- El primer aumento de tipografía restaba espacio al teléfono en móvil:
  se acortaron textos y ajustaron espaciados, manteniendo la letra más grande.
- La entrada vertical de dos tarjetas rozaba los controles inferiores:
  se limitó su recorrido compacto a 8px.
- Las fuentes reales dejaban 14px entre pasos y salida en 320px: el ajuste
  de separación recupera el margen sin reducir los botones.
- En 1024px el plano se solapaba con el teléfono: las columnas ahora reservan
  su ancho real y dejan separación entre plano, tarjetas y dispositivo.
- Chrome bloqueó brevemente `DevToolsActivePort` mientras lo escribía en
  Windows: la prueba reintenta su lectura de forma acotada antes de conectarse.
- Una captura automática de 320px mostró la pantalla vacía, aunque el recurso
  tenía dimensiones naturales. Al esperar su decodificación se obtuvo la
  interfaz correcta. Se adelanta la decodificación asíncrona de las dos capturas
  secundarias durante la introducción, sin esperar para permitir navegación o
  scroll. La auditoría también espera `decode()` y verifica opacidad/visibilidad
  antes de capturar, distinguiendo carga, estado del fundido y renderizado.

## Archivos y protección de funcionalidades

Se modifican `index.html`, `style.css`, `story.js`, `tests/phase2.cjs` y
`tests/story.test.cjs`; se añaden `fonts/` y este informe. `app.js`, el loader,
los scripts del panel, los originales de capturas y las bibliotecas permanecen
sin cambios en esta fase. `app-admin.js` sigue siendo legado no referenciado.

## Limitaciones pendientes

No se midieron FPS/memoria en hardware real de 4GB, tacto en dispositivos
físicos ni Safari/Firefox. Las peticiones externas se bloquean durante las
pruebas; queda por validar el servicio de mosaicos Leaflet online.

Inicio/Anuncios continúan siendo JPEG de 691 × 1536 pese a su extensión PNG.
Para más detalle o DPR 3 se necesitan originales PNG sin pérdidas de al menos
1080px de ancho. No hay captura de horarios completos ni SVG actual en los
recursos disponibles. La consulta RUT y administración siguen siendo
demostraciones y esta fase no incorpora conexión con datos reales.
