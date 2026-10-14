<?php
declare(strict_types=1);

use LiceoMap\Application;
use LiceoMap\Config;
use LiceoMap\Database;
use LiceoMap\Request;

require dirname(__DIR__) . '/src/bootstrap.php';
require __DIR__ . '/Support.php';

$checks = new Checks();
putenv('APP_ENV=test');
putenv('CORS_ALLOWED_ORIGINS=https://panel.example.test');
$connections = 0;
$app = new Application(static function () use (&$connections) {
    $connections++;
    throw new RuntimeException('SECRET_DB_PASSWORD');
});
$checks->expect($app->handle(new Request('GET', '/health/live'))->body === ['status' => 'ok'], 'salud sin BD');
foreach ([
    ['/api/v1/cursos/T1/anuncios', 'limit=0'],
    ['/api/v1/cursos/T1/anuncios', 'limit=101'],
    ['/api/v1/cursos/T1/anuncios', 'limit[]=2'],
    ['/api/v1/cursos/T1/anuncios', 'limit=2&limit=3'],
    ['/api/v1/cursos/T1/anuncios', 'offset=-1'],
    ['/api/v1/cursos/T1/anuncios', 'offset=100001'],
    ['/api/v1/cursos/T1/anuncios', 'limit=1%20OR%201=1'],
    ['/api/v1/cursos/T1/anuncios', 'rut=TEST-ONLY'],
    ['/api/v1/cursos/T1/horarios', 'dia=0'],
    ['/api/v1/cursos/T1/horarios', 'dia=8'],
    ['/api/v1/cursos/T1/horarios', 'dia=1.5'],
    ['/api/v1/cursos/T1/horarios', 'dia=1&dia=2'],
    ['/api/v1/cursos/%27OR%201/anuncios', ''],
    ['/api/v1/cursos/ABCDEFGHIJK/anuncios', ''],
    ['/api/v1/cursos/T1/anuncios/0', ''],
    ['/api/v1/cursos/T1/anuncios/4294967296', ''],
    ['/api/v1/cursos/T1/anuncios/1', 'limit=1'],
    ['/health/live', 'debug=1'],
] as [$path, $query]) {
    $checks->expect($app->handle(new Request('GET', $path, $query))->status === 400, 'validación ' . $path . '?' . $query);
}
foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
    $response = $app->handle(new Request($method, '/api/v1/cursos/T1/anuncios'));
    $checks->expect($response->status === 405 && isset($response->headers['Allow']), 'escritura desactivada ' . $method);
}
foreach (['/api/v1/admin/anuncios', '/api/login', '/.env', '/database/schema.sql', '/api/v1/cursos/T1/horarios/1'] as $path) {
    $checks->expect($app->handle(new Request('POST', $path))->status === 404, 'ruta privada ausente');
}
$checks->expect($connections === 0, 'validación y rechazo previos a conexión');
$response = $app->handle(new Request('GET', '/health/ready'));
$checks->expect($response->status === 503 && !str_contains(json_encode($response->body), 'SECRET'), 'fallo de BD sin secretos');
$checks->expect($app->handle(new Request('GET', '/health/live', origin: 'https://evil.example.test'))->status === 403, 'CORS origen rechazado');
$response = $app->handle(new Request('OPTIONS', '/api/v1/cursos', origin: 'https://panel.example.test', requestedMethod: 'GET'));
$checks->expect($response->status === 204 && $response->headers['Access-Control-Allow-Origin'] === 'https://panel.example.test', 'preflight permitido');
$checks->expect(str_contains($response->headers['Vary'], 'Access-Control-Request-Method'), 'Vary preflight');
$checks->expect($app->handle(new Request('OPTIONS', '/api/v1/cursos', origin: 'https://panel.example.test', requestedMethod: 'POST'))->status === 403, 'preflight escritura denegado');
$checks->expect($app->handle(new Request('OPTIONS', '/api/v1/cursos', origin: 'https://panel.example.test', requestedMethod: 'GET', requestedHeaders: 'Authorization'))->status === 403, 'cabecera no habilitada');
putenv('APP_ENV=production');
$checks->expect($app->handle(new Request('GET', '/health/live'))->status === 426, 'HTTPS producción obligatorio');
$response = $app->handle(new Request('GET', '/health/live', secure: true));
$checks->expect($response->status === 200 && isset($response->headers['Strict-Transport-Security']), 'HTTPS aceptado y HSTS');
putenv('CORS_ALLOWED_ORIGINS=*');
$checks->rejects(static fn () => Config::origins(), 'CORS comodín rechazado');
putenv('CORS_ALLOWED_ORIGINS=http://panel.example.test');
$checks->rejects(static fn () => Config::origins(), 'CORS HTTP producción rechazado');
putenv('DB_HOST=remote.example.test');
putenv('DB_NAME=liceomap_test');
putenv('DB_USER=test');
putenv('DB_PASSWORD=' . bin2hex(random_bytes(16)));
putenv('DB_TLS_REQUIRED=false');
$checks->rejects(static fn () => Database::connect(), 'producción sin TLS rechazada');
putenv('APP_ENV=test');
$checks->rejects(static fn () => Database::connect(), 'remoto sin TLS rechazado incluso en test');
putenv('DB_TLS_REQUIRED=true');
putenv('DB_TLS_CA=');
$checks->rejects(static fn () => Database::connect(), 'CA obligatoria');
putenv('DB_HOST=localhost;dbname=other');
$checks->rejects(static fn () => Database::connect(), 'inyección DSN rechazada');
echo "Sin BD: {$checks->count} comprobaciones OK\n";
