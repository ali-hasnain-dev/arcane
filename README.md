# Arcane

> A React-powered admin panel framework for Laravel — write PHP, get a fully interactive admin UI.

---

## What is Arcane?

Arcane is a Laravel package that maps your Eloquent models to a fully interactive admin interface powered by React and Inertia.js v3. You write PHP resource classes; Arcane renders the forms, tables, navigation, dashboard widgets, and auth pages — no page publishing, no manual React wiring.

```
composer require arcane/panels
php artisan arcane:install
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
| [Authorization](docs/authorization.md) | `docs/authorization.md` | `canViewAny`, `canCreate`, `canEdit`, `canDelete` |
| [Soft Deletes](docs/soft-deletes.md) | `docs/soft-deletes.md` | Trashed tab, restore, force-delete |
| [Export & Import](docs/export-import.md) | `docs/export-import.md` | CSV export streaming and 3-step import wizard |
| [Inline Editing](docs/inline-editing.md) | `docs/inline-editing.md` | Click-to-edit table cells |
| [Global Search](docs/global-search.md) | `docs/global-search.md` | ⌘K search palette with keyboard navigation |
| [Widgets](docs/widgets.md) | `docs/widgets.md` | Stats, Chart (SVG), Table widgets for the dashboard |
| [Navigation](docs/navigation.md) | `docs/navigation.md` | Groups, badges, custom pages, modal forms |
| [Panel Configuration](docs/panel-configuration.md) | `docs/panel-configuration.md` | Full panel API — auth, branding, layout, user menu, prefetch |
| [Themes](docs/themes.md) | `docs/themes.md` | 6 built-in themes, dark mode, FOUC prevention |
| [Notifications](docs/notifications.md) | `docs/notifications.md` | Flash toasts (automatic) and `useNotify()` React hook |
| [Plugins](docs/plugins.md) | `docs/plugins.md` | Extend Arcane with navigation items, slots, lifecycle hooks |
| [CLI Commands](docs/cli-commands.md) | `docs/cli-commands.md` | `arcane:install`, `arcane:resource`, `arcane:widget`, etc. |
| [HTTP Endpoints](docs/internals.md) | `docs/internals.md` | Full route table and Inertia v3 data-flow internals |
| [Feature Roadmap](docs/roadmap.md) | `docs/roadmap.md` | Completed features and what's planned next |

---

## Quick Start

### 1. Install

```bash
composer require arcane/panels
php artisan arcane:install
```

### 2. Register the provider

```php
// bootstrap/providers.php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Arcane\AdminPanelProvider::class,
];
```

### 3. Configure your panel

```php
// app/Providers/Arcane/AdminPanelProvider.php
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
php artisan arcane:resource Post
```

Creates `app/Arcane/Resources/Posts/` with 6 files — auto-discovered, no registration needed.

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

Arcane is a monorepo. Each sub-package is independently composable:

| Package | Description |
|---|---|
| `arcane/panels` | Core panel engine — routing, auth, dashboard, panel config |
| `arcane/forms` | Form fields and validation |
| `arcane/tables` | Table builder, columns, filters, actions |
| `arcane/widgets` | Stats, chart, and table dashboard widgets |
| `arcane/actions` | ButtonAction and LinkAction (legacy) |
| `arcane/schemas` | Schema composition utilities |
| `arcane/support` | Shared types, utilities, enum interfaces |
| `arcane/notifications` | Toast notification system |
| `arcane/infolists` | Read-only info display (planned) |
