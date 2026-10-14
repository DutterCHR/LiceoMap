# LiceoMap M09: API de lectura por Internet

Base PHP 8.2+, PDO MySQL, MariaDB/MySQL y Docker/Apache. No requiere Composer ni frameworks. No se ha desplegado ni probado en Internet. El panel web y Android conservan su diseño y código.

## Inspección y decisiones

- Base: `origin/main`, commit `3f6de33`; rama `feature/online-backend` en un worktree independiente.
- `web/index.html` y `web/app.js` implementan un panel demostrativo y una consulta simulada de curso por RUT. No existe contrato de API ni autenticación real. `web/app-admin.js` es un archivo legado con credenciales simuladas y no aparece como script cargado en el HTML. Esos archivos no se usan como control de acceso.
- `database/database.sql` contiene las nueve tablas existentes, datos de ejemplo y operaciones `DROP TABLE`. **No ejecutarlo sobre una base existente ni importarlo en Aiven.** M09 no cambia ese archivo ni ejecuta sus instrucciones.
- Se reutilizan `cursos`, `anuncios`, `horarios`, `materias` y `espacios`. No se leen usuarios, matrícula, RUT ni hashes desde la API pública. Un anuncio de un curso está disponible a cualquier cliente; el curso no es una autorización.
- El dialecto de las tablas es compatible con MariaDB 10.6+ y MySQL 8.0.16+; `CHECK`, `ENUM`, InnoDB, `utf8mb4_unicode_ci` y `DATETIME DEFAULT CURRENT_TIMESTAMP` no requieren reemplazo destructivo. La comprobación real se ejecutó en MariaDB 11.4.5; MySQL sigue pendiente.
- Se añade únicamente un índice para lecturas de anuncios. No se sustituyen tablas ni columnas. Todas las sesiones PDO usan UTC. Los `DATETIME` existentes deben estar en UTC: si fueron cargados en hora chilena, planificar una migración específica con respaldo; no se convierte información existente automáticamente.

## Estructura y explicación para la defensa

```text
backend/
  public/index.php                única entrada HTTP, único directorio público
  src/bootstrap.php               autoload y variables locales opcionales
  src/Config.php                  configuración por entorno
  src/Database.php                PDO, TLS, utf8mb4 y UTC
  src/Request.php                 parámetros y rangos
  src/Response.php                JSON y cabeceras
  src/HttpError.php               errores HTTP controlados
  src/Application.php             rutas, CORS y flujo de lectura
  src/ReadRepository.php          consultas preparadas y proyección pública
  src/Schema.php                  inicialización vacía y migración aditiva
  bin/console.php                comandos de BD, solo CLI
  database/schema.sql            nueve tablas originales, sin datos ni DROP
  database/migrations/           índice aditivo
  tests/                         pruebas sin BD y HTTP/PDO con fixtures
  examples/api-client.js          cliente web de lectura, sin sesión simulada
  docs/                          contrato, diseño CRUD, despliegue y validación
  docker/                        Apache, PHP y entrada con PORT
  Dockerfile                     imagen PHP/Apache
  compose.yaml                   MariaDB local sin puerto público
  compose.test.yaml              BD de pruebas en memoria, separada
```

Flujo: solicitud → validación HTTPS/CORS/método/parámetros → repositorio → PDO preparado → respuesta JSON. La conexión se abre solo para lecturas o readiness; liveness no depende de la BD. Los detalles técnicos y excepciones de PDO no se devuelven al cliente. Los logs de errores usan identificador de solicitud y clase de error, sin DSN, contraseñas ni parámetros.

## Endpoints activos

| Método | Ruta | Uso |
| --- | --- | --- |
| GET/HEAD | `/health/live` | Proceso disponible, sin consultar BD |
| GET/HEAD | `/health/ready` | Conexión y columnas de lectura disponibles |
| GET/HEAD | `/api/v1/cursos` | Cursos activos, máximo 500 |
| GET/HEAD | `/api/v1/cursos/{curso}/anuncios` | Publicados, fecha no futura; `limit=1..100`, `offset=0..100000` |
| GET/HEAD | `/api/v1/cursos/{curso}/anuncios/{id}` | Detalle publicado perteneciente al curso |
| GET/HEAD | `/api/v1/cursos/{curso}/horarios` | Horario semanal; `dia=1..7` opcional; máximo 500 |
| OPTIONS | Las rutas anteriores | Preflight para origen autorizado y método GET/HEAD |

No hay login ni rutas administrativas. POST/PUT/PATCH/DELETE a rutas existentes devuelve 405; rutas administrativas inexistentes devuelven 404. Parámetros desconocidos, repetidos o con formato de array devuelven 400. Curso ausente/inactivo devuelve 404; curso sin horarios/anuncios devuelve `data: []`.

Contrato y ejemplos: [docs/api.md](docs/api.md). CRUD futuro: [docs/admin-crud.md](docs/admin-crud.md).

## Arranque local con PHP y una MariaDB ya instalada

Requiere PHP 8.2+ con `pdo_mysql`, MariaDB 10.6+ o MySQL 8.0.16+. Desde este worktree:

```powershell
cd backend
Copy-Item .env.example .env
```

Completar `.env` con una contraseña nueva y un usuario propio. `DB_PASSWORD` nunca queda en Git. El cargador admite `CLAVE=valor`, comillas opcionales, líneas vacías y comentarios completos; no expande variables ni comentarios al final de línea. Las variables del proceso tienen prioridad. `.env` está fuera de `public/` y no entra al contexto Docker.

Para una base existente: respaldar fuera de Git, comprobar que coincide con las columnas del SQL y ejecutar `migrate` una sola vez con una cuenta de mantenimiento. Nunca usar `init-schema` sobre datos existentes. Para una base nueva, crearla primero en el motor mediante una sesión administrativa segura:

```sql
CREATE DATABASE colegio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Luego, con credenciales de mantenimiento temporalmente en el entorno del CLI:

```powershell
php bin/console.php init-schema  # solo si está vacía
php bin/console.php migrate
php bin/console.php check-db
```

`init-schema` rechaza cualquier base con tablas, incluso las ajenas al proyecto. La inicialización DDL no es atómica en estos motores: si falla parcialmente, inspeccionar el estado antes de reintentar; no elimina las tablas creadas. La migración registra su versión y comprueba el índice antes de crearlo; se puede repetir. Ejecutar un solo migrador a la vez. No hay rollback destructivo.

Configurar después el usuario de **solo lectura** de la API con SELECT sobre `cursos`, `anuncios`, `horarios`, `materias` y `espacios`, sin permisos sobre `usuarios`. Guardar la cuenta de mantenimiento separadamente. El CLI necesita permisos de escritura/DDL para inicializar o migrar, pero el servidor no migra al arrancar.

```powershell
php -S 127.0.0.1:8080 -t public public/index.php
# En otra terminal:
Invoke-RestMethod http://127.0.0.1:8080/health/live
Invoke-RestMethod http://127.0.0.1:8080/health/ready
Invoke-RestMethod http://127.0.0.1:8080/api/v1/cursos
```

El servidor incorporado de PHP se usa solamente en desarrollo. No requiere cambiar Android ni instalar dependencias en su proyecto. Una base nueva queda vacía: 200 con listas vacías es válido; solo las pruebas crean fixtures.

## Arranque local con Docker

Requiere Docker Engine/Desktop y Compose v2. Completar en `.env` `LOCAL_DB_PASSWORD` y `LOCAL_DB_ROOT_PASSWORD` con valores diferentes creados localmente.

```powershell
cd backend
docker compose up -d --build
docker compose exec api php bin/console.php init-schema  # solo primera vez, BD vacía
docker compose exec api php bin/console.php migrate
docker compose exec api php bin/console.php check-db
Invoke-RestMethod http://127.0.0.1:8080/health/ready
docker compose down
```

Compose conserva el volumen local. No usar `down -v` con datos que deban conservarse. La API se publica solo en `127.0.0.1:8080`; la BD no tiene `ports`. La cuenta local de Compose tiene permisos para crear el esquema y facilita el desarrollo; sustituirla por una cuenta de lectura antes de cualquier despliegue. Producción usa MySQL Aiven, no este servicio MariaDB.

## Pruebas

Sin BD:

```powershell
php tests/no-db.php
```

Integración con BD nueva, ficticia y aislada; completar `TEST_DB_PASSWORD` y `TEST_DB_ROOT_PASSWORD` fuera de Git:

```powershell
docker compose -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from tests
docker compose -f compose.test.yaml down

# Matriz MySQL: después de detener la ejecución anterior
$env:TEST_DB_IMAGE = 'mysql:8.4'
docker compose -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from tests
docker compose -f compose.test.yaml down
Remove-Item Env:\TEST_DB_IMAGE
```

La BD de integración vive en `tmpfs`, no publica puertos y desaparece al retirar el contenedor. Las pruebas abren un servidor PHP real en loopback y puerto aleatorio. No usan datos del SQL original. El usuario ficticio tiene RUT literal `TEST-ONLY`, no un RUT válido, y un hash de contraseña aleatoria generado en tiempo de ejecución.

También se pueden ejecutar contra una instancia de pruebas local, configurando `APP_ENV=test`, `DB_NAME=liceomap_test`, `TEST_ALLOW_FIXTURES=true` y credenciales/host/puerto en variables de proceso: `php tests/integration.php`. **Requiere base vacía** y deja las fixtures en ella; una segunda ejecución se rechaza, sin borrar datos. Crear otra base vacía para repetir. `DB_TLS_REQUIRED=false` solo se admite en local/test y hosts loopback o alias `db`/`test-db`; cualquier otro host exige TLS aun en pruebas.

Resultados reales y pendientes: [docs/validation.md](docs/validation.md).

## Render y Aiven

Pasos concretos, variables, CA, mínimo privilegio y verificación pendiente: [docs/deployment.md](docs/deployment.md). El despliegue requiere publicar una revisión con autorización posterior; M09 deja solo commits locales. No se ha creado ningún servicio externo, importado datos ni subido credenciales.
