<?php
declare(strict_types=1);

try {
    require dirname(__DIR__) . '/src/bootstrap.php';
    $app = new LiceoMap\Application(static fn () => new LiceoMap\ReadRepository(LiceoMap\Database::connect()));
    $response = $app->handle(LiceoMap\Request::fromGlobals());
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') {
        ob_start();
        $response->send();
        ob_end_clean();
    } else {
        $response->send();
    }
} catch (Throwable $error) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"error":{"code":"SERVICE_UNAVAILABLE","message":"Servicio temporalmente no disponible."}}';
}
