# Navigation

## Overview

Navigation in Larafusion is built automatically from registered resources, custom pages, plugin items, and extra items declared on the panel. The result is a sorted, optionally grouped tree that is shared on every Inertia response as `larafusion.navigation`.

---

## Why This Feature Exists

Manual navigation maintenance in admin panels — adding a route, adding a sidebar link, keeping sort order consistent — is boilerplate that Larafusion eliminates. Every resource, page, and plugin declares its own navigation metadata; `LarafusionManager::getNavigation()` assembles the complete tree at request time.

---

## Core Concepts

### Navigation Tree Structure

The navigation array is a flat-then-grouped structure:

```json
[
  { "type": "item",  "label": "Dashboard", "icon": "home",  "url": "/admin", ... },
  { "type": "item",  "label": "Posts",     "icon": "file",  "url": "/admin/posts", ... },
  {
    "type": "group",
    "label": "Administration",
    "items": [
      { "type": "item", "label": "Users", ... },
      { "type": "item", "label": "Roles", ... }
    ]
  }
]
```

Ungrouped items appear first (sorted by `sort`), followed by group nodes (also sorted). Items inside a group are sorted by their own `sort` value.

### Item Sources

`LarafusionManager::getNavigation()` collects items from four sources in order:

1. **Registered resources** — every resource that passed `canViewAny()` (in strict mode) contributes one item using its `$navigationLabel`, `$navigationIcon`, `$navigationGroup`, `$navigationSort`, and `getNavigationBadge()`.
2. **Registered custom pages** — pages with `showInNavigation() = true` contribute items.
3. **Extra nav items** — declared with `Panel::navigationItems([...])`.
4. **Plugin items** — from `LarafusionPlugin::navigationItems()`.

---

## Resource Navigation Properties

Set on the resource class:

```php
class UserResource extends Resource
{
    protected static string  $navigationLabel = 'Users';
    protected static string  $navigationIcon  = 'users';       // Lucide icon name
    protected static ?string $navigationGroup = 'Administration';
    protected static int     $navigationSort  = 1;

    public static function getNavigationBadge(): string|int|null
    {
        return User::where('status', 'pending_verification')->count() ?: null;
    }
}
```

`getNavigationBadge()` returns a count or label that appears as a small chip on the sidebar item. Return `null` to hide the badge.

---

## Navigation Groups

Groups are collapsible sections in the sidebar that contain multiple resource or page items.

### Automatic Groups

When any resource or page has `$navigationGroup = 'Content'`, a group node called `'Content'` is created automatically with default settings (collapsible, expanded).

### Explicit Group Configuration

Use `NavigationGroup` to control the group's icon, initial state, and sort:

```php
use Larafusion\Navigation\NavigationGroup;

// In PanelProvider::boot() or a bootUsing() callback:
LarafusionManager::registerNavGroup('Administration', NavigationGroup::make()
    ->label('Administration')
    ->icon('shield')
    ->collapsible()
    ->collapsed()     // start closed
    ->sort(100)
);
```

`NavigationGroup` methods:

| Method | Description |
|---|---|
| `make()` | Factory |
| `label(string)` | Group label (also used as the registration key) |
| `icon(string)` | Lucide icon next to the group label |
| `collapsible(bool)` | Show expand/collapse toggle (default: `true`) |
| `collapsed(bool)` | Start in collapsed state |
| `sort(int)` | Sort order relative to other groups and ungrouped items |

---

## Extra Navigation Items

Add items that are not backed by a resource or page (e.g. external links):

```php
->navigationItems([
    [
        'label' => 'Documentation',
        'icon'  => 'book-open',
        'url'   => 'https://docs.example.com',
        'group' => null,
        'sort'  => 99,
    ],
    [
        'label' => 'Status Page',
        'icon'  => 'activity',
        'url'   => 'https://status.example.com',
        'sort'  => 100,
    ],
])
```

---

## User Menu Items

The user menu (avatar dropdown in the topbar or sidebar footer) is configured separately:

```php
->userMenuItems([
    'profile' => UserMenuItem::make('profile')
        ->label('My Profile')
        ->url('/admin/profile')
        ->icon('user'),
    'logout'  => UserMenuItem::make('logout')
        ->label('Sign Out'),
    UserMenuItem::make('settings')
        ->label('Settings')
        ->url('/admin/settings')
        ->icon('settings')
        ->visible(fn() => auth()->user()?->is_admin),
])
```

`UserMenuItem` methods:

| Method | Description |
|---|---|
| `make(string $key)` | Factory |
| `label(string)` | Display text |
| `url(string)` | Target URL |
| `icon(string)` | Lucide icon |
| `openUrlInNewTab()` | Open in new tab |
| `visible(Closure)` | `(): bool` — evaluated server-side |

The string keys `'profile'` and `'logout'` override built-in items. All other items are appended below the profile item. `->visible(Closure)` is evaluated server-side; invisible items are never serialised to the response.

---

## User Menu Position

```php
->userMenu('topbar')    // default — avatar in the topbar right
->userMenu('sidebar')   // avatar at the bottom of the sidebar
->userMenu(false)       // disable entirely
```

---

## Real World Examples

### Multi-Group Navigation

```php
class PostResource extends Resource
{
    protected static string  $navigationGroup = 'Content';
    protected static int     $navigationSort  = 1;
}

class PageResource extends Resource
{
    protected static string  $navigationGroup = 'Content';
    protected static int     $navigationSort  = 2;
}

class UserResource extends Resource
{
    protected static string  $navigationGroup = 'Administration';
    protected static int     $navigationSort  = 1;
}

class RoleResource extends Resource
{
    protected static string  $navigationGroup = 'Administration';
    protected static int     $navigationSort  = 2;
}
```

With explicit group configuration:

```php
->bootUsing(function () {
    LarafusionManager::registerNavGroup('Content', NavigationGroup::make()
        ->icon('layout')
        ->sort(1)
    );
    LarafusionManager::registerNavGroup('Administration', NavigationGroup::make()
        ->icon('shield')
        ->collapsible()
        ->collapsed()
        ->sort(10)
    );
})
```

---

## Best Practices

- **Use `$navigationSort` consistently.** Without it, item order is determined by auto-discovery iteration order (filesystem order), which is unreliable.
- **Use `getNavigationBadge()`** only for counts that are cheap to compute (cached or indexed). The navigation is rebuilt on every request.
- **Keep group names short** — they appear as collapsed section headings in a narrow sidebar.
- **Use `->userMenu('sidebar')`** for panels where the topbar is hidden (`->topbar(false)`).

---

## Common Mistakes

**Setting `$navigationGroup` to a string that is not registered with `registerNavGroup()`.** The group node is still created (from `LarafusionManager::getNavigation()`) but uses default settings (no icon, collapsible, expanded). Explicitly register the group to control its sort and icon.

**Returning a large count from `getNavigationBadge()` without caching.** This query runs on every request, for every logged-in user. Cache the result: `return cache()->remember('pending-users', 60, fn() => User::pending()->count()) ?: null`.

**Adding `'profile'` as a keyed user menu item but also calling `->profile()`** on the panel. Both add a profile link; the explicit `UserMenuItem` with key `'profile'` replaces the default one. They do not stack.

---

## Related Features

- [Resources](resources.md) — `$navigationLabel`, `$navigationIcon`, `$navigationGroup`, `getNavigationBadge()`
- [Custom Pages](custom-pages.md) — `$showInNavigation`, `$navigationGroup` on pages
- [Panel Configuration](panel-configuration.md) — `->navigationItems()`, `->userMenu()`, `->userMenuItems()`
- [Plugins](plugins.md) — `LarafusionPlugin::navigationItems()`
