<?php
declare(strict_types=1);

namespace LiceoMap;

use PDO;
use RuntimeException;

final class Database
{
    public static function connect(): PDO
    {
        $host = Config::env('DB_HOST');
        $name = Config::env('DB_NAME');
        $port = Config::env('DB_PORT', '3306');
        $user = Config::env('DB_USER');
        if (!preg_match('/^[a-zA-Z0-9._-]+$/D', $host)
            || !preg_match('/^[a-zA-Z0-9_]+$/D', $name)
            || !ctype_digit($port) || (int) $port < 1 || (int) $port > 65535
            || $user === '' || Config::env('DB_PASSWORD') === '') {
            throw new RuntimeException('Configuración de base de datos incompleta.');
        }
        $tls = Config::flag('DB_TLS_REQUIRED', true);
        if (!$tls && (Config::mode() === 'production'
            || !in_array($host, ['localhost', '127.0.0.1', 'db', 'test-db'], true))) {
            throw new RuntimeException('TLS obligatorio para conexiones remotas.');
        }
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 3,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
        ];
        if ($tls) {
            $ca = Config::env('DB_TLS_CA');
            if ($ca === '' || !is_file($ca) || !is_readable($ca)) {
                throw new RuntimeException('Certificado CA requerido.');
            }
            $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4", $user, Config::env('DB_PASSWORD'), $options);
        // PDO/mysqlnd puede negociar una conexión sin TLS si el servidor no lo ofrece.
        if ($tls) {
            $cipher = $pdo->query("SHOW SESSION STATUS LIKE 'Ssl_cipher'")->fetch();
            if (!$cipher || ($cipher['Value'] ?? '') === '') {
                throw new RuntimeException('Conexión sin cifrado rechazada.');
            }
        }
        $pdo->exec("SET time_zone = '+00:00'");
        return $pdo;
    }
}
