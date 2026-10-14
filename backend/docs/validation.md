# Validación M09 — 2026-10-14

## Ejecutado

| Comprobación | Resultado |
| --- | --- |
| PHP 8.2.34 NTS x64 portátil, extensiones PDO/mysqlnd/pdo_mysql | Runtime disponible y usado |
| Sintaxis de los archivos PHP (`php -l`) | Sin errores |
| `php tests/no-db.php` | 43 comprobaciones OK |
| `php tests/integration.php`, MariaDB 11.4.5 x64 temporal | 46 comprobaciones HTTP/PDO OK |
| Sintaxis JS (`node --check examples/api-client.js`) | Sin errores |
| Sintaxis shell (`bash -n docker/entrypoint.sh`) | Sin errores |
| `git diff --check` | Sin errores |
| Comparación del esquema seguro con las nueve tablas del SQL original | Mismas definiciones, utf8mb4 explícito y sin instrucciones de datos/borrado |
| Reglas de Git para .env/certificados | Secretos ignorados; .env.example versionable |

La instancia MariaDB temporal se inicializó en el directorio de herramientas del agente, fuera del repositorio y de la base existente. Se ligó a `127.0.0.1:33307`, con contraseña aleatoria y base vacía `liceomap_test`. Se detuvo al finalizar. El servidor PHP de integración también se detuvo. No se ejecutó ningún DROP TABLE ni se usaron datos del establecimiento.

PHP y MariaDB se descargaron de sus distribuciones oficiales; sus ZIP se verificaron con los SHA256 oficiales antes de extraerlos. No se instalaron como servicios del sistema ni se añadieron herramientas/credenciales a Git. La primera puesta en marcha temporal falló por una incompatibilidad de `Start-Process` con las entradas PATH/Path del entorno; se resolvió iniciando el mismo ejecutable con ProcessStartInfo y ventana oculta. La ejecución posterior de integración pasó.

Sin BD: validación de parámetros, arrays/repeticiones, inyección SQL/DSN, HTTPS en producción, CORS exacto, preflight, rechazo de métodos/rutas administrativas, CA obligatoria y rechazo de configuración remota sin TLS. Estas pruebas de TLS verifican configuración y rechazo previo a conexión; no acreditan una negociación TLS real.

HTTP/PDO real: creación del esquema vacío, negativa a reinicializar tablas, migración repetible/aditiva, conservación de datos tras reejecutarla, catálogo activo, anuncios por curso sin borradores/futuros, detalle sin acceso a anuncios de otro curso, paginación, UTF-8/UTC, horarios y joins, validación HTTP, privacidad del JSON, CORS, HEAD, rutas privadas inaccesibles y ausencia de cambios ante solicitudes de escritura.

## Pendiente de ejecución

- Build Docker, arranque Apache y ambas configuraciones Compose: Docker no está instalado/disponible en este entorno. Los archivos están preparados, pero no se declara su ejecución validada.
- Matriz MySQL 8.4: preparado `compose.test.yaml` con `TEST_DB_IMAGE=mysql:8.4`; la ejecución actual fue MariaDB.
- PDO contra Aiven con CA real: conexión cifrada, verificación de certificado/hostname, red y permisos del usuario lector.
- Despliegue Render: construcción remota, proxy HTTPS, Secret File, PORT y readiness desde Internet.
- Navegador desde el origen real del panel y Android desde una red externa. Se incluye un cliente web de lectura; el panel actual continúa siendo una demo y Android no se modifica.
- Autenticación/autorización administrativas reales y CRUD HTTP: diseño documentado, implementación intencionalmente pendiente, rutas inexistentes.

No se puede afirmar que el despliegue funciona con los resultados locales. Las pruebas remotas se harán solo después de configurar cuentas, revisar y autorizar la publicación de la rama.
