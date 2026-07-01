# Panel Configuration

## Overview

The `Panel` class is the central configuration object for a Larafusion admin panel. Every option — routing prefix, authentication, branding, theming, layout, sidebar behaviour, prefetch strategy, user menu, and registered resources — is set here via a fluent method chain inside a `PanelProvider`.

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
            ->brand('My App')
            ->colors(['primary' => '#292524'])
            ->globalSearch();
    }
}
```

---

## Why This Feature Exists

A single, centralised configuration object prevents panel settings from being scattered across config files, service providers, and middleware stacks. `PanelProvider` extends Laravel's `ServiceProvider` — it runs at boot time, pushes its configuration into Laravel's `config()` layer, and shares the serialised panel state with Inertia on every response via `Inertia::share()`.

---

## Core Concepts

### PanelProvider Lifecycle

1. `PanelProvider::register()` is called during the service provider registration phase.
2. It calls `$this->panel(Panel::make())` to get the configured panel.
3. `LarafusionManager::registerPanel($panel)` is called: resources are auto-discovered, pages/widgets/plugins are registered.
4. Laravel config keys under `larafusion.*` are set from the panel object — routing prefix, middleware, branding, theme, layout, behaviour.
5. `PanelProvider::boot()` calls `$panel->getBootUsing()` if set, allowing deferred boot hooks.

### Config Propagation

`PanelProvider::register()` sets config keys like `larafusion.prefix`, `larafusion.theme.name`, `larafusion.font.family`, etc. The route file reads `config('larafusion.prefix', 'admin')` as the route prefix. `LarafusionServiceProvider::boot()` reads `Inertia::share()` values from these same config keys. This means the `Panel` object controls everything through config.

### Inertia Sharing

`LarafusionServiceProvider::boot()` adds:

```php
Inertia::share([
    'larafusion' => fn () => [
        'navigation' => LarafusionManager::getNavigation(),
        'theme'      => LarafusionManager::theme()->toArray(),
        'plugins'    => LarafusionManager::plugins()->toArray(),
        'assets'     => LarafusionManager::plugins()->assets(),
        'panel'      => LarafusionManager::getPanel()?->toArray() ?? [],
    ],
    'auth' => fn () => [...],
]);
```

Every Inertia response includes the full panel configuration, theme CSS variables, navigation tree, and auth user. React reads `usePage().props.larafusion.panel` and `usePage().props.larafusion.theme` to drive layout decisions.

---

## Full API Reference

### Identity

```php
->id('admin')        // unique panel identifier
->path('admin')      // URL prefix: /admin/...
->domain('admin.myapp.com')  // optional domain isolation
```

---

### Authentication

```php
->login()                // enable /admin/login
->registration()         // enable /admin/register
->forgotPassword()       // enable /admin/forgot-password (password reset flow)
->profile()              // enable /admin/profile editing page

->authGuard('admin')     // custom auth guard (default: 'web')
->authPasswordBroker('admins')  // custom password broker (default: 'users')
->revealablePasswords(false)    // hide eye-toggle on password inputs

// Customise URL slugs
->loginSlug('signin')
->registrationSlug('join')
->forgotPasswordSlug('recover')
->resetPasswordSlug('reset')
->profileSlug('account')

// Middleware stacks
->middleware(['web', 'auth', 'verified'])   // all authenticated routes
->authMiddleware(['web', 'throttle:5,1'])   // auth (login) routes only
```

---

### Branding

```php
->brand('My App')                         // name in sidebar header
->brand('My App', '/img/logo.svg')        // name + logo URL
->brandLogo('/img/logo.svg')
->darkModeBrandLogo('/img/logo-dark.svg') // separate logo for dark mode
->brandLogoHeight('1.75rem')              // CSS height of the logo
->favicon('/img/favicon.png')
```

---

### Font

```php
->font('Inter')              // Google Font name (default: 'Inter')
->font('DM Sans', '300..900')  // with weight range
```

Larafusion injects the Google Fonts stylesheet automatically based on `font` and `fontWeight`. The font is applied globally via the `--larafusion-font` CSS variable.

---

### Theme

```php
// Named themes (default: 'stone')
->theme('stone')         // built-in: stone | shadcn | violet | slate | rose | emerald | amber | sky
->theme('violet', true)  // second arg = enable dark mode
->darkMode()             // enable dark mode separately
->defaultThemeMode('system')  // 'light' | 'dark' | 'system'

// Single-hex primary — auto-derives all companion variables (hover, light, ring, sidebar-*)
->colors(['primary' => '#292524'])
->colors(['primary' => '#6366f1'])

// Hex shorthand on ->theme() (alias for ->colors(['primary' => $hex]))
->theme('#292524')

// Manual override of specific CSS variables
->colors([
    'primary'       => '#6366f1',
    'primary-hover' => '#4f46e5',
    'sidebar-bg'    => '#1e1b4b',
])
```

See [Themes](themes.md) for all CSS variable names, auto-derivation details, and built-in theme colour values.

---

### Layout

```php
->topNavigation()               // horizontal topbar instead of sidebar
->sidebarCollapsibleOnDesktop() // sidebar can collapse to icon-only mode (default: false)
->sidebarWidth('18rem')         // expanded sidebar width
->collapsedSidebarWidth('4rem') // icon-only sidebar width
->maxContentWidth('90rem')      // max-width of the main content area
->breadcrumbs(false)                // hide breadcrumbs entirely
->breadcrumbsPosition('page')       // (default) breadcrumbs render inside page content
->breadcrumbsPosition('header')     // breadcrumbs render inside the topbar header
                                    // (only applies to vertical sidebar mode;
                                    //  ignored / falls back to 'page' when topNavigation() is active)
->topbar(false)                     // hide topbar entirely
->subNavigationPosition('top')  // 'start' | 'end' | 'top' | 'bottom'
```

---

### Topbar Features

```php
->globalSearch()    // ⌘K search palette
->notifications()   // notification bell icon
```

---

### User Menu

```php
->userMenu(false)           // disable entirely
->userMenu('sidebar')       // move to bottom of sidebar (instead of topbar)
->userMenu('topbar')        // default position

// Customise items
->userMenuItems([
    'profile' => UserMenuItem::make('profile')
        ->label('Edit Profile')
        ->url('/admin/profile')
        ->icon('user'),
    'logout'  => UserMenuItem::make('logout')
        ->label('Sign Out'),
    // Custom items appended after profile:
    UserMenuItem::make('settings')
        ->label('Settings')
        ->url('/admin/settings')
        ->icon('settings'),
    UserMenuItem::make('help')
        ->label('Documentation')
        ->url('https://docs.example.com')
        ->icon('book-open')
        ->openUrlInNewTab(),
])
```

`UserMenuItem` supports `->visible(Closure)` — visibility closures are evaluated server-side; hidden items are never sent to React.

---

### Behaviour

```php
->unsavedChangesAlerts()    // warn before navigating away from a dirty form
->databaseTransactions()    // wrap each create/update/delete in a DB::transaction()
->strictAuthorization()     // throw 403 instead of silently hiding unauthorised items
->pagination(15)            // default per-page for all resources
->simplePagination()        // show only Prev/Next buttons on all tables (default: false)
->simplePagination(false)   // explicit numbered pagination (individual table setting overrides this)
```

The `->simplePagination()` setting is a panel-wide default. Any resource table that calls `->simplePagination()` or `->simplePagination(false)` directly on its `Table` builder will override the panel default for that table only.

---

### Prefetch

Inertia v3 link prefetching speeds up navigation by pre-loading page data before the user clicks.

```php
->prefetch()                                   // enable with defaults
->prefetchStrategy('hover')                    // 'hover' | 'click' | 'mount'
->prefetchStrategy(['hover', 'mount'])         // multiple strategies
->prefetchCacheFor('30s')                      // cache duration
->prefetchCacheFor(['30s', '1m'])              // stale-while-revalidate: [fresh, stale]
->prefetchCacheFor(5000)                       // milliseconds
->prefetchFlushOnNavigate()                    // clear cache on every navigation
```

Prefetch configuration is spread onto all internal `<Link>` components (nav items, row action links, create/edit buttons) as the `prefetch` and `cacheFor` props.

---

### Registration

```php
->resources([PostResource::class, UserResource::class])  // explicit (disables auto-discovery)
->pages([ReportsPage::class, AnalyticsPage::class])
->widgets([GlobalStatsWidget::class])
->plugins([AnalyticsPlugin::class])
->navigationItems([
    ['label' => 'Documentation', 'icon' => 'book-open', 'url' => 'https://docs.example.com'],
])
```

When `->resources([...])` is called with any class, auto-discovery is disabled. Omit it to keep auto-discovery active.

---

### Boot Hook

```php
->bootUsing(function (Panel $panel) {
    // Runs during PanelProvider::boot()
    // Register macros, listen for events, etc.
    Event::listen(UserRegistered::class, SendWelcomeEmail::class);
})
```

---

## Complete Configuration Example

```php
class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            // Identity
            ->id('admin')
            ->path('admin')

            // Auth
            ->login()
            ->registration()
            ->forgotPassword()
            ->profile()
            ->authGuard('web')
            ->revealablePasswords()

            // Branding
            ->brand('Acme Admin', '/img/logo.svg')
            ->darkModeBrandLogo('/img/logo-dark.svg')
            ->brandLogoHeight('1.5rem')
            ->favicon('/img/favicon.ico')

            // Typography
            ->font('Inter', '300..900')

            // Theme — single hex auto-derives all companion variables
            ->colors(['primary' => '#292524'])
            ->defaultThemeMode('system')

            // Layout
            ->sidebarCollapsibleOnDesktop()
            ->sidebarWidth('16rem')
            ->maxContentWidth('100rem')
            ->breadcrumbs()
            ->topbar()

            // Features
            ->globalSearch()
            ->notifications()

            // User menu
            ->userMenuItems([
                UserMenuItem::make('settings')
                    ->label('Settings')
                    ->url('/admin/settings')
                    ->icon('settings'),
            ])

            // Behaviour
            ->unsavedChangesAlerts()
            ->databaseTransactions()
            ->pagination(20)
            ->simplePagination()    // panel-wide default; override per-table with ->simplePagination(false)

            // Prefetch
            ->prefetch()
            ->prefetchStrategy('hover')
            ->prefetchCacheFor('30s')

            // Plugins
            ->plugins([
                AnalyticsPlugin::class,
            ])

            // Boot hook
            ->bootUsing(fn() => View::share('admin', true));
    }
}
```

---

## Best Practices

- **Keep one `PanelProvider` per panel.** Multi-panel setups work by registering multiple providers, each with a different `->id()` and `->path()`.
- **Call `->resources([...])` only when you need explicit control.** Auto-discovery requires no maintenance as new resource classes are added.
- **Enable `->databaseTransactions()`** on production panels. It ensures that a failed relation sync after a successful `create()` does not leave orphaned records.
- **Enable `->unsavedChangesAlerts()`** on panels with complex multi-section forms. Without it, users navigating away lose unsaved data silently.
- **Set `->prefetch()` with `->prefetchStrategy('hover')`** for large panels with many navigation items. The perceived performance improvement is significant.
- **Always set `->defaultThemeMode('system')`** unless the panel must always display in light mode. Users increasingly expect dark mode support.

---

## Common Mistakes

**Not registering the PanelProvider in `bootstrap/providers.php`.** The panel is never configured, routes are not loaded, and the admin path returns 404.

**Calling `->path('admin')` and also having a Laravel route that matches `/admin/*`.** Larafusion's route file uses the prefix from `config('larafusion.prefix')`, so any colliding application route will compete for the same URL segment. Use a unique path or a subdomain via `->domain()`.

**Enabling `->strictAuthorization()` without reviewing all `canViewAny()` overrides.** In strict mode, any resource where `canViewAny()` returns `false` throws a 403 rather than hiding the item from the nav. This can surprise non-admin users who navigate directly to a URL.

**Setting `->pagination(5)` globally** and expecting resource-level `$perPage` to override it. The resource's `$perPage` property controls the default per-page count; the panel-level `->pagination()` sets `config('larafusion.pagination')` which the dashboard controller reads. Resource pages read `$resourceClass::getPerPage()` from the resource's own `$perPage` property.

**Setting `->simplePagination()` on the panel and expecting it to override a table that explicitly calls `->simplePagination(false)`.** The table-level setting always wins. Panel-level is only the fallback when the table does not call `->simplePagination()` at all.

---

## Security Considerations

- The `->middleware(['web', 'auth'])` array applies to all protected routes. Never remove `auth` from this list unless you intend to build a public panel.
- `->authGuard()` lets you use a custom guard (e.g. `'admin'`) that only allows a specific user table. This is the recommended approach for panels that should only be accessible to a subset of users.
- `->strictAuthorization()` converts silent 403s (hidden items) into explicit 403 responses. Enable it for panels where users should never reach unauthorised resources by guessing URLs.

---

## Related Features

- [Themes](themes.md) — built-in themes, CSS variables, dark mode
- [Navigation](navigation.md) — `->navigationItems()`, `NavigationGroup`
- [Plugins](plugins.md) — `->plugins([...])`
- [Widgets](widgets.md) — `->widgets([...])`
- [Custom Pages](custom-pages.md) — `->pages([...])`
