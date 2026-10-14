<?php
declare(strict_types=1);

namespace LiceoMap;

final class Request
{
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly string $query = '',
        public readonly ?string $origin = null,
        public readonly bool $secure = false,
        public readonly ?string $requestedMethod = null,
        public readonly string $requestedHeaders = '',
    ) {}

    public static function fromGlobals(): self
    {
        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        if (Config::flag('TRUST_PROXY', false)) {
            $secure = ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
        }
        return new self(
            $_SERVER['REQUEST_METHOD'],
            parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/',
            $_SERVER['QUERY_STRING'] ?? '',
            $_SERVER['HTTP_ORIGIN'] ?? null,
            $secure,
            $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? null,
            $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '',
        );
    }

    public function parameters(array $allowed): array
    {
        $params = [];
        if ($this->query === '') {
            return $params;
        }
        foreach (explode('&', $this->query) as $part) {
            $pair = explode('=', $part, 2);
            $key = urldecode($pair[0]);
            if (!in_array($key, $allowed, true) || array_key_exists($key, $params)) {
                throw new HttpError(400, 'INVALID_PARAMETER', 'Parámetro desconocido o repetido.');
            }
            $params[$key] = urldecode($pair[1] ?? '');
        }
        return $params;
    }

    public static function integer(string $value, int $min, int $max): int
    {
        if (!preg_match('/^(0|[1-9][0-9]*)$/D', $value) || strlen($value) > 10
            || (int) $value < $min || (int) $value > $max) {
            throw new HttpError(400, 'INVALID_PARAMETER', 'Número fuera del rango permitido.');
        }
        return (int) $value;
    }
}
