<?php
declare(strict_types=1);

use LiceoMap\Database;
use LiceoMap\ReadRepository;
use LiceoMap\Schema;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/src/bootstrap.php';
$command = $argv[1] ?? '';
if (!in_array($command, ['init-schema', 'migrate', 'check-db'], true)) {
    fwrite(STDERR, "Uso: php bin/console.php init-schema|migrate|check-db\n");
    exit(2);
}
try {
    $pdo = Database::connect();
    match ($command) {
        'init-schema' => Schema::initialize($pdo),
        'migrate' => Schema::migrate($pdo),
        'check-db' => (new ReadRepository($pdo))->ready(),
    };
    fwrite(STDOUT, "$command: OK\n");
} catch (Throwable $error) {
    fwrite(STDERR, "$command: FALLÓ. Revisar configuración, TLS, permisos y esquema; no se muestran detalles sensibles.\n");
    exit(1);
}
