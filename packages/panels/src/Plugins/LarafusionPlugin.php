<?php

namespace Larafusion\Plugins;

use Larafusion\Plugins\Contracts\HasNavigation;
use Larafusion\Plugins\Contracts\HasCustomFields;
use Larafusion\Plugins\Contracts\HasHooks;

abstract class LarafusionPlugin
{
    /** Unique identifier for this plugin e.g. "larafusion-analytics" */
    abstract public static function id(): string;

    /** Human-readable name */
    abstract public static function name(): string;

    /** Semver version string */
    public static function version(): string { return '1.0.0'; }

    /** Plugin description */
    public static function description(): string { return ''; }

    /** Called once when the plugin boots — register services, routes, etc. */
    public function boot(): void {}

    /** Navigation items to inject into the sidebar */
    public function navigationItems(): array { return []; }

    /**
     * Custom field types this plugin registers.
     * Return an array of Field class names.
     */
    public function customFields(): array { return []; }

    /**
     * Hook handlers. Return array of [event => callable].
     * e.g. ['record.created' => fn($record) => ...]
     */
    public function hooks(): array { return []; }

    /**
     * Middleware to add to Larafusion routes.
     */
    public function middleware(): array { return []; }

    /**
     * Additional config defaults merged into larafusion.php.
     */
    public function config(): array { return []; }

    /**
     * Assets (JS/CSS) to load. Return array of public URLs.
     */
    public function assets(): array { return []; }

    /**
     * React components this plugin exposes.
     * Return a map of component name → import path (used by Larafusion's registry).
     */
    public function components(): array { return []; }
}
