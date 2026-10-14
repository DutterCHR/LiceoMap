<?php
declare(strict_types=1);

use LiceoMap\Config;
use LiceoMap\Database;
use LiceoMap\Schema;

require dirname(__DIR__) . '/src/bootstrap.php';
require __DIR__ . '/Support.php';

// No borrar ni reinicializar una BD existente. Requiere BD dedicada y vacía.
if (Config::mode() !== 'test' || !str_ends_with(Config::env('DB_NAME'), '_test')
    || !Config::flag('TEST_ALLOW_FIXTURES', false)) {
    fwrite(STDERR, "Se requiere APP_ENV=test, DB_NAME terminado en _test y TEST_ALLOW_FIXTURES=true.\n");
    exit(2);
}
$checks = new Checks();
$pdo = Database::connect();
Schema::initialize($pdo);
$checks->rejects(static fn () => Schema::initialize($pdo), 'init rechaza base existente');
$pdo->beginTransaction();
try {
    $pdo->exec("INSERT INTO roles (id_rol, nombre) VALUES (1, 'profesor')");
    $stmt = $pdo->prepare('INSERT INTO usuarios (id_usuario, rut, password_hash, nombre, apellido, id_rol) VALUES (1, :rut, :hash, :nombre, :apellido, 1)');
    $stmt->execute(['rut' => 'TEST-ONLY', 'hash' => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT), 'nombre' => 'Docente', 'apellido' => 'Ficticio']);
    Schema::executeFile($pdo, __DIR__ . '/fixtures.sql');
    $pdo->commit();
} catch (Throwable $error) {
    $pdo->rollBack();
    throw $error;
}
$snapshot = $pdo->query('SELECT * FROM anuncios ORDER BY id_anuncio')->fetchAll();
Schema::migrate($pdo);
Schema::migrate($pdo);
$checks->expect((int) $pdo->query('SELECT COUNT(*) FROM schema_migrations')->fetchColumn() === 1, 'migración idempotente');
$checks->expect((int) $pdo->query("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'anuncios' AND index_name = 'idx_anuncios_publicos'")->fetchColumn() === 4, 'índice aditivo');
$checks->expect($snapshot === $pdo->query('SELECT * FROM anuncios ORDER BY id_anuncio')->fetchAll(), 'migración conserva datos');

// Servidor HTTP real de pruebas: puerto aleatorio y solo loopback.
$socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $message);
if (!$socket) {
    throw new RuntimeException('No se pudo reservar puerto local.');
}
$address = stream_socket_get_name($socket, false);
fclose($socket);
$base = 'http://' . $address;
$log = tmpfile();
$command = [PHP_BINARY];
if (php_ini_loaded_file()) {
    array_push($command, '-c', php_ini_loaded_file());
}
array_push($command, '-S', $address, '-t', dirname(__DIR__) . '/public', dirname(__DIR__) . '/public/index.php');
putenv('CORS_ALLOWED_ORIGINS=https://panel.example.test');
$process = proc_open($command, [0 => ['pipe', 'r'], 1 => $log, 2 => $log], $pipes, dirname(__DIR__));
if (!is_resource($process)) {
    throw new RuntimeException('No se pudo iniciar PHP.');
}
fclose($pipes[0]);
try {
    $started = false;
    for ($attempt = 0; $attempt < 50; $attempt++) {
        try {
            $started = httpRequest($base . '/health/live')['status'] === 200;
            if ($started) { break; }
        } catch (Throwable $error) {}
        usleep(100000);
    }
    $checks->expect($started, 'servidor HTTP inicia');
    $checks->expect(httpRequest($base . '/health/ready')['body'] === ['status' => 'ok'], 'salud BD sin detalles');
    $courses = httpRequest($base . '/api/v1/cursos');
    $checks->expect(array_column($courses['body']['data'], 'id_curso') === ['T1', 'T2'], 'cursos activos');
    $response = httpRequest($base . '/api/v1/cursos/T1/anuncios');
    $checks->expect($response['status'] === 200 && array_column($response['body']['data'], 'id_anuncio') === [2, 1], 'orden, publicación y aislamiento curso');
    $checks->expect(str_contains($response['body']['data'][1]['contenido'], 'orientación'), 'UTF-8');
    $checks->expect($response['body']['data'][0]['fecha_publicacion'] === '2020-01-02T12:00:00Z', 'fecha UTC');
    $checks->expect(is_int($response['body']['data'][0]['id_anuncio']), 'IDs JSON numéricos');
    $checks->expect(!preg_match('/rut|password|id_autor|apellido|TEST-ONLY/', $response['raw']), 'sin datos personales');
    $checks->expect(str_starts_with($response['headers']['content-type'], 'application/json') && $response['headers']['cache-control'] === 'no-store', 'cabeceras JSON');
    $page = httpRequest($base . '/api/v1/cursos/T1/anuncios?limit=1&offset=1');
    $checks->expect(array_column($page['body']['data'], 'id_anuncio') === [1], 'paginación');
    $checks->expect(httpRequest($base . '/api/v1/cursos/T1/anuncios?offset=10')['body']['data'] === [], 'página vacía');
    $checks->expect(httpRequest($base . '/api/v1/cursos/T1/anuncios/1')['body']['data']['id_anuncio'] === 1, 'detalle publicado');
    foreach ([3, 4, 5, 999] as $id) {
        $checks->expect(httpRequest($base . '/api/v1/cursos/T1/anuncios/' . $id)['status'] === 404, 'detalle oculto o ajeno');
    }
    $schedule = httpRequest($base . '/api/v1/cursos/T1/horarios');
    $checks->expect(array_column($schedule['body']['data'], 'dia_semana') === [1, 2], 'orden de horarios');
    $checks->expect($schedule['body']['data'][0]['materia'] === 'Materia ficticia' && $schedule['body']['data'][0]['espacio'] === 'Sala de prueba', 'joins materias y espacios');
    $checks->expect(!preg_match('/rut|password|profesor|TEST-ONLY/', $schedule['raw']), 'horarios sin información de usuario');
    $checks->expect(count(httpRequest($base . '/api/v1/cursos/T1/horarios?dia=1')['body']['data']) === 1, 'filtro día');
    $checks->expect(httpRequest($base . '/api/v1/cursos/T1/horarios?dia=7')['body']['data'] === [], 'horario vacío');
    foreach (['OFF', 'UNKNOWN'] as $course) {
        $checks->expect(httpRequest($base . '/api/v1/cursos/' . $course . '/anuncios')['status'] === 404, 'curso ausente o inactivo');
    }
    foreach (['dia=8', 'dia[]=1', 'dia=1&dia=2', 'dia=1%20OR%201=1'] as $query) {
        $checks->expect(httpRequest($base . '/api/v1/cursos/T1/horarios?' . $query)['status'] === 400, 'validación HTTP');
    }
    foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
        $checks->expect(httpRequest($base . '/api/v1/cursos/T1/anuncios', $method)['status'] === 405, 'sin escrituras HTTP');
    }
    foreach (['/.env', '/src/Database.php', '/bin/console.php', '/api/login', '/api/v1/admin/anuncios'] as $path) {
        $checks->expect(httpRequest($base . $path)['status'] === 404, 'rutas privadas ausentes');
    }
    $checks->expect($snapshot === $pdo->query('SELECT * FROM anuncios ORDER BY id_anuncio')->fetchAll(), 'escrituras rechazadas conservan datos');
    $checks->expect(httpRequest($base . '/api/v1/cursos', headers: ['Origin: https://evil.example.test'])['status'] === 403, 'CORS denegado');
    $cors = httpRequest($base . '/api/v1/cursos', headers: ['Origin: https://panel.example.test']);
    $checks->expect($cors['headers']['access-control-allow-origin'] === 'https://panel.example.test' && !isset($cors['headers']['access-control-allow-credentials']), 'CORS exacto sin credenciales');
    $preflight = httpRequest($base . '/api/v1/cursos', 'OPTIONS', ['Origin: https://panel.example.test', 'Access-Control-Request-Method: GET']);
    $checks->expect($preflight['status'] === 204 && $preflight['raw'] === '', 'preflight HTTP');
    $head = httpRequest($base . '/api/v1/cursos', 'HEAD');
    $checks->expect($head['status'] === 200 && $head['raw'] === '', 'HEAD sin cuerpo');
    // Desactivar una materia debe ocultar sus horarios, sin afectar otras tablas.
    $pdo->exec('UPDATE materias SET activo = 0 WHERE id_materia = 1');
    $checks->expect(httpRequest($base . '/api/v1/cursos/T1/horarios')['body']['data'] === [], 'materias inactivas filtradas');
    $pdo->exec('UPDATE materias SET activo = 1 WHERE id_materia = 1');
    echo "Integración HTTP/PDO: {$checks->count} comprobaciones OK\n";
} finally {
    proc_terminate($process);
    proc_close($process);
    fclose($log);
}
