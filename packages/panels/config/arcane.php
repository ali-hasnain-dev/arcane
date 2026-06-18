<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Panel URL Prefix
    |--------------------------------------------------------------------------
    */
    'prefix' => env('ARCANE_PREFIX', 'admin'),

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    | 'middleware'      — applied to ALL protected panel routes
    | 'auth_middleware' — applied only to the login / password-reset routes
    */
    'middleware'      => ['web', 'auth'],
    'auth_middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Domain
    |--------------------------------------------------------------------------
    | Set a custom domain for the panel, e.g. 'admin.example.com'.
    | Leave null to use the application's default domain.
    */
    'domain' => null,

    /*
    |--------------------------------------------------------------------------
    | Brand
    |--------------------------------------------------------------------------
    */
    'brand' => [
        'name'       => env('ARCANE_BRAND', config('app.name', 'Arcane')),
        'logo'       => null,
        'dark_logo'  => null,
        'logo_height'=> '2rem',
        'favicon'    => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Font
    |--------------------------------------------------------------------------
    | Set a Google Fonts family name (e.g. 'Inter', 'Nunito', 'DM Sans').
    | Arcane will inject the Google Fonts stylesheet automatically.
    | Leave 'family' null to use the built-in Inter font.
    */
    'font' => [
        'family' => 'Instrument Sans',
        'weight' => '300..900',
    ],

    /*
    |--------------------------------------------------------------------------
    | Theme
    |--------------------------------------------------------------------------
    | name: violet | slate | rose | emerald | amber | sky
    | default_mode: light | dark | system
    | Override individual CSS vars with 'colors'.
    */
    'theme' => [
        'name'         => env('ARCANE_THEME', 'neutral'),
        'dark_mode'    => false,
        'default_mode' => 'light',
        'font'         => null,   // legacy — prefer arcane.font.family
        'radius'       => '0.625rem',
        'colors'       => [],
    ],

    /*
    |--------------------------------------------------------------------------
    | Layout
    |--------------------------------------------------------------------------
    */
    'layout' => [
        'top_navigation'          => false,
        'sidebar_collapsible'     => true,
        'sidebar_width'           => '16rem',
        'collapsed_sidebar_width' => '4rem',
        'max_content_width'       => null,
        'breadcrumbs'             => true,
        'topbar'                  => true,
        'sub_navigation_position' => 'start',
    ],

    /*
    |--------------------------------------------------------------------------
    | Behaviour
    |--------------------------------------------------------------------------
    */
    'unsaved_changes_alerts' => false,
    'database_transactions'  => false,
    'strict_authorization'   => false,

    /*
    |--------------------------------------------------------------------------
    | Registered Resources
    |--------------------------------------------------------------------------
    */
    'resources' => [],

    /*
    |--------------------------------------------------------------------------
    | Registered Plugins
    |--------------------------------------------------------------------------
    */
    'plugins' => [],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */
    'pagination' => 15,
];
