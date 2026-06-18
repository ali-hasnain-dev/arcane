# Plugins

## Plugins

Plugins extend Arcane with navigation items, sidebar/topbar slots, and lifecycle hooks.

```bash
php artisan arcane:plugin Analytics
```

```php
// app/Arcane/Plugins/AnalyticsPlugin.php
use Arcane\Plugins\ArcanePlugin;

class AnalyticsPlugin extends ArcanePlugin
{
    public string $id      = 'analytics';
    public string $name    = 'Analytics';
    public string $version = '1.0.0';

    public function boot(): void
    {
        $this->on('record.created', function ($record) {
            activity()->log("Created {$record->id}");
        });
    }

    public function navigationItems(): array
    {
        return [
            ['label' => 'Analytics', 'icon' => 'bar-chart', 'slug' => 'analytics', 'url' => '/admin/analytics', 'plugin' => $this->id, 'badge' => null],
        ];
    }
}
```

Register in `config/arcane.php`:

```php
'plugins' => [
    \App\Arcane\Plugins\AnalyticsPlugin::class,
],
```

### Plugin Slots (React)

| Slot             | Location                     |
| ---------------- | ---------------------------- |
| `sidebar.nav`    | Bottom of sidebar navigation |
| `topbar.actions` | Right side of topbar         |
| `page.top`       | Above every page's content   |
| `page.bottom`    | Below every page's content   |

### Lifecycle Hooks

| Event             | Payload                          | Fired             |
| ----------------- | -------------------------------- | ----------------- |
| `record.creating` | `$data` array                    | Before `create()` |
| `record.created`  | `$record`                        | After `create()`  |
| `record.updating` | `['record' => $r, 'data' => $d]` | Before `update()` |
| `record.updated`  | `$record`                        | After `update()`  |
| `record.deleting` | `$record`                        | Before `delete()` |
| `record.deleted`  | `$record`                        | After `delete()`  |

---
