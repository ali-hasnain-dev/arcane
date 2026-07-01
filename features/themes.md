# Themes

## Overview

Larafusion ships with 8 built-in colour themes, a dark mode system, FOUC prevention, Google Fonts integration, a CSS variable override API, and automatic colour derivation — pass a single hex and Larafusion auto-generates the full companion set. All styling is driven by `--larafusion-*` CSS custom properties injected into the document's root element from the `larafusion.theme.cssVars` Inertia prop.

---

## Why This Feature Exists

Admin panel aesthetics matter for adoption. Different organisations have different brand colours. Rather than publishing a static stylesheet, Larafusion ships CSS variables that the React `ThemeProvider` writes to `:root` dynamically — making theme switches instant, zero-reload, and persistent across sessions via `localStorage`.

---

## Built-in Themes

| Name | Primary | Description |
|---|---|---|
| `stone` | `#292524` (Tailwind Stone-800) | Warm dark neutral — **default** |
| `shadcn` | `#18181b` (near-black) | Neutral, shadcn/ui inspired |
| `violet` | `#7c3aed` | Purple |
| `slate` | `#475569` | Cool grey-blue |
| `rose` | `#e11d48` | Red/pink |
| `emerald` | `#059669` | Green |
| `amber` | `#d97706` | Orange-yellow |
| `sky` | `#0284c7` | Blue |

### CSS Variable Map (per theme)

Each theme sets:

| Variable | Description |
|---|---|
| `--larafusion-primary` | Primary action colour (buttons, links, active nav) |
| `--larafusion-primary-hover` | Hover state for primary colour |
| `--larafusion-primary-light` | Light tint (used for badges, highlights) |
| `--larafusion-primary-ring` | Focus ring colour |
| `--larafusion-sidebar-bg` | Sidebar background |
| `--larafusion-sidebar-text` | Sidebar text colour |
| `--larafusion-sidebar-active` | Active nav item background |

Additional universal variables:

| Variable | Source |
|---|---|
| `--larafusion-font` | From `->font()` on the panel |
| `--larafusion-font-mono` | Default: `"JetBrains Mono", monospace` |
| `--larafusion-radius` | Border radius (default `0.5rem`) |

---

## Configuration

### Select a Theme

```php
->theme('stone')    // default — warm dark neutral (#292524)
->theme('violet')
->theme('emerald')
->theme('shadcn')
```

### Set a Primary Colour (auto-derivation)

Pass any hex to `->colors(['primary' => '#hex'])` and Larafusion auto-derives the full companion set — hover, light tint, focus ring, sidebar background, sidebar text — so you never have to specify every variable manually:

```php
->colors(['primary' => '#292524'])   // auto-derives all companions
->colors(['primary' => '#6366f1'])   // indigo — same auto-derivation
->colors(['primary' => '#0f766e'])   // teal
```

For dark colours (lightness < 40 %) the derivation produces a lighter tint and keeps the sidebar dark-on-dark. For saturated colours (violet, rose, etc.) it builds a dark sidebar background regardless of the primary hue.

You can still override individual derived values by including extra keys — they take priority:

```php
->colors([
    'primary'    => '#292524',   // derives hover, light, ring, sidebar-*
    'sidebar-bg' => '#ffffff',   // but force a white sidebar
])
```

### Hex shorthand on `->theme()`

`->theme()` also accepts a hex directly as a convenience alias for `->colors(['primary' => $hex])`:

```php
->theme('#292524')   // same as ->colors(['primary' => '#292524'])
->theme('#6366f1')
```

### Enable Dark Mode

```php
->theme('violet', true)    // enable dark mode + set theme
->darkMode()               // enable without changing theme
->defaultThemeMode('dark')  // 'light' | 'dark' | 'system'
```

`'system'` respects the OS dark/light mode preference via the `prefers-color-scheme` media query.

### Custom Colour Overrides

Override specific CSS variables without replacing the full theme:

```php
->colors([
    'primary'       => '#6366f1',   // indigo
    'primary-hover' => '#4f46e5',
    'primary-light' => '#e0e7ff',
    'primary-ring'  => '#a5b4fc',
    'sidebar-bg'    => '#1e1b4b',
    'sidebar-text'  => '#c7d2fe',
    'sidebar-active' => '#4f46e5',
])
```

These are merged on top of the selected theme's values in `ThemeManager::cssVars()`.

### Custom Font

```php
->font('DM Sans', '300..900')
->font('Nunito')
->font('Inter')     // default
```

Larafusion injects `https://fonts.googleapis.com/css2?family={font}:wght@{weight}&display=swap` automatically. The font is applied via `--larafusion-font`.

### Custom Border Radius

```php
->colors(['radius' => '0.75rem'])   // more rounded
->colors(['radius' => '0.25rem'])   // sharper
->colors(['radius' => '0'])         // square
```

---

## ThemeManager Internals

`Larafusion\Themes\ThemeManager` reads configuration from:
1. `config('larafusion.theme')` (set by `PanelProvider::register()`)
2. Session overrides from `SettingsController` (`larafusion_theme`, `larafusion_dark_mode` session keys)

Session overrides allow the admin user to switch theme/dark mode from the Settings page at runtime. These persist in the PHP session and override the panel config until the session expires or the user switches back.

`cssVars()` merges the selected theme's token map with any `$colors` overrides and returns a flat `['--larafusion-{key}' => '#value', ...]` map. This map is included in `larafusion.theme.cssVars` on every Inertia response. React's `ThemeProvider` writes these to `document.documentElement.style.setProperty()` on mount and whenever the prop changes.

---

## FOUC Prevention

The Larafusion install command patches `resources/views/app.blade.php` to include an inline script in `<head>` that:
1. Reads the saved theme from `localStorage`.
2. Applies the correct `data-theme` attribute and dark class to `<html>` before React renders.

This prevents a Flash of Unstyled Content where the default theme flashes briefly before the user's saved preference takes effect.

---

## Dark Mode

When dark mode is enabled, the React `ThemeProvider` adds the `dark` class to `<html>`. Larafusion's Tailwind config uses `darkMode: 'class'`. All UI components have `dark:` variants.

`defaultThemeMode('system')` reads `window.matchMedia('(prefers-color-scheme: dark)')`. Changes to the OS preference update the class in real time via a `MediaQueryList` event listener.

---

## User-Switchable Theme

The Settings page at `/admin/settings` lets users switch themes at runtime. `SettingsController::updateTheme()` stores the chosen theme and dark mode preference in the session. The next page load picks up the session value, overriding the panel default.

This allows a panel-level `->theme('emerald')` default while individual admin users choose a different theme for their session.

---

## Real World Examples

### Brand-Aligned Custom Theme

```php
->theme('violet')
->colors([
    'primary'        => '#0f172a',    // company dark navy
    'primary-hover'  => '#1e293b',
    'primary-light'  => '#f1f5f9',
    'primary-ring'   => '#94a3b8',
    'sidebar-bg'     => '#0f172a',
    'sidebar-text'   => '#94a3b8',
    'sidebar-active' => '#1d4ed8',    // company blue for active item
])
->font('Plus Jakarta Sans', '400..700')
```

### Minimal Neutral Panel

```php
->theme('shadcn')
->defaultThemeMode('light')
->font('Inter')
```

### Dark-First Panel

```php
->theme('violet')
->defaultThemeMode('dark')
->darkMode()
->colors([
    'primary' => '#a78bfa',   // lighter violet for dark backgrounds
])
```

---

## Best Practices

- **Start with `->defaultThemeMode('system')`** unless stakeholders have a hard requirement for light-only. It respects user preferences automatically.
- **Use semantic color tokens** for any Tailwind classes you write in custom components: `bg-[var(--larafusion-primary)]` not `bg-violet-600`. Your custom component will respect theme changes automatically.
- **Test all themes** if you ship a custom Larafusion-based panel to clients. Some badge colors (e.g. amber warning on amber theme) clash. Adjust `--larafusion-primary-light` if needed.
- **Keep `->font()` conservative** — stick to system UI fonts or popular Google Fonts (`Inter`, `DM Sans`, `Nunito`). Unusual fonts can break form label readability.

---

## Common Mistakes

**Setting `->colors(['primary' => '#7c3aed'])` without also updating `primary-hover`, `primary-light`, and `primary-ring`.** These four variables are closely related; updating only `primary` causes hover and focus states to remain in the original theme's colour.

**Relying on hardcoded Tailwind colour classes in custom components.** `bg-violet-600` ignores the theme. Use `bg-[var(--larafusion-primary)]` or the Tailwind `larafusion-primary` colour alias if configured.

**Expecting `->darkMode()` alone to enable dark styling.** The `dark` class must also be applied to `<html>`, which the React `ThemeProvider` does. If you build components outside the Larafusion layout, you need to apply this class yourself.

---

## Related Features

- [Panel Configuration](panel-configuration.md) — `->theme()`, `->font()`, `->colors()`, `->darkMode()`
- [Custom Pages](custom-pages.md) — custom pages inherit the theme from the layout
