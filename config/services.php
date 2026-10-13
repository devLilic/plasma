<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'enps' => [
        'url' => env('ENPS_WEB_URL', 'http://95.65.10.186:8808/enpswebaccess3/'),
        'username' => env('ENPS_WEB_USERNAME'),
        'password' => env('ENPS_WEB_PASSWORD'),
        'domain' => env('ENPS_WEB_DOMAIN', ''),
        'timezone' => env('ENPS_WEB_TIMEZONE', 'Europe/Chisinau'),
        'timeout' => (int) env('ENPS_WEB_TIMEOUT', 20),
    ],

];
