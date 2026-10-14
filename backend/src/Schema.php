<?php
declare(strict_types=1);

namespace LiceoMap;

use PDO;
use RuntimeException;

final class Schema
{
    public static function initialize(PDO $pdo): void
    {
        if ((int) $pdo->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchColumn() !== 0) {
            throw new RuntimeException('La base no está vacía. Usar migrate para una base existente.');
        }
        self::executeFile($pdo, dirname(__DIR__) . '/database/schema.sql');
    }

    public static function migrate(PDO $pdo): void
    {
        // Solo índice aditivo. El dialecto original ya es compatible con ambos motores.
        (new ReadRepository($pdo))->ready();
        $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(100) PRIMARY KEY,
            aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE = InnoDB');
        $version = '001_anuncios_publicos';
        $check = $pdo->prepare('SELECT version FROM schema_migrations WHERE version = :version');
        $check->execute(['version' => $version]);
        if ($check->fetchColumn() !== false) {
            return;
        }
        $index = $pdo->prepare('SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = DATABASE() AND table_name = :tabla AND index_name = :indice');
        $index->execute(['tabla' => 'anuncios', 'indice' => 'idx_anuncios_publicos']);
        if ((int) $index->fetchColumn() === 0) {
            self::executeFile($pdo, dirname(__DIR__) . '/database/migrations/001_anuncios_publicos.sql');
        }
        $record = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
        $record->execute(['version' => $version]);
    }

    public static function executeFile(PDO $pdo, string $path): void
    {
        // Nuestros archivos contienen sentencias sencillas, sin procedimientos ni delimitadores especiales.
        $sql = preg_replace('/^--.*$/m', '', file_get_contents($path));
        foreach (explode(';', $sql) as $statement) {
            if (trim($statement) !== '') {
                $pdo->exec($statement);
            }
        }
    }
}
