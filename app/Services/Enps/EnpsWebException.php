<?php

namespace App\Services\Enps;

use RuntimeException;

class EnpsWebException extends RuntimeException
{
    public function __construct(
        public readonly string $kind,
        string $message,
        public readonly int $status = 502,
    ) {
        parent::__construct($message);
    }
}
