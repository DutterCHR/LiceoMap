<?php
declare(strict_types=1);

final class Checks
{
    public int $count = 0;

    public function expect(bool $condition, string $label): void
    {
        if (!$condition) {
            throw new RuntimeException('FALLÓ: ' . $label);
        }
        $this->count++;
    }

    public function rejects(callable $call, string $label): void
    {
        try {
            $call();
        } catch (Throwable $error) {
            $this->expect(true, $label);
            return;
        }
        $this->expect(false, $label);
    }
}

function httpRequest(string $url, string $method = 'GET', array $headers = []): array
{
    $context = stream_context_create(['http' => [
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'ignore_errors' => true,
        'follow_location' => 0,
        'timeout' => 4,
    ]]);
    $raw = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    if ($raw === false || !isset($responseHeaders[0])) {
        throw new RuntimeException('Servidor HTTP no disponible.');
    }
    preg_match('/\s([0-9]{3})\s/', $responseHeaders[0], $match);
    $normalized = [];
    foreach (array_slice($responseHeaders, 1) as $line) {
        $pair = explode(':', $line, 2);
        if (count($pair) === 2) {
            $normalized[strtolower($pair[0])] = trim($pair[1]);
        }
    }
    return [
        'status' => (int) $match[1],
        'headers' => $normalized,
        'raw' => $raw,
        'body' => $raw === '' ? [] : json_decode($raw, true, 512, JSON_THROW_ON_ERROR),
    ];
}
