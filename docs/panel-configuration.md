# Panel Configuration

## Panel Configuration

All configuration lives in `app/Providers/Larafusion/AdminPanelProvider.php`.

```php
namespace App\Providers\Larafusion;

use Larafusion\Panel;
use Larafusion\PanelProvider;

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
    }
}
```

### Identity

```php
->id('admin')                   // internal panel identifier
->path('admin')                 // URL prefix — panel lives at /admin
->domain('admin.example.com')  // serve on a custom subdomain
```

### Authentication

```php
->login()                        // enable built-in /admin/login (default: true)
->registration()                 // enable /admin/register (default: false)
->forgotPassword()               // enable /admin/forgot-password (default: false)
->profile()                      // enable /admin/profile (name, email, password)
->middleware(['web', 'auth'])    // middleware for ALL protected routes
->authMiddleware(['web'])        // middleware for login/password-reset routes only
->authGuard('web')               // which auth guard to use (default: 'web')
->authPasswordBroker('users')    // password broker for reset emails (default: 'users')
->revealablePasswords()          // show eye-toggle on password fields (default: true)
->revealablePasswords(false)     // disable eye-toggle
```

#### Customising auth URL slugs

```php
->loginSlug('sign-in')           // /admin/sign-in instead of /admin/login
->registrationSlug('sign-up')    // /admin/sign-up instead of /admin/register
->forgotPasswordSlug('reset')    // /admin/reset instead of /admin/forgot-password
->profileSlug('account')         // /admin/account instead of /admin/profile
```

---

### User Contracts

Implement these interfaces on your `User` model to unlock built-in behaviour.

#### `LarafusionUser` — control panel access

```php
use Larafusion\Contracts\LarafusionUser;
use Larafusion\Panel;

class User extends Authenticatable implements LarafusionUser
{
    public function canAccessPanel(Panel $panel): bool
    {
        // allow only verified admins
        return $this->hasVerifiedEmail()
            && $this->role === UserRole::Admin;
    }
}
```

When a user logs in successfully but `canAccessPanel()` returns `false`, they are immediately logged out and shown an authorization error. If the model does **not** implement `LarafusionUser`, all authenticated users are allowed in.

#### `HasLarafusionName` — custom display name

```php
use Larafusion\Contracts\HasLarafusionName;

class User extends Authenticatable implements HasLarafusionName
{
    public function getLarafusionName(): string
    {
        return $this->display_name ?? $this->name;
    }
}
```

Used in the user menu header and wherever the user's name is shown in the panel.

#### `HasLarafusionAvatar` — custom avatar image

```php
use Larafusion\Contracts\HasLarafusionAvatar;

class User extends Authenticatable implements HasLarafusionAvatar
{
    public function getLarafusionAvatarUrl(): ?string
    {
        return $this->avatar_url
            ?? 'https://ui-avatars.com/api/?name=' . urlencode($this->name);
    }
}
```

When implemented, the user menu shows a circular avatar image instead of the default initials badge.

---

### Profile Page

Enable the built-in profile editing page at `/{panel}/profile`:

```php
->profile()
```

The profile page lets users:
- Update their name and email address
- Change their password (current password required)

Link to it from the user menu:

```php
->userMenuItems([
    'profile' => UserMenuItem::make('profile')
        ->label('My Profile')
        ->url('/admin/profile'),
])
```

Or rely on auto-linking — when `->profile()` is enabled, the user's name in the dropdown automatically becomes a clickable link to the profile page.

### Branding

```php
->brand('My App')
->brandLogo('/images/logo.svg')
->darkModeBrandLogo('/images/logo-dark.svg')
->brandLogoHeight('1.75rem')
->favicon('/images/favicon.ico')
```

### Font

**Default: Inter** — designed for UI, used by Linear, Vercel, GitHub. Loaded automatically from Google Fonts with no extra setup.

Larafusion injects the stylesheet, sets the `--larafusion-font` CSS variable on `:root`, and applies `font-family` to `<body>` — including on auth pages. Preconnect hints for `fonts.googleapis.com` and `fonts.gstatic.com` are added automatically.

```php
// Inter is the default — no call needed unless you want to change it
->font('Inter')                      // default, variable weight 300–900
->font('DM Sans')                    // clean geometric sans
->font('Nunito')                     // rounded, friendly
->font('Plus Jakarta Sans')          // modern, excellent readability
->font('Geist', '400;500;600;700')   // Vercel's font, with specific weights
->font(null)                         // disable Google Fonts (use system-ui)
```

**Recommended admin fonts:**

| Font | Style | Best for |
|------|-------|----------|
| `Inter` *(default)* | Neutral, high-legibility | Any admin panel |
| `DM Sans` | Geometric, modern | SaaS / startup style |
| `Plus Jakarta Sans` | Clean, contemporary | Dashboards |
| `Nunito` | Rounded, friendly | Consumer-facing tools |
| `Geist` | Minimal, technical | Developer tools |

### Theme & Dark Mode

```php
->theme('violet')              // built-in theme
->darkMode()                   // enable dark mode by default
->defaultThemeMode('system')   // 'light' | 'dark' | 'system'
```

The user can switch between Light / Dark / System at any time via the avatar dropdown. Their choice is stored in `localStorage`. A FOUC-prevention inline script in `app.blade.php` reads this key and applies the `.dark` class before the browser paints the first frame, eliminating the dark-mode flash on reload.

### Layout

```php
// Sidebar (default mode)
->sidebarWidth('16rem')
->collapsedSidebarWidth('4rem')
->sidebarCollapsibleOnDesktop()

// Switch to horizontal top navigation bar
->topNavigation()

// Content
->maxContentWidth('90rem')
->breadcrumbs()          // show breadcrumb trail (default: true)
->topbar()               // show topbar (default: true)
->topbar(false)          // hide topbar — activates full-bleed sidebar layout (see below)
```

The sidebar and topbar share the same background colour so they form a unified header strip across the top of the page. The sidebar collapse/expand toggle is rendered in the **topbar** (leftmost position, beside any breadcrumbs) rather than inside the sidebar itself.

#### `->topbar(false)` — full-bleed sidebar layout

Calling `->topbar(false)` removes the topbar entirely and switches to a unified layout where sidebar and content share the same background. The following changes happen automatically:

| Feature | Normal (topbar on) | No-topbar mode |
|---------|-------------------|----------------|
| Sidebar logo area bg | `white / zinc-950` (distinct from content) | Inherits sidebar bg (unified) |
| Sidebar collapse toggle | Rendered in topbar | Rendered in sidebar brand area |
| User menu | Topbar or sidebar (configured) | **Always forced to sidebar bottom footer** |
| Global search | In topbar | **Moved into sidebar**, full-width input, results centred in content area |
| Global search alignment default | `center` | `center` (centred in content area, right of sidebar) |

```php
Panel::make()
    ->topbar(false)
    ->globalSearch()                       // search moves into the sidebar automatically
    ->globalSearchAlignment('right')       // override default centre alignment if needed
    ->globalSearchSize('wide')             // wider results panel
```

### Topbar Features

Both are **off by default**. Opt in explicitly:

```php
->globalSearch()     // show global search box in topbar (Cmd/Ctrl+K)
->notifications()    // show notification bell icon in topbar
```

#### Global search appearance

```php
->globalSearchMode('dropdown')    // 'dropdown' (default) or 'modal'
->globalSearchAlignment('center') // 'left', 'center' (default), or 'right'
->globalSearchSize('default')     // 'default' or 'wide'
```

See [Global Search](global-search.md) for full details and per-option behaviour.

### Prefetch

Control Inertia v3 link prefetching for all navigation links:

```php
->prefetch()                         // enable (default: disabled)
->prefetch(false)                    // disable explicitly

->prefetchStrategy('hover')          // trigger after 75ms hover (default)
->prefetchStrategy('click')          // trigger on mousedown
->prefetchStrategy('mount')          // trigger immediately when link mounts
->prefetchStrategy(['mount', 'hover'])  // combine strategies

->prefetchCacheFor('30s')            // cache for 30 seconds (default)
->prefetchCacheFor('5m')             // cache for 5 minutes
->prefetchCacheFor(5000)             // cache for 5000ms
->prefetchCacheFor(['30s', '1m'])    // stale-while-revalidate: fresh for 30s, serve stale up to 1m

->prefetchFlushOnNavigate()          // flush entire cache on every navigation
```

When enabled, all sidebar nav links, table row action links (View, Edit), Show page Edit button, Index page Create button, and Dashboard resource cards get prefetch props automatically.

### Behaviour

```php
->unsavedChangesAlerts()    // warn before leaving a form page with unsaved changes (table checkboxes do NOT trigger this)
->databaseTransactions()    // wrap every mutation in a DB transaction
->strictAuthorization()     // throw AuthorizationException instead of hiding items
->pagination(25)            // default per-page size (default: 10; options shown: 5, 10, 25, 50)
->simplePagination()        // show only Prev/Next buttons globally (individual table->simplePagination() takes precedence)
->simplePagination(false)   // explicit false; numbered pagination everywhere (default)
```

### Navigation Items

Add custom navigation items not tied to any resource:

```php
->navigationItems([
    [
        'label' => 'Documentation',
        'icon'  => 'external-link',
        'url'   => 'https://docs.example.com',
        'sort'  => 99,
    ],
])
```

### User Menu

The user menu appears in the top-right corner of the admin layout (or at the bottom of the sidebar). It always shows the logged-in user's name and email, a theme-mode toggle, and a Sign out button. You can customise all of this through `userMenu()` and `userMenuItems()`.

#### Disable the user menu

```php
->userMenu(false)
```

#### Move to the sidebar

```php
->userMenu('sidebar')   // renders at the bottom of the left sidebar instead of the topbar
```

#### Add custom items

```php
use Larafusion\Navigation\UserMenuItem;

->userMenuItems([
    UserMenuItem::make('settings')
        ->label('Settings')
        ->url('/admin/settings')
        ->icon('settings'),

    UserMenuItem::make('docs')
        ->label('Documentation')
        ->url('https://docs.example.com', openInNewTab: true)
        ->icon('book-open'),
])
```

#### Send a POST request from an item

Some actions (e.g. "Lock session") must not be bookmarkable. Use `->postToUrl()` to issue a POST instead of a GET:

```php
UserMenuItem::make('lock')
    ->label('Lock session')
    ->url(fn () => route('session.lock'))
    ->icon('lock')
    ->postToUrl(),
```

#### Conditionally hide an item

```php
UserMenuItem::make('admin-tools')
    ->label('Admin Tools')
    ->url('/admin/tools')
    ->visible(fn (): bool => auth()->user()?->isAdmin() ?? false),

// or

UserMenuItem::make('debug')
    ->label('Debug Panel')
    ->url('/debug')
    ->hidden(fn (): bool => app()->isProduction()),
```

#### Customise the profile link

Pass the `'profile'` string key to override the built-in profile entry at the top of the menu:

```php
->userMenuItems([
    'profile' => UserMenuItem::make('profile')
        ->label('Edit profile')
        ->url(fn () => route('profile.edit')),
])
```

#### Customise the logout link

Pass the `'logout'` string key:

```php
->userMenuItems([
    'logout' => UserMenuItem::make('logout')
        ->label('Sign out of all devices')
        ->url(fn () => route('logout.all'))
        ->postToUrl(),
])
```

#### UserMenuItem API

| Method                           | Description                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `::make(string $name)`           | Create a new item with the given internal name                                   |
| `->label(string)`                | Display text shown in the menu                                                   |
| `->url(string\|Closure, bool)`   | Link URL; pass `true` as second arg to open in a new tab                        |
| `->icon(string)`                 | Lucide icon name shown next to the label                                         |
| `->postToUrl()`                  | Submit via POST instead of a regular GET navigation                              |
| `->visible(bool\|Closure)`       | Show only when the condition is truthy (evaluated server-side)                   |
| `->hidden(bool\|Closure)`        | Hide when the condition is truthy (inverse of `visible`)                         |

### Boot Hook

Run code during the panel boot phase — register macros, event listeners, etc.:

```php
->bootUsing(function (Panel $panel) {
    \App\Models\User::observe(\App\Observers\UserObserver::class);
})
```

### Full Example

```php
return $panel
    ->id('admin')
    ->path('admin')
    ->login()

    // Branding
    ->brand('Acme Admin')
    ->brandLogo('/images/logo.svg')
    ->darkModeBrandLogo('/images/logo-dark.svg')
    ->brandLogoHeight('1.75rem')
    ->favicon('/images/favicon.ico')

    // Font
    ->font('DM Sans')

    // Theme
    ->theme('violet')
    ->defaultThemeMode('system')

    // Layout
    ->sidebarWidth('16rem')
    ->sidebarCollapsibleOnDesktop()
    ->maxContentWidth('90rem')
    ->breadcrumbs()

    // Topbar features (opt in)
    ->globalSearch()
    ->notifications()

    // Prefetch (opt in)
    ->prefetch()
    ->prefetchStrategy('hover')
    ->prefetchCacheFor('30s')

    // Behaviour
    ->unsavedChangesAlerts()
    ->databaseTransactions()
    ->pagination(20)
    ->simplePagination()    // Prev/Next only; override per-table with ->simplePagination(false)

    // Boot hook
    ->bootUsing(fn ($panel) => logger('Larafusion booted'));
```

---
