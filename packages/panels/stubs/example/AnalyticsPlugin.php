<?php

namespace App\Arcane\Plugins;

use Arcane\Plugins\ArcanePlugin;
use Illuminate\Support\Facades\Log;

/**
 * Example Arcane plugin — Analytics
 *
 * Shows how to:
 * - Add navigation items to the sidebar
 * - Hook into record lifecycle events
 * - Register custom React components
 * - Inject assets
 */
class AnalyticsPlugin extends ArcanePlugin
{
    public static function id(): string          { return 'arcane-analytics'; }
    public static function name(): string        { return 'Analytics'; }
    public static function version(): string     { return '1.0.0'; }
    public static function description(): string { return 'Adds an analytics dashboard to Arcane.'; }

    /**
     * Boot — register any services, bindings, observers.
     */
    public function boot(): void
    {
        // Example: register an Eloquent observer
        // User::observe(UserAnalyticsObserver::class);
    }

    /**
     * Navigation items injected into the sidebar.
     * Appear below resource items.
     */
    public function navigationItems(): array
    {
        return [
            [
                'label' => 'Analytics',
                'icon'  => 'chart',
                'slug'  => 'analytics',
                'url'   => route('arcane.dashboard'),  // or a custom route
                'badge' => null,
            ],
        ];
    }

    /**
     * Plugin lifecycle hooks.
     */
    public function hooks(): array
    {
        return [
            // Log every record creation
            'record.created' => function ($record) {
                Log::info('Arcane: record created', [
                    'model' => get_class($record),
                    'id'    => $record->id ?? null,
                ]);
            },

            // Add audit trail on update
            'record.updated' => function ($record) {
                // AuditLog::create([...]);
            },

            // Block deletion of system records
            'record.deleting' => function ($record) {
                // if ($record->is_system) throw new \Exception('Cannot delete system record.');
            },
        ];
    }

    /**
     * React components this plugin contributes.
     * These are lazy-loaded by the PluginRegistry on the frontend.
     *
     * Keys are slot names, values are JS import paths (relative to plugin bundle).
     */
    public function components(): array
    {
        return [
            'dashboard.widget'  => '@analytics/DashboardWidget',
            'topbar.actions'    => '@analytics/TopbarBadge',
            'sidebar.nav'       => '@analytics/NavSection',
        ];
    }

    /**
     * JS/CSS assets to inject into every admin page.
     */
    public function assets(): array
    {
        return [
            // '/vendor/analytics/analytics.js',
            // '/vendor/analytics/analytics.css',
        ];
    }
}
