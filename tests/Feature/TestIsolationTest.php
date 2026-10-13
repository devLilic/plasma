<?php

namespace Tests\Feature;

use Tests\TestCase;

class TestIsolationTest extends TestCase
{
    public function test_phpunit_uses_only_the_in_memory_test_database(): void
    {
        $this->assertSame('testing', app()->environment());
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }
}
