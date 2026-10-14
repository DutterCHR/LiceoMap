# Configuración pendiente de Render y Aiven

No se creó ni probó un servicio en Internet. No se hizo push, merge ni PR. Para desplegar, primero revisar los commits locales y autorizar su publicación. Estas instrucciones preparan la configuración, no prueban que funcione.

## Aiven MySQL

1. Crear un servicio MySQL compatible (recomendado para pruebas de este módulo: familia 8.4) y una base vacía dedicada a LiceoMap. No subir datos del establecimiento. Usar datos ficticios para la primera verificación remota.
2. Obtener host DNS, puerto del servicio y CA desde Aiven Console. No usar el puerto público de una MariaDB de nuestra infraestructura; el endpoint administrado de Aiven se consume desde Render mediante TLS y restricciones de red. Restringir IPs/redes de entrada a los rangos de salida necesarios del servicio Render y a una estación de mantenimiento autorizada, según las opciones de Aiven disponibles.
3. Crear una cuenta de mantenimiento y otra de lectura. La de mantenimiento prepara las tablas mediante `init-schema` solo si la base está vacía, seguido de `migrate`. Para una base ya creada desde el esquema actual, respaldar y ejecutar únicamente `migrate`. No importar el SQL original con sus DROP ni datos.
4. La cuenta de API debe tener SELECT únicamente en `cursos`, `anuncios`, `horarios`, `materias` y `espacios`; nada sobre `usuarios` ni permisos CREATE/INSERT/UPDATE/DELETE. Conceder esos permisos usando la cuenta administrativa de Aiven y su mecanismo de usuarios soportado. Los nombres y contraseñas se eligen fuera de Git. No reutilizar la cuenta administrativa para la API.
5. Probar `php bin/console.php check-db` con TLS y la cuenta lectora; el CLI no imprime versión, host ni credenciales. Confirmar que el servidor exige conexión cifrada a esa cuenta si el servicio permite configurar `REQUIRE SSL`.

La CA debe quedar en un archivo fuera de Git y del directorio público. PDO usa `MYSQL_ATTR_SSL_CA`, `MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true` y verifica además que `Ssl_cipher` no esté vacío. No se desactiva la verificación de certificado ni se aceptan hosts remotos sin TLS. No se incluyen credenciales de Aiven en Android o JavaScript.

## Render Web Service con Docker

Después de publicar la revisión autorizada, crear un **Web Service**, runtime Docker:

- Seleccionar la revisión/rama aprobada. Desactivar despliegue automático durante la primera configuración si se quiere revisar cada despliegue.
- Contexto Docker: `backend`; Dockerfile relativo a la raíz del repositorio: `backend/Dockerfile`. Sin Root Directory, usar esos dos campos. Alternativamente, Root Directory=`backend`, contexto=`.` y Dockerfile=`./Dockerfile`. Verificar los campos disponibles en el panel para no copiar el repositorio completo como contexto.
- Usar CMD/ENTRYPOINT de la imagen, sin comando que ejecute migraciones al arrancar.
- Health check path: `/health/ready`. El healthcheck incluido en Docker usa liveness; Render comprueba readiness.
- Render proporciona `PORT` (normalmente 10000). Apache escucha en todas las interfaces y el puerto indicado; el entrypoint valida el rango y no necesita hardcodearlo.
- Render termina TLS en su proxy y redirige HTTP público a HTTPS. `TRUST_PROXY=true` permite aceptar su `X-Forwarded-Proto: https`. Usarlo únicamente detrás de ese ingreso de confianza; un Apache expuesto directamente no debe confiar en una cabecera enviada por el cliente.
- Para la CA, agregar un Secret File `aiven-ca.pem` en Render y configurar `DB_TLS_CA=/etc/secrets/aiven-ca.pem`. Si el panel ofrece una ruta distinta, usar la ruta absoluta que muestre. Verificar disponibilidad y lectura del archivo en ejecución, sin mostrar su contenido. No copiar la CA a public ni al Dockerfile.

Variables del servicio:

| Variable | Valor |
| --- | --- |
| `APP_ENV` | `production` |
| `TRUST_PROXY` | `true` solo detrás del proxy de Render |
| `DB_HOST` | DNS de Aiven, sin esquema URI |
| `DB_PORT` | Puerto MySQL del servicio Aiven |
| `DB_NAME` | Base dedicada existente |
| `DB_USER` | Cuenta lectora de mínimo privilegio |
| `DB_PASSWORD` | Secreto en el panel de Render |
| `DB_TLS_REQUIRED` | `true` |
| `DB_TLS_CA` | Ruta absoluta al Secret File de CA |
| `CORS_ALLOWED_ORIGINS` | Origen HTTPS exacto del panel; separar varios con comas, sin slash final |
| `PORT` | Usar el valor proporcionado por Render |

`CORS_ALLOWED_ORIGINS` vacío no permite solicitudes de navegador con Origin; no bloquea clientes nativos sin Origin. No admite comodines, rutas, cookies ni credenciales CORS. No agregar el origen de la API por costumbre; agregar los orígenes desde los que realmente se sirve el panel. No copiar `APP_ENV=local` ni la configuración TLS desactivada del ejemplo local al servicio remoto.

## Verificación remota necesaria

```powershell
$base = 'https://<servicio>.onrender.com'
Invoke-RestMethod "$base/health/live"
Invoke-RestMethod "$base/health/ready"
Invoke-RestMethod "$base/api/v1/cursos"
Invoke-RestMethod "$base/api/v1/cursos/T1/anuncios"
Invoke-RestMethod "$base/api/v1/cursos/T1/horarios?dia=1"
```

Usar un curso ficticio existente. Comprobar también:

1. HTTPS válido y redirección HTTP pública de Render, sin certificados deshabilitados en el cliente.
2. Readiness 200 con usuario lector, CA correcta y restricciones de red.
3. CA incorrecta/no disponible y credenciales inválidas → fallo seguro 503 sin DSN/secretos. Verificar certificado de servidor y rechazo del host incorrecto en una prueba controlada.
4. GET desde el origen real del panel funciona; origen no permitido y preflight de escritura fallan.
5. POST/PATCH/DELETE no escriben y el panel demo no obtiene autoridad por localStorage.
6. Android accede con HTTPS en una red externa al computador; MySQL no es accesible directamente desde el APK.
7. Reinicio del contenedor conserva datos en Aiven y no vuelve a ejecutar schema/migrate.

Antes de publicar datos del establecimiento, acordar qué anuncios/horarios son públicos, implementar autenticación para cualquier información privada y mantener respaldo fuera de Git. Para mayor carga, medir límites de conexión y aplicar límites de solicitudes en el ingreso o aplicación; M09 no implementa rate limiting distribuido.

Documentación oficial consultada para preparar estos pasos:

- [Render: Web Services, PORT y HTTPS](https://render.com/docs/web-services)
- [Render: Docker](https://render.com/docs/docker)
- [Render: Health Checks](https://render.com/docs/health-checks)
- [Render: Environment Variables and Secrets](https://render.com/docs/configure-environment-variables)
- [Aiven: conexión MySQL desde PHP y CA](https://aiven.io/docs/products/mysql/howto/connect-with-php)
- [PHP: opciones PDO MySQL para TLS](https://www.php.net/manual/en/ref.pdo-mysql.php)

Se usan las opciones PDO MySQL documentadas por PHP para TLS; no se trasladan opciones de DSN de otros drivers como `sslmode`.
