<?php
declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'LiceoMap\\';
    if (str_starts_with($class, $prefix)) {
        $file = __DIR__ . '/' . substr($class, strlen($prefix)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

date_default_timezone_set('UTC');
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Archivo local opcional. Las variables del proceso siempre tienen prioridad.
$envFile = dirname(__DIR__) . '/.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!preg_match('/^([A-Z][A-Z0-9_]*)=(.*)$/', $line, $match)) {
            throw new RuntimeException('Formato de entorno inválido.');
        }
        $value = trim($match[2]);
        if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"'))
            || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        if (getenv($match[1]) === false) {
            putenv($match[1] . '=' . $value);
        }
    }
}
