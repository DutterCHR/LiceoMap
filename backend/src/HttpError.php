<?php
declare(strict_types=1);

namespace LiceoMap;

use RuntimeException;

final class HttpError extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}
