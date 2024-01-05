<?php

namespace App\Services\Parser;

trait Fragmentize {
    public function fragment($text, $startTag, $endTag = null): string
    {
        $start = stripos($text, $startTag) + strlen($startTag);

        // if $endTag not null, calculate length of substring to get
        $length = $endTag ? stripos($text, $endTag, $start) - $start : null;

        $result = substr($text, $start, $length);

        return trim($result);
    }

}
