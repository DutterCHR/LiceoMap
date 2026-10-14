<?php
declare(strict_types=1);

namespace LiceoMap;

use RuntimeException;

final class Config
{
    public static function env(string $key, string $default = ''): string
    {
        $value = getenv($key);
        return $value === false ? $default : $value;
    }

    public static function mode(): string
    {
        $mode = self::env('APP_ENV', 'production');
        if (!in_array($mode, ['production', 'local', 'test'], true)) {
            throw new RuntimeException('APP_ENV inválido.');
        }
        return $mode;
    }

    public static function flag(string $key, bool $default): bool
    {
        return match (self::env($key, $default ? 'true' : 'false')) {
            'true' => true,
            'false' => false,
            default => throw new RuntimeException('Opción booleana inválida.'),
        };
    }

    public static function origins(): array
    {
        $origins = array_filter(array_map('trim', explode(',', self::env('CORS_ALLOWED_ORIGINS'))));
        foreach ($origins as $origin) {
            $url = parse_url($origin);
            if ($url === false || !isset($url['scheme'], $url['host'])
                || isset($url['user']) || isset($url['pass']) || isset($url['query'])
                || isset($url['fragment']) || isset($url['path'])
                || str_contains($origin, '*')
                || !in_array($url['scheme'], self::mode() === 'production' ? ['https'] : ['https', 'http'], true)) {
                throw new RuntimeException('Origen CORS inválido.');
            }
        }
        return array_values($origins);
    }
}
