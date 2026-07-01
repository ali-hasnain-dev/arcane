# Plugins

## Overview

Plugins are the extension mechanism for Larafusion. A plugin is a PHP class that extends `Larafusion\Plugins\LarafusionPlugin`. It can add navigation items to the sidebar, inject React component slots into the layout, register lifecycle event hooks, add middleware, expose custom field types, and ship static assets.

```bash
php artisan larafusion:plugin Analytics
# Creates app/Larafusion/Plugins/AnalyticsPlugin.php
```

---

## Why This Feature Exists

Not every admin feature belongs in a core resource. Analytics dashboards, audit logs, role-permission managers, notification centers, and payment integrations are cross-cutting — they add navigation, override queries, fire side effects on record mutations, and render components in multiple places across the admin. The plugin system provides a stable integration contract for all of these without forking the package.

---

## Core Concepts

### Plugin Lifecycle

1. **Registration** — `PluginManager::register($class)` is called by `LarafusionManager::registerPanel()` for panel-registered plugins, or by `LarafusionServiceProvider::boot()` for config-registered plugins.
2. **Hook binding** — the plugin's `hooks()` return value is iterated; each `[event => callable]` pair is registered in `PluginManager::$hooks`.
3. **Boot** — `$plugin->boot()` is called once. Register Laravel routes, macros, or listeners here.
4. **Event firing** — `ResourceController` calls `LarafusionManager::fire('record.created', $record)` etc., which iterates all listeners for the event and passes the payload through. Listeners can mutate and return a new payload.

### PluginManager

`LarafusionManager::plugins()` returns the singleton `PluginManager`. It holds all registered plugins, the hook listener registry, and produces the navigation items and assets array for Inertia.

---

## Creating a Plugin

### Scaffold

```bash
php artisan larafusion:plugin Analytics
```

### Minimal Plugin

```php
namespace App\Larafusion\Plugins;

use Larafusion\Plugins\LarafusionPlugin;

class AnalyticsPlugin extends LarafusionPlugin
{
    public static function id(): string      { return 'analytics'; }
    public static function name(): string    { return 'Analytics'; }
    public static function version(): string { return '1.0.0'; }

    public function boot(): void
    {
        // Register routes, macros, listeners
    }

    public function navigationItems(): array
    {
        return [
            [
                'label' => 'Analytics',
                'icon'  => 'bar-chart',
                'slug'  => 'analytics',
                'url'   => '/admin/analytics',
                'badge' => null,
                'group' => 'Reports',
                'sort'  => 5,
            ],
        ];
    }
}
```

### Registration Options

**Via PanelProvider (recommended):**
```php
->plugins([AnalyticsPlugin::class])
```

**Via `config/larafusion.php`:**
```php
'plugins' => [
    App\Larafusion\Plugins\AnalyticsPlugin::class,
],
```

---

## Lifecycle Hooks

Hooks let plugins intercept record mutations at six points in the CRUD lifecycle.

### Available Events

| Event | Payload | When |
|---|---|---|
| `record.creating` | `array $data` | Before `create()` — can return modified `$data` |
| `record.created` | `Model $record` | After `create()` |
| `record.updating` | `['record' => $r, 'data' => $d]` | Before `update()` — can return modified array |
| `record.updated` | `Model $record` | After `update()` |
| `record.deleting` | `Model $record` | Before `delete()` |
| `record.deleted` | `Model $record` | After `delete()` |

### Declaring Hooks in a Plugin

```php
public function hooks(): array
{
    return [
        'record.creating' => function ($data) {
            // Add a created_by field automatically
            $data['created_by'] = auth()->id();
            return $data;   // returning a value replaces the payload
        },
        'record.created' => function ($record) {
            // Log to audit trail
            activity()->on($record)->log('Created');
        },
        'record.deleting' => function ($record) {
            // Cancel the delete if record is locked
            if ($record->is_locked) {
                throw new \Exception('Locked records cannot be deleted.');
            }
        },
    ];
}
```

### Registering Hooks Independently

You can also register hooks without a plugin class:

```php
// In a service provider or boot hook
LarafusionManager::on('record.created', function ($record) {
    Cache::tags(['records'])->flush();
});
```

### Payload Mutation

Listeners that return a non-null value replace the payload for subsequent listeners. In the `ResourceController`:

```php
// record.creating: payload can be mutated
$validated = LarafusionManager::fire('record.creating', $validated) ?? $validated;

// record.updating: payload is a ['record' => $r, 'data' => $d] array
$validated = LarafusionManager::fire('record.updating', ['record' => $record, 'data' => $validated])['data'] ?? $validated;
```

---

## Navigation Items

Plugins can add items to the sidebar navigation. Each item is merged with `['type' => 'item', 'plugin' => $plugin::id()]` before being added to `LarafusionManager::getNavigation()`.

```php
public function navigationItems(): array
{
    return [
        [
            'label'  => 'Reports',
            'icon'   => 'chart-bar',
            'slug'   => 'reports',
            'url'    => '/admin/reports',
            'group'  => 'Analytics',
            'sort'   => 10,
            'badge'  => null,
        ],
        [
            'label'  => 'Audit Log',
            'icon'   => 'shield-check',
            'slug'   => 'audit-log',
            'url'    => '/admin/audit-log',
            'group'  => 'Analytics',
            'sort'   => 11,
        ],
    ];
}
```

---

## React Component Slots

Plugins can expose named React components that the panel layout renders in specific slots. The slot system is declared in `components()` and consumed by the React `PluginRegistry`.

Available slots:
- `sidebar.nav` — bottom of the sidebar navigation
- `topbar.actions` — right side of the topbar
- `page.top` — above every page's content area
- `page.bottom` — below every page's content area

```php
public function components(): array
{
    return [
        'sidebar.nav' => '@analytics/SidebarWidget',
        'topbar.actions' => '@analytics/NotificationBell',
    ];
}
```

The component map is serialised into `larafusion.plugins[].components` and made available to the `PluginRegistry` React component. Actual component resolution requires the consuming app to register the import path.

---

## Assets

Plugins can inject CSS/JS URLs into every admin page:

```php
public function assets(): array
{
    return [
        '/vendor/my-plugin/analytics.js',
        '/vendor/my-plugin/analytics.css',
    ];
}
```

`PluginManager::assets()` de-duplicates and returns all registered URLs, which are included in `larafusion.assets` shared on every Inertia response.

---

## Custom Fields

Plugins can register new field types that appear in form schemas:

```php
public function customFields(): array
{
    return [
        App\Larafusion\Fields\StarRating::class,
    ];
}
```

Custom field classes must extend `Larafusion\Fields\Field` and implement `getType(): string`. The type string is the key React uses to render the correct component.

---

## Middleware

Plugins can add middleware to all Larafusion routes:

```php
public function middleware(): array
{
    return [
        App\Http\Middleware\LogAdminRequest::class,
    ];
}
```

---

## Plugin Configuration

Override to provide config defaults that are merged into `config('larafusion')`:

```php
public function config(): array
{
    return [
        'analytics.tracking_id' => env('ANALYTICS_ID'),
    ];
}
```

---

## Full Plugin Example: Audit Trail

```php
namespace App\Larafusion\Plugins;

use Larafusion\Plugins\LarafusionPlugin;
use App\Models\AuditLog;

class AuditTrailPlugin extends LarafusionPlugin
{
    public static function id(): string   { return 'audit-trail'; }
    public static function name(): string { return 'Audit Trail'; }

    public function boot(): void
    {
        // Register a custom route
        \Illuminate\Support\Facades\Route::middleware(config('larafusion.middleware', ['web', 'auth']))
            ->prefix(config('larafusion.prefix', 'admin'))
            ->group(function () {
                \Illuminate\Support\Facades\Route::get('/audit-log', fn() =>
                    \Inertia\Inertia::render('Larafusion/AuditLog', [
                        'logs' => AuditLog::with('user')->latest()->paginate(20),
                    ])
                );
            });
    }

    public function navigationItems(): array
    {
        return [[
            'label' => 'Audit Log',
            'icon'  => 'shield-check',
            'url'   => '/admin/audit-log',
            'group' => 'Administration',
            'sort'  => 100,
        ]];
    }

    public function hooks(): array
    {
        return [
            'record.created' => fn($record) => $this->log('created', $record),
            'record.updated' => fn($record) => $this->log('updated', $record),
            'record.deleted' => fn($record) => $this->log('deleted', $record),
        ];
    }

    private function log(string $action, $record): void
    {
        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'model_type' => get_class($record),
            'model_id'   => $record->getKey(),
            'changes'    => json_encode($record->getChanges()),
        ]);
    }
}
```

---

## Best Practices

- **Keep `boot()` fast.** It runs synchronously on every request. Defer expensive work with `dispatch()` or `Queue::push()`.
- **Return modified data from `record.creating` / `record.updating` hooks.** The `fire()` method passes the return value as the new payload. If you mutate `$data` inside the closure but return `null`, the original `$data` is used.
- **Use `static function id()` as a stable, unique namespace** (e.g. `'vendor-plugin-name'`). The plugin manager indexes plugins by ID; duplicate IDs are silently skipped.
- **Avoid side effects in `canView()` / `navigationItems()`.** These are called on every request to build the navigation tree.
- **Register routes in `boot()`** using the same middleware stack as the main panel (`config('larafusion.middleware')`), or unauthenticated users can access your plugin's endpoints.

---

## Common Mistakes

**Not returning the modified `$data` from a `record.creating` hook.** If the closure returns `null`, `LarafusionManager::fire()` returns `null` and the controller uses `$validated ?? $null` — which means the original `$validated` is used. Always `return $data`.

**Hooking `record.deleting` to prevent deletion but not throwing an exception.** The hook return value is not checked by the controller to abort the deletion. Throw a `\RuntimeException` or `\Illuminate\Validation\ValidationException` to actually prevent the delete.

**Registering routes in `register()` instead of `boot()`.** Routes must be registered during the `boot` phase; at `register` time the routing infrastructure is not yet initialised.

---

## Related Features

- [Panel Configuration](panel-configuration.md) — `->plugins([...])`
- [Navigation](navigation.md) — how plugin navigation items are merged
- [Resources](resources.md) — the `record.*` events are fired in `ResourceController`
