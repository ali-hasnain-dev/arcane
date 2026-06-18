# Getting Started

## How It Works

Arcane is a Laravel package. You write PHP resource classes; Arcane renders a fully interactive React admin UI powered by Inertia.js v3. No page publishing required — React components are resolved directly from the vendor package via a Vite plugin.

```
your-app/
├── app/
│   ├── Arcane/
│   │   ├── Pages/                        ← custom non-CRUD pages
│   │   ├── Plugins/                      ← plugin classes
│   │   └── Resources/
│   │       └── Users/                    ← one folder per resource
│   │           ├── Pages/
│   │           │   ├── ListUsers.php
│   │           │   ├── CreateUser.php
│   │           │   └── EditUser.php
│   │           ├── Schemas/
│   │           │   └── UserForm.php      ← form field definitions
│   │           ├── Tables/
│   │           │   └── UsersTable.php    ← column + filter definitions
│   │           └── UserResource.php      ← model, navigation, wires schema + table
│   └── Providers/
│       └── Arcane/
│           └── AdminPanelProvider.php    ← panel configuration
├── resources/
│   ├── css/app.css
│   ├── views/app.blade.php               ← Inertia root template (auto-created)
│   └── js/app.tsx                        ← Inertia entry point (auto-created)
└── vite.config.js                        ← patched by arcane:install
```

---

## Requirements

- PHP 8.2+
- Laravel 11, 12, or 13
- Node.js 18+ / npm
- Tailwind CSS v4 with `@tailwindcss/vite` (standard in fresh Laravel projects)
- `inertiajs/inertia-laravel` (installed automatically as a Composer dependency)

---

## Installation

### 1. Install the package

```bash
composer require arcane/panels
```

### 2. Run the install command

```bash
php artisan arcane:install
```

The install command automatically:

- Creates `app/Providers/Arcane/AdminPanelProvider.php` — your panel configuration hub
- Creates `resources/views/app.blade.php` — Inertia v3 root template with an inline dark-mode FOUC prevention script in `<head>`
- **Replaces `vite.config.js`** with a full Arcane-ready config — adds the `arcaneResolve` Vite plugin (resolves React components directly from `vendor/arcane/` without publishing) and `resolve.preserveSymlinks: true`
- Creates `resources/js/app.tsx` — Inertia v3 entry point with vendor page resolver (no manual `resolve` callback needed)
- Patches `bootstrap/app.php` — registers `\Inertia\Middleware` and redirects unauthenticated users to the panel login
- Patches `.env` — appends `INERTIA_USE_SCRIPT_ELEMENT_FOR_INITIAL_PAGE=true`
- Patches `resources/css/app.css` — adds `@custom-variant dark` for Tailwind v4 dark mode and `@source '../../vendor/arcane/*/resources/js/**/*.{ts,tsx}'` so Tailwind scans vendor component files
- Installs npm packages — production: `@inertiajs/react`, `@vitejs/plugin-react`, `react`, `react-dom`, `lucide-react`, `clsx`; dev: `@types/react`, `@types/react-dom`
- Scaffolds `app/Arcane/Resources/Users/` with all 6 resource files as a working example
- Creates `app/Arcane/{Resources,Pages,Plugins}/` directory structure

### 3. Register the provider

Add your panel provider to `bootstrap/providers.php`:

```php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Arcane\AdminPanelProvider::class, // ← add this
];
```

### 4. Build assets

```bash
npm run build
```

### 5. Visit the panel

```
http://your-app.test/admin
```

Arcane redirects unauthenticated users to `/admin/login` automatically.

---

## Folder Structure

### `app/Providers/Arcane/AdminPanelProvider.php`

Your panel configuration hub. All panel settings — branding, theme, layout, behaviour, prefetch, auth — live here.

```php
namespace App\Providers\Arcane;

use Arcane\Panel;
use Arcane\PanelProvider;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->login()
            ->brand('My App')
            ->theme('violet');
        // Resources in app/Arcane/ are auto-discovered — no ->resources() call needed.
    }
}
```

### `app/Arcane/Resources/{Model}/`

Each resource lives in its own folder. The `arcane:resource` command scaffolds all files:

```bash
php artisan arcane:resource Post
# Creates app/Arcane/Resources/Posts/
#   PostResource.php   ← model, navigation, wires form + table
#   Schemas/PostForm.php
#   Tables/PostsTable.php
#   Pages/ListPosts.php
#   Pages/CreatePost.php
#   Pages/EditPost.php
```

---
