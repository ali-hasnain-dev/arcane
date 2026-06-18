<?php

namespace Arcane\Plugins;

use Arcane\Plugins\Contracts\HasNavigation;
use Arcane\Plugins\Contracts\HasCustomFields;
use Arcane\Plugins\Contracts\HasHooks;

abstract class ArcanePlugin
{
    /** Unique identifier for this plugin e.g. "arcane-analytics" */
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
     * Middleware to add to Arcane routes.
     */
    public function middleware(): array { return []; }

    /**
     * Additional config defaults merged into arcane.php.
     */
    public function config(): array { return []; }

    /**
     * Assets (JS/CSS) to load. Return array of public URLs.
     */
    public function assets(): array { return []; }

    /**
     * React components this plugin exposes.
     * Return a map of component name → import path (used by Arcane's registry).
     */
    public function components(): array { return []; }
}
