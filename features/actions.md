# Actions (Legacy API)

## Overview

The legacy actions API (`larafusion/actions` package) predates the `Table::recordActions()` builder. It provides two classes:

- **`ButtonAction`** — a server-side callback action
- **`LinkAction`** — a client-side URL navigation action

Both are returned from `Resource::actions()` and rendered by the `BasicTable` as per-row buttons. New code should prefer `Table::recordActions([Action::make(...)])` from `larafusion/tables`. The legacy API is fully supported and will not be removed.

---

## Why This Feature Exists

Early versions of Larafusion used a flat `actions()` array on the resource rather than integrating actions into the table builder. The `larafusion/actions` package preserves backward compatibility for existing resources.

---

## ButtonAction

`Larafusion\Actions\ButtonAction`

A clickable button that executes a PHP callback when clicked.

```php
use Larafusion\Actions\ButtonAction;

public static function actions(): array
{
    return [
        ButtonAction::make('publish')
            ->label('Publish')
            ->icon('send')
            ->color('success')
            ->confirm('Publish this post?')
            ->action(function ($record) {
                $record->update(['status' => 'published', 'published_at' => now()]);
            })
            ->successMessage('Post published.')
            ->visibleWhen(fn($record) => $record->status === 'draft'),
    ];
}
```

### ButtonAction Methods

| Method | Description |
|---|---|
| `make(string $key)` | Factory; key is the route segment for the action endpoint |
| `label(string)` | Button label |
| `icon(string)` | Lucide icon name |
| `color(string)` | `default` \| `primary` \| `success` \| `warning` \| `danger` |
| `confirm(?string)` | Confirmation dialog message; `null` = no dialog |
| `action(callable)` | `($record) => mixed` server callback |
| `successMessage(string)` | Flash message after execution |
| `redirectTo(string)` | Redirect URL after execution (default: resource index) |
| `visibleWhen(callable)` | `($record): bool` — hides the button when false |
| `hidden(bool)` | Always hide |

### Execution

`ActionController` finds the action by key in both `Resource::actions()` (legacy) and `Table::getRecordActions()` (new builder). The controller calls `$action->execute($record, $request->all())`, returns JSON for array/object results, or redirects for null.

---

## LinkAction

`Larafusion\Actions\LinkAction`

A button that navigates to a URL without a server round-trip.

```php
use Larafusion\Actions\LinkAction;

public static function actions(): array
{
    return [
        LinkAction::make('preview')
            ->label('Preview')
            ->icon('eye')
            ->url(fn($record) => "/posts/{$record->slug}")
            ->newTab()
            ->visibleWhen(fn($record) => $record->status === 'published'),
    ];
}
```

### LinkAction Methods

| Method | Description |
|---|---|
| `make(string $key)` | Factory |
| `label(string)` | Button label |
| `icon(string)` | Lucide icon name |
| `color(string)` | Color token |
| `url(string\|callable)` | Static URL or closure returning URL |
| `newTab()` | Open in a new browser tab |
| `visibleWhen(callable)` | `($record): bool` |
| `hidden(bool)` | Always hide |

---

## Migrating to the Table Builder

Replace `Resource::actions()` with `Table::recordActions()`:

**Legacy:**
```php
public static function actions(): array
{
    return [
        ButtonAction::make('publish')
            ->action(fn($r) => $r->publish())
            ->visibleWhen(fn($r) => $r->status === 'draft'),
        LinkAction::make('preview')
            ->url(fn($r) => "/posts/{$r->slug}"),
    ];
}
```

**New builder equivalent:**
```php
use Larafusion\Tables\Actions\Action;
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;

public static function table(Table $table): Table
{
    return $table->recordActions([
        EditAction::make(),
        Action::make('publish')
            ->color('success')
            ->icon('send')
            ->visible(fn($r) => $r->status === 'draft')
            ->action(fn($r) => $r->publish()),
        Action::make('preview')
            ->icon('eye')
            ->url(fn($r) => "/posts/{$r->slug}")
            ->openUrlInNewTab(),
        DeleteAction::make(),
    ]);
}
```

The `ActionController` resolves both legacy and new-style actions, so the two can coexist during a gradual migration.

---

## Common Mistakes

**Using both `actions()` and `table()->recordActions()` for the same action key.** The `ActionController` searches legacy actions first and stops at the first match. If both define a key `'publish'`, the legacy one always wins. Remove duplicates during migration.

**Expecting `LinkAction` to fire a server callback.** Link actions are client-side navigation. The `ActionController` returns early for `LinkAction` instances: `return response()->json(['url' => $action->resolveUrl($record)])`.

---

## Related Features

- [Table Actions](table-actions.md) — the modern `Action` class with the full feature set
- [Resources](resources.md) — `actions()` method
