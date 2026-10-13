<?php

namespace App\Services\Articles;

use RuntimeException;

class MosOverrideConflict extends RuntimeException
{
    public function __construct(public readonly array $current)
    {
        parent::__construct('Datele MOS s-au schimbat. Reîncarcă valorile înainte de salvare.');
    }
}
