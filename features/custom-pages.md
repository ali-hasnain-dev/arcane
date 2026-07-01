# Custom Pages

## Overview

Custom pages let you add arbitrary, non-CRUD pages to the admin panel — dashboards, reports, analytics screens, settings UIs, or any page that does not map to a resource's index/create/edit flow. A custom page is a PHP class that declares its React component path and props, registered in the panel provider.

---

## Why This Feature Exists

Not every admin page is a CRUD table. Revenue dashboards, system health monitors, user impersonation tools, and multi-step wizards need their own pages with their own data shapes. Custom pages provide a clean integration point that respects the admin layout, navigation, and authorization without requiring you to add routes manually.

---

## Core Concepts

A custom page extends `Larafusion\Pages\Page`. It declares:
- `$slug` — the URL segment (`/admin/p/{slug}`)
- `getView(): string` — the Inertia component name
- `getViewData(): array` — props passed to the component

The `PageController::show()` method calls `Page::render()`, which calls `Inertia::render(getView(), array_merge(['pageTitle' => getTitle()], getViewData()))`.

---

## Creating a Custom Page

### 1. Scaffold

```bash
php artisan larafusion:panel Admin   # generates PanelProvider if not present
```

Create the page class manually in `app/Larafusion/Pages/`:

```php
namespace App\Larafusion\Pages;

use Larafusion\Pages\Page;
use App\Models\Order;

class ReportsPage extends Page
{
    protected static string  $slug             = 'reports';
    protected static string  $title            = 'Reports';
    protected static string  $navigationIcon   = 'bar-chart';
    protected static ?string $navigationGroup  = 'Analytics';
    protected static int     $navigationSort   = 10;

    public static function getView(): string
    {
        return 'Larafusion/Reports';  // resolves to resources/js/Pages/Larafusion/Reports.tsx
    }

    public static function getViewData(): array
    {
        return [
            'revenue' => Order::thisMonth()->sum('total'),
            'orders'  => Order::latest()->limit(10)->get(),
        ];
    }
}
```

### 2. Register

```php
// AdminPanelProvider.php
->pages([ReportsPage::class])
```

Or directly:

```php
// In bootUsing() or a service provider
LarafusionManager::registerPages([ReportsPage::class]);
```

### 3. Create the React Component

```tsx
// resources/js/Pages/Larafusion/Reports.tsx
import { usePage } from '@inertiajs/react';
import AdminLayout from '../components/layout/AdminLayout';

export default function Reports() {
    const { revenue, orders } = usePage().props;
    return (
        <AdminLayout pageTitle="Reports">
            <h1>Revenue this month: ${revenue}</h1>
            {/* ... */}
        </AdminLayout>
    );
}
```

---

## Page Configuration

All properties and their defaults:

| Property | Type | Default | Description |
|---|---|---|---|
| `$slug` | `string` | Derived from class name | URL segment: `/admin/p/{slug}` |
| `$title` | `string` | Derived from class name | Page title (in breadcrumb, `pageTitle` prop) |
| `$navigationLabel` | `string` | Same as `$title` | Sidebar label |
| `$navigationIcon` | `string` | `'file'` | Lucide icon |
| `$navigationGroup` | `?string` | `null` | Navigation group |
| `$navigationSort` | `int` | `0` | Sort order |
| `$showInNavigation` | `bool` | `true` | Whether to include in sidebar |

### Hiding from Navigation

A page that exists at a URL but should not appear in the sidebar:

```php
protected static bool $showInNavigation = false;
```

---

## Methods

| Method | Description |
|---|---|
| `getView(): string` | **Required.** Inertia component path |
| `getViewData(): array` | Props passed alongside `pageTitle` |
| `getSlug(): string` | URL segment (uses `$slug` or derives from class name) |
| `getTitle(): string` | Page title |
| `getNavigationLabel(): string` | Sidebar label |
| `getNavigationIcon(): string` | Sidebar icon |
| `getNavigationGroup(): ?string` | Group key |
| `getNavigationSort(): int` | Sort order |
| `showInNavigation(): bool` | Navigation visibility |
| `render(): Response` | Called by `PageController`; calls `Inertia::render()` |

---

## Real World Examples

### System Health Page

```php
class SystemHealthPage extends Page
{
    protected static string $slug  = 'health';
    protected static string $title = 'System Health';
    protected static string $navigationIcon = 'activity';
    protected static string $navigationGroup = 'Administration';

    public static function getView(): string { return 'Larafusion/SystemHealth'; }

    public static function getViewData(): array
    {
        return [
            'disk'    => disk_free_space('/') / disk_total_space('/') * 100,
            'queued'  => \DB::table('jobs')->count(),
            'failed'  => \DB::table('failed_jobs')->count(),
            'uptime'  => shell_exec('uptime -p'),
            'version' => app()->version(),
        ];
    }
}
```

### Revenue Dashboard

```php
class RevenueDashboardPage extends Page
{
    protected static string $slug  = 'revenue';
    protected static string $title = 'Revenue';
    protected static string $navigationIcon = 'dollar-sign';

    public static function getView(): string { return 'Larafusion/RevenueDashboard'; }

    public static function getViewData(): array
    {
        return [
            'today'     => Order::today()->sum('total'),
            'thisMonth' => Order::thisMonth()->sum('total'),
            'lastMonth' => Order::lastMonth()->sum('total'),
            'chartData' => Order::last90Days()->groupByDay()->get(),
        ];
    }
}
```

### Settings Page (No Navigation)

```php
class AppSettingsPage extends Page
{
    protected static string $slug             = 'app-settings';
    protected static string $title            = 'Application Settings';
    protected static bool   $showInNavigation = false;  // linked from user menu

    public static function getView(): string { return 'Larafusion/AppSettings'; }

    public static function getViewData(): array
    {
        return ['settings' => Setting::all()->pluck('value', 'key')];
    }
}
```

---

## Best Practices

- **Wrap page data in `Inertia::defer()` for heavy queries.** `getViewData()` runs synchronously. For expensive reports, return `Inertia::defer(fn() => [...])` for slow props and let the page skeleton render first.
- **Use `AdminLayout` in your React component** to get the sidebar, topbar, breadcrumbs, and theme automatically.
- **Cache expensive queries in `getViewData()`** rather than computing fresh on every visit.
- **Set `$showInNavigation = false`** for utility pages (settings, wizards) that should be accessible but not clutter the sidebar.

---

## Common Mistakes

**Not using `AdminLayout` in the React component.** The page will render without the sidebar or topbar, looking like a blank white screen rather than an admin page.

**Returning a `Paginator` from `getViewData()` without serialising it.** Inertia serialises Eloquent models but the paginator's `links()` method returns HTML. Call `->toArray()` or use the Inertia resource transformer.

**Creating a page with a `$slug` that collides with a resource slug.** The route file registers custom pages at `/admin/p/{page}`, which is a different path from `/admin/{resource}`. There is no collision risk as long as you use the `p/` prefix route.

---

## Route

```
GET /admin/p/{page}
→ PageController::show(string $page)
→ LarafusionManager::resolvePage($page)
→ $pageClass::render()
```

`LarafusionManager::resolvePage()` aborts with 404 if the slug is not registered.

---

## Related Features

- [Panel Configuration](panel-configuration.md) — `->pages([...])`
- [Navigation](navigation.md) — how pages appear in the sidebar
- [Plugins](plugins.md) — plugins can register their own pages via `boot()` with a custom route
