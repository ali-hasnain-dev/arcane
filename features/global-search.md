# Global Search

## Overview

Global search provides a ⌘K (Ctrl+K) command palette that lets admin users search across all resources simultaneously. Typing a query returns results from every resource that has `$searchable` columns defined, grouped by resource type.

---

## Why This Feature Exists

Admin users managing multiple resource types need a way to find a specific record without knowing which section it lives in. Global search collapses navigation barriers: instead of going to Users → filtering for "john", you press ⌘K, type "john", and jump directly to the record.

---

## Core Concepts

### Activation

Enable globally in the panel:

```php
->globalSearch()
// or
->globalSearch(true)
```

The React `GlobalSearch` component reads `usePage().props.larafusion.panel.globalSearch`. When `true`, it renders the search palette trigger button in the topbar and listens for the ⌘K / Ctrl+K keyboard shortcut.

### Searchable Resources

Only resources with a non-empty `$searchable` array participate:

```php
class UserResource extends Resource
{
    protected static array $searchable = ['name', 'email'];
}
```

Resources with `$searchable = []` are skipped by `SearchController`.

### Minimum Query Length

The controller enforces a minimum of 2 characters:

```php
if (strlen($query) < 2) {
    return response()->json([]);
}
```

This prevents accidental full-table scans from single-character queries.

---

## Architecture

### Endpoint

`GET /admin/search?q={query}`

Handled by `Larafusion\Http\Controllers\SearchController::search()`.

### Search Logic

```php
foreach (LarafusionManager::all() as $slug => $resourceClass) {
    // 1. Skip resources the user cannot view
    if (!$resourceClass::canViewAny()) continue;

    // 2. Skip resources with no searchable columns
    $searchable = $resourceClass::getSearchable();
    if (empty($searchable)) continue;

    // 3. Build the search query (OR LIKE across all searchable columns)
    $dbQuery->where(function ($q) use ($searchable, $query) {
        foreach ($searchable as $col) {
            $q->orWhere($col, 'like', "%{$query}%");
        }
    });

    // 4. Limit to 5 results per resource
    $hits = $dbQuery->limit(5)->get();

    // 5. Format results
    foreach ($hits as $record) {
        $results[] = [
            'resource'    => $slug,
            'label'       => $resourceClass::getNavigationLabel(),
            'id'          => $record->getKey(),
            'title'       => $resourceClass::getGlobalSearchTitle($record),
            'description' => $resourceClass::getGlobalSearchDescription($record),
            'url'         => route('larafusion.resource.show', [$slug, $record->getKey()]),
            'editUrl'     => route('larafusion.resource.edit', [$slug, $record->getKey()]),
        ];
    }
}
```

Results are returned as a flat JSON array sorted by the resource iteration order (which reflects `$navigationSort`).

---

## Customising Search Results

### Override Title and Description

```php
class UserResource extends Resource
{
    protected static array $searchable = ['name', 'email'];

    // Primary line in search results (default: first searchable column value)
    public static function getGlobalSearchTitle(Model $record): string
    {
        return "{$record->name} ({$record->email})";
    }

    // Secondary line (default: second searchable column value, or null)
    public static function getGlobalSearchDescription(Model $record): ?string
    {
        return "Joined " . $record->created_at->diffForHumans();
    }
}
```

### Default Behaviour

When `getGlobalSearchTitle()` is not overridden:
- Returns `(string) $record->{$searchable[0]}` if `$searchable` is non-empty
- Returns `'#' . $record->getKey()` as a fallback

When `getGlobalSearchDescription()` is not overridden:
- Returns `(string) $record->{$searchable[1]}` if there are at least 2 searchable columns
- Returns `null` otherwise

---

## Configuration

| Resource Property/Method | Description |
|---|---|
| `$searchable` | Column names searched with `LIKE "%q%"` |
| `getGlobalSearchTitle(Model $record): string` | Primary result line |
| `getGlobalSearchDescription(Model $record): ?string` | Secondary result line |
| `canViewAny(): bool` | Gate — `false` excludes the resource from search |

| Panel Method | Description |
|---|---|
| `->globalSearch()` | Enable global search in the topbar |

---

## Real World Examples

### Multi-Column Search

```php
class ProductResource extends Resource
{
    protected static array $searchable = ['name', 'sku', 'barcode'];

    public static function getGlobalSearchTitle(Model $record): string
    {
        return "{$record->name} — {$record->sku}";
    }

    public static function getGlobalSearchDescription(Model $record): ?string
    {
        return "\${$record->price} · " . ($record->stock_quantity > 0 ? 'In stock' : 'Out of stock');
    }
}
```

### User Search with Avatar

```php
class UserResource extends Resource
{
    protected static array $searchable = ['name', 'email', 'phone'];

    public static function getGlobalSearchTitle(Model $record): string
    {
        return $record->name;
    }

    public static function getGlobalSearchDescription(Model $record): ?string
    {
        return $record->email;
    }
}
```

---

## Best Practices

- **Keep `$searchable` to the columns users actually search on.** Every additional column doubles the number of `LIKE` clauses. Two or three columns is usually enough.
- **Add database indexes** for all columns in `$searchable`. Global search fires LIKE queries across every registered resource simultaneously. Unindexed full-text columns can cause serious performance degradation.
- **Use `getGlobalSearchTitle()` to return a meaningful identifier**, not just the first DB column value. `"John Smith (john@example.com)"` is more scannable than `"john@example.com"` alone.
- **Scope `canViewAny()` correctly** — global search respects it. A user with limited resource access only sees results from resources they can view.

---

## Common Mistakes

**Setting `$searchable` but not enabling `->globalSearch()` on the panel.** The search endpoint exists and functions, but the UI trigger is not shown. The two are independent: `$searchable` feeds both global search and the per-table search box on the index page.

**Including foreign key columns (e.g. `user_id`) in `$searchable`.** LIKE searching an integer FK column produces no meaningful results (searching `%john%` in a numeric column). Only include text columns.

**Expecting global search to search related model columns.** The `SearchController` queries the primary model with `orWhere($col, 'like', ...)`. It does not join or eager-load relations. To search a user's company name, either denormalise the company name onto the user record or override `canViewAny()` on `UserResource` to query with a join.

---

## Security Considerations

- `canViewAny()` is checked for each resource before querying. Users cannot search for records in resources they cannot view.
- Results include `url` (show page) and `editUrl` (edit page). React uses `resource.can.edit` to decide whether to show the edit link. The server enforces the same gate when the user navigates to the edit URL.
- The search query is passed through parameterised `LIKE` — no SQL injection is possible.

---

## Related Features

- [Resources](resources.md) — `$searchable`, `getGlobalSearchTitle()`, `getGlobalSearchDescription()`
- [Panel Configuration](panel-configuration.md) — `->globalSearch()`
