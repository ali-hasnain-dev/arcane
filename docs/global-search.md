# Global Search

Every Arcane panel can expose a global search bar (⌘/Ctrl+K). Enable it in your panel provider:

```php
->globalSearch()
```

## Resource configuration

```php
// Define which columns are searched
protected static array $searchable = ['title', 'slug', 'body'];

// Customise result display
public static function getGlobalSearchTitle(Model $record): string
{
    return $record->title;
}

public static function getGlobalSearchDescription(Model $record): ?string
{
    return $record->category?->name;
}
```

Results group by resource and support keyboard navigation (↑↓ arrows, Enter to visit).

---

## Appearance options

### Mode

Controls how the search panel opens:

| Value | Behaviour |
|-------|-----------|
| `'dropdown'` | Drops down directly below the trigger button **(default)** |
| `'modal'` | Opens a full-screen centred palette (classic command-palette style) |

```php
->globalSearchMode('modal')     // switch to modal / palette mode
->globalSearchMode('dropdown')  // explicit dropdown (default)
```

### Alignment

Controls the horizontal position of the search panel:

| Value | Modal behaviour | Dropdown behaviour |
|-------|----------------|--------------------|
| `'left'` | Panel floats to the left | Panel left-edge aligns with trigger left-edge |
| `'center'` | Panel is centred on screen **(default)** | Panel is centred on the trigger button |
| `'right'` | Panel floats to the right | Panel right-edge aligns with trigger right-edge |

```php
->globalSearchAlignment('left')    // left-aligned panel
->globalSearchAlignment('center')  // centred (default)
->globalSearchAlignment('right')   // right-aligned panel
```

### Size

Controls the width of the search panel:

| Value | Width |
|-------|-------|
| `'default'` | Compact — `20rem` for dropdown, `36rem` (`max-w-xl`) for modal **(default)** |
| `'wide'` | Wider — `32rem` for dropdown, `42rem` (`max-w-2xl`) for modal; responsive on small screens |

```php
->globalSearchSize('wide')     // slightly wider panel
->globalSearchSize('default')  // default width (default)
```

---

## Sidebar behaviour

In sidebar layouts, when the search panel is open the **sidebar remains fully visible and clickable** — only the content area receives the backdrop overlay. Navigating via the sidebar while search is open closes the overlay automatically through standard Inertia navigation.

---

## Full example

```php
->globalSearch()
->globalSearchMode('dropdown')
->globalSearchAlignment('right')
->globalSearchSize('wide')
```
