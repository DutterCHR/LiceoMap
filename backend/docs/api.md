# Contrato público v1

Base remota: `https://<servicio>.onrender.com`. Todas las lecturas devuelven `application/json; charset=utf-8`. El cliente web debe estar en `CORS_ALLOWED_ORIGINS`; Android y otros clientes sin `Origin` pueden consultar normalmente. CORS no reemplaza autenticación y esta información es pública.

## Cursos

`GET /api/v1/cursos`:

```json
{"data":[{"id_curso":"T1","nombre":"Curso de prueba uno","nivel":null,"letra":null}],"meta":{"limit":500}}
```

Los IDs admiten de 1 a 10 letras ASCII, dígitos, `_` o `-`. Usar IDs devueltos por el catálogo; no enviar RUT ni inferir matrícula. Los IDs se comparan con la collation de la tabla; los clientes deben conservar su representación original.

## Anuncios

`GET /api/v1/cursos/T1/anuncios?limit=20&offset=0`:

```json
{
  "data": [{
    "id_anuncio": 1,
    "id_curso": "T1",
    "titulo": "Primer anuncio ficticio",
    "contenido": "Contenido de prueba con acentos: orientación.",
    "fecha_publicacion": "2020-01-01T12:00:00Z"
  }],
  "meta": {"curso":"T1","limit":20,"offset":0}
}
```

Se ordena por fecha descendente y luego ID descendente. `publicado=0`, fechas futuras y cursos inactivos no se devuelven. Un borrador o anuncio de otro curso no se puede leer por ID. El detalle usa `/api/v1/cursos/T1/anuncios/1` y devuelve `data` como objeto, sin paginación. La paginación por offset puede variar si aparecen anuncios entre solicitudes; no representa una instantánea.

`titulo` y `contenido` son texto plano. En web usar `textContent`, no `innerHTML`; Android debe mostrar texto sin ejecutar HTML. No se devuelven autor, usuario, hashes ni RUT.

## Horarios

`GET /api/v1/cursos/T1/horarios?dia=1`:

```json
{
  "data": [{
    "id_horario":1,"id_curso":"T1","dia_semana":1,
    "hora_inicio":"08:00:00","hora_fin":"09:00:00",
    "id_materia":1,"materia":"Materia ficticia",
    "id_espacio":"TEST_ROOM","espacio":"Sala de prueba"
  }],
  "meta":{"curso":"T1","dia":1,"limit":500}
}
```

1=lunes, 7=domingo. Sin `dia` devuelve la semana completa (`meta.dia=null`). Orden por día, hora e ID. Las horas son horas civiles del establecimiento en `America/Santiago`, no timestamps UTC. Materias/espacios inactivos se omiten. No se muestra identidad de profesores. Cursos y horarios se limitan a 500 registros por respuesta; para escalas mayores se deberá agregar paginación antes de usarlos como exportación completa.

## Salud, errores y métodos

`GET /health/live` y `/health/ready` devuelven únicamente `{"status":"ok"}` con 200. Readiness devuelve 503 si falla conexión, TLS, permisos o columnas necesarias; no revela host, versión, excepción ni contraseña. Liveness no comprueba la BD.

```json
{"error":{"code":"INVALID_PARAMETER","message":"Número fuera del rango permitido.","request_id":"identificador-opaco"}}
```

| Estado | Códigos principales |
| --- | --- |
| 400 | `INVALID_PARAMETER` |
| 403 | `ORIGIN_DENIED`, `PREFLIGHT_DENIED` |
| 404 | `NOT_FOUND`, `COURSE_NOT_FOUND`, `ANNOUNCEMENT_NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED` |
| 426 | `HTTPS_REQUIRED` |
| 503 | `SERVICE_UNAVAILABLE` |

`X-Request-Id` permite correlación sin mensajes de BD. En un fallo previo al arranque puede faltar ese ID. HEAD tiene el mismo estado y cabeceras que GET, sin cuerpo. Preflight OPTIONS solo permite GET/HEAD y cabeceras Accept/Content-Type; no hay cookies, Authorization ni credenciales CORS. No se envía `Access-Control-Allow-Origin: *`.

## Integración web y Android

El archivo `examples/api-client.js` permite usar el contrato desde el panel sin cambiar su diseño:

```js
import { createLiceoMapClient } from './api-client.js';
const api = createLiceoMapClient('https://<servicio>.onrender.com');
const { data } = await api.announcements('T1');
// Presentar data usando textContent y manejar listas vacías/errores.
```

El panel existente sigue siendo una demo; M09 no conecta sus botones de administración ni convierte localStorage en credencial. La integración efectiva de la interfaz queda para un módulo posterior con autenticación real.

En Android usar permiso INTERNET y una URL HTTPS de configuración de la aplicación, un cliente HTTP/Retrofit y DTOs equivalentes al JSON. Nunca instalar credenciales MySQL, CA de la BD ni DSN en el APK. El APK se comunica únicamente con la API. No se habilita tráfico HTTP remoto ni se cambia el diseño Android en este módulo.
