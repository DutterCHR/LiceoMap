# Diseño del CRUD de anuncios: no implementado en HTTP

El CRUD es un contrato de trabajo futuro. No existe bandera para activarlo, no hay credenciales demo y el backend no reconoce sesiones de localStorage. Ninguna ruta administrativa descrita aquí está registrada en el router M09.

## Operaciones futuras

| Método y ruta prevista | Comportamiento futuro |
| --- | --- |
| GET `/api/v1/admin/anuncios?curso=T1` | Listar borradores/publicados con paginación y autorización por curso |
| POST `/api/v1/admin/anuncios` | Crear anuncio; borrador por defecto; autor derivado de la identidad autenticada |
| GET `/api/v1/admin/anuncios/{id}` | Leer para edición, incluyendo estado y versión |
| PATCH `/api/v1/admin/anuncios/{id}` | Editar campos permitidos; control de concurrencia y permiso de publicación |
| DELETE `/api/v1/admin/anuncios/{id}` | Retirar publicación (`publicado=0`), conservando registro y auditoría |

El read público ya existe en M09; el read administrativo es diferente porque incluye borradores. El borrado físico requeriría una política de retención posterior, no se incluye en este diseño.

## Validación y servicio propuestos

- Crear: `id_curso`, `titulo`, `contenido` y opcional `fecha_publicacion` UTC. Rechazar campos desconocidos. `titulo` entre 1 y 150 caracteres Unicode después de trim; `contenido` entre 1 y 10.000 caracteres Unicode y dentro del límite de bytes de TEXT; cuerpo JSON máximo 64 KiB. Publicación solo mediante permiso explícito. No aceptar `id_autor` del cliente.
- Editar: misma validación, sin reasignar autor ni curso arbitrariamente. Una fecha debe ser RFC3339 y se normaliza a UTC antes de PDO. Texto plano, sin HTML ejecutable.
- Comprobar curso activo, pertenencia/autorización e identidad en servidor. Una sesión válida sin permiso no basta. El rol `alumno` no escribe. Definir con el establecimiento los permisos de UTP/dev/profesor y su alcance por curso; los roles existentes por sí solos no acreditan identidad ni alcance.
- Separar un futuro `AnnouncementService` (reglas y transacción) de `AnnouncementWriteRepository` (INSERT/UPDATE preparados). Evitar asignación masiva y mantener la cuenta de lectura actual sin permisos de escritura.
- Concurrencia: proponer una migración aditiva `version INT UNSIGNED NOT NULL DEFAULT 1`, comparar versión recibida (`If-Match`) y actualizar con `WHERE id_anuncio=:id AND version=:esperada`; aumentar versión; 409 si otro administrador ya editó. `actualizado_en` tiene precisión insuficiente para ser un bloqueo fiable por sí solo. La migración de versión no se aplica en M09.
- Retiro: UPDATE preparado de `publicado=0` y aumento de versión dentro de una transacción; registrar quién, cuándo y qué cambió sin copiar secretos ni datos personales innecesarios. Antes de activar el CRUD, agregar tabla de auditoría con migración aditiva y garantizar atomicidad entre cambio y auditoría.

## Condiciones obligatorias antes de registrar rutas

1. Autenticación real con verificación de `password_hash` o proveedor de identidad acordado; recuperación segura, expiración, revocación y controles de fuerza bruta. No usar hashes/usuarios de ejemplo del SQL original.
2. Autorización en servidor por rol, operación y curso, verificada en cada petición; pruebas con usuarios sin permiso y acceso a IDs ajenos.
3. Sesiones web con cookies Secure/HttpOnly/SameSite y protección CSRF si se elige ese mecanismo; tokens Android validados y con vencimiento si se elige un mecanismo de tokens. Resolver esta elección antes de implementar; CORS no la resuelve.
4. Cuenta de escritura de mínimo privilegio, transacciones, auditoría, control de concurrencia y validación completa del JSON.
5. Pruebas de integración de 401/403, creación, edición, retiro, conflictos, CSRF/revocación según el mecanismo elegido y ausencia de filtraciones.

M09 se entrega con esas operaciones inaccesibles. La demo de autenticación del web original no satisface ninguna de estas condiciones.
