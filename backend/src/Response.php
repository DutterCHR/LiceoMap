<?php
declare(strict_types=1);

namespace LiceoMap;

final class Response
{
    public function __construct(public int $status, public array $body = [], public array $headers = []) {}

    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $key => $value) {
            header($key . ': ' . $value);
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        header('Referrer-Policy: no-referrer');
        if ($this->status !== 204) {
            echo json_encode($this->body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        }
    }
}
