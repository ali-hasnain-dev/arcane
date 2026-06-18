# Themes

## Themes

### Built-in Themes

| Name      | Description                     |
| --------- | ------------------------------- |
| `violet`  | Purple/violet primary (default) |
| `slate`   | Cool slate grey                 |
| `rose`    | Rose/pink                       |
| `emerald` | Green/emerald                   |
| `amber`   | Amber/orange                    |
| `sky`     | Sky blue                        |

```php
->theme('violet')
->theme('emerald')
```

### Dark Mode

Dark mode is applied via Tailwind's `dark:` variant. When the user selects Dark or System in the avatar dropdown, `.dark` is toggled on `<html>`. The `arcane:install` command adds the required variant definition to `resources/css/app.css`:

```css
@import "tailwindcss";

/* Enable Tailwind dark: variants when .dark is on <html> */
@custom-variant dark (&:where(.dark, .dark *));

/* Scan vendor package component files for Tailwind classes */
@source '../../vendor/arcane/*/resources/js/**/*.{ts,tsx}';
```

### FOUC Prevention

The `app.blade.php` created by `arcane:install` includes an inline `<script>` in `<head>` that reads the user's preference from `localStorage` and applies `.dark` before the browser paints the first frame. This eliminates the light-mode flash on page reload when dark mode is active.

---
