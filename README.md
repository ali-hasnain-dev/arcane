# Larafusion

> An Inertia-powered admin panel framework for Laravel — write PHP, get a fully interactive admin UI.

---

## What is Larafusion?

Larafusion is a Laravel package that maps your Eloquent models to a fully interactive admin interface powered by Inertia.js v3. You write PHP resource classes; Larafusion renders the forms, tables, navigation, dashboard widgets, and auth pages — no page publishing, no manual React wiring.

```
composer require larafusion/larafusion
php artisan larafusion:install
```

---

## Documentation

| Topic | File | Description |
|---|---|---|
| [Getting Started](docs/getting-started.md) | `docs/getting-started.md` | Requirements, installation, folder structure |
| [Resources](docs/resources.md) | `docs/resources.md` | Model → CRUD mapping, auto-discovery, resource options |
| [Forms](docs/forms.md) | `docs/forms.md` | 20+ field types, validation, layout, custom fields |
| [Enums](docs/enums.md) | `docs/enums.md` | First-class PHP 8.1 enum support across forms, tables, filters |
| [Tables](docs/tables.md) | `docs/tables.md` | Filament-style table builder, columns, filters, bulk actions |
| [Actions](docs/actions.md) | `docs/actions.md` | Per-row actions — inline, URL, and legacy ButtonAction |
| [Soft Deletes](docs/soft-deletes.md) | `docs/soft-deletes.md` | Trashed tab, restore, force-delete |
| [Export & Import](docs/export-import.md) | `docs/export-import.md` | CSV export streaming and 3-step import wizard |
| [Inline Editing](docs/inline-editing.md) | `docs/inline-editing.md` | Click-to-edit table cells |
| [Global Search](docs/global-search.md) | `docs/global-search.md` | ⌘K search palette with keyboard navigation |
| [Widgets](docs/widgets.md) | `docs/widgets.md` | Stats, Chart (SVG), Table widgets for the dashboard |
| [Navigation](docs/navigation.md) | `docs/navigation.md` | Groups, badges, custom pages, modal forms |
| [Panel Configuration](docs/panel-configuration.md) | `docs/panel-configuration.md` | Full panel API — auth, branding, layout, user menu, prefetch |
| [Themes](docs/themes.md) | `docs/themes.md` | 6 built-in themes, dark mode, FOUC prevention |
| [Notifications](docs/notifications.md) | `docs/notifications.md` | Flash toasts (automatic) and `useNotify()` React hook |
| [Plugins](docs/plugins.md) | `docs/plugins.md` | Extend Larafusion with navigation items, slots, lifecycle hooks |
| [CLI Commands](docs/cli-commands.md) | `docs/cli-commands.md` | `larafusion:install`, `larafusion:resource`, `larafusion:widget`, etc. |
| [HTTP Endpoints](docs/internals.md) | `docs/internals.md` | Full route table and Inertia v3 data-flow internals |
| [Feature Roadmap](docs/roadmap.md) | `docs/roadmap.md` | Completed features and what's planned next |

---

## Quick Start

### 1. Install

```bash
composer require larafusion/larafusion
php artisan larafusion:install
```

### 2. Register the provider

```php
// bootstrap/providers.php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Larafusion\AdminPanelProvider::class,
];
```

### 3. Configure your panel

```php
// app/Providers/Larafusion/AdminPanelProvider.php
class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->login()
            ->registration()
            ->forgotPassword()
            ->brand('My App')
            ->theme('violet')
            ->globalSearch()
            ->defaultThemeMode('system');
    }
}
```

### 4. Scaffold a resource

```bash
php artisan larafusion:resource Post
```

Creates `app/Larafusion/Resources/Posts/` with 6 files — auto-discovered, no registration needed.

### 5. Build and visit

```bash
npm run build
```

Open `http://your-app.test/admin`.

---

## Requirements

- PHP 8.2+
- Laravel 11, 12, or 13
- Node.js 18+ / npm
- Tailwind CSS v4
- `inertiajs/inertia-laravel` (installed automatically)

---

## Packages

Larafusion is a monorepo. Each sub-package is independently composable:

| Package | Description |
|---|---|
| `larafusion/panels` | Core panel engine — routing, auth, dashboard, panel config |
| `larafusion/forms` | Form fields and validation |
| `larafusion/tables` | Table builder, columns, filters, actions |
| `larafusion/widgets` | Stats, chart, and table dashboard widgets |
| `larafusion/actions` | ButtonAction and LinkAction (legacy) |
| `larafusion/schemas` | Schema composition utilities |
| `larafusion/support` | Shared types, utilities, enum interfaces |
| `larafusion/notifications` | Toast notification system |
| `larafusion/infolists` | Read-only info display (planned) |
