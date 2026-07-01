# Soft Deletes

## Overview

Soft delete support adds a "Trashed" tab to the index table, row-level Restore and Force Delete actions, and bulk restore/force-delete operations — all by adding two lines to a resource.

---

## Why This Feature Exists

Permanent deletion is irreversible and dangerous in production admin panels. Soft deletes give administrators a safety net: deleted records are hidden from normal queries but can be recovered if needed. Larafusion integrates this at the controller and UI level so you do not have to write custom routes or React logic.

---

## Setup

### 1. Add `SoftDeletes` to the Eloquent Model

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
}
```

### 2. Enable on the Resource

```php
class PostResource extends Resource
{
    public static function softDeletes(): bool { return true; }
}
```

That is all that is required.

---

## What Enabling Soft Deletes Does

When `softDeletes()` returns `true`:

**Controller side:**
- `ResourceController::index()` checks the `?trashed=` query parameter:
  - `without` (default) — `$query` is unmodified (Eloquent's default soft-delete scope hides trashed records)
  - `with` — `$query->withTrashed()`
  - `only` — `$query->onlyTrashed()`
- `ResourceController::destroy()` calls `$record->delete()` (soft delete, moves to trash)
- `ResourceController::restore()` calls `withTrashed()->findOrFail($id)->restore()`
- `ResourceController::forceDestroy()` calls `withTrashed()->findOrFail($id)->forceDelete()`
- `ResourceController::bulkDestroy()` calls `->delete()` (soft)
- `ResourceController::bulkRestore()` calls `->withTrashed()->whereIn('id', $ids)->restore()`

**React side:**
- The index table shows three tabs: **All**, **Trashed**, (and optionally **With Trashed**)
- The Trashed tab filters to `?trashed=only`
- Trashed rows show a **Restore** button instead of Edit/Delete
- The table toolbar shows a **Force Delete** button for trashed rows in bulk-select mode

---

## Routes

```
POST   /admin/{resource}/{id}/restore    → ResourceController::restore()
DELETE /admin/{resource}/{id}/force      → ResourceController::forceDestroy()
POST   /admin/{resource}/bulk-restore   → ResourceController::bulkRestore()
POST   /admin/{resource}/bulk-force-delete → (via React bulk action)
```

All soft-delete routes are registered unconditionally. The controller methods call `abort_unless($resourceClass::softDeletes(), 403)` to block access when the resource does not support soft deletes.

---

## TrashedFilter

For explicit filter control inside `Table::filters([...])`, use `TrashedFilter`:

```php
use Larafusion\Tables\Filters\TrashedFilter;

public static function table(Table $table): Table
{
    return $table
        ->filters([
            TrashedFilter::make(),
            // ... other filters
        ]);
}
```

`TrashedFilter` sets `type: 'trashed'` in the serialised config. React renders it as the special trashed-state toggle rather than a regular filter widget.

---

## Bulk Actions

To surface bulk restore and force-delete in the toolbar:

```php
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;
use Larafusion\Tables\Actions\RestoreBulkAction;
use Larafusion\Tables\Actions\ForceDeleteBulkAction;

public static function table(Table $table): Table
{
    return $table
        ->toolbarActions([
            BulkActionGroup::make([
                DeleteBulkAction::make(),
                RestoreBulkAction::make(),
                ForceDeleteBulkAction::make(),
            ]),
        ]);
}
```

`RestoreBulkAction` and `ForceDeleteBulkAction` are automatically disabled (hidden) when `softDeletes()` returns `false`.

---

## Real World Examples

### Post Resource with Full Soft-Delete Support

```php
class PostResource extends Resource
{
    protected static string $model = Post::class;

    public static function softDeletes(): bool { return true; }
    public static function canDelete(): bool   { return auth()->user()?->is_admin ?? false; }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')->sortable(),
                BadgeColumn::make('status')->enum(PostStatus::class),
                DateColumn::make('deleted_at')->label('Trashed At')->since(),
            ])
            ->filters([TrashedFilter::make()])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make()->confirm('Move to Trash?'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                ]),
            ]);
    }
}
```

---

## Best Practices

- **Add `->with_trashed` search to global search** if users need to recover specific trashed records by searching for them. The default `SearchController` does not include trashed records. Override `getGlobalSearchTitle()` or add a custom search endpoint.
- **Use `->canDelete()` to gate who can permanently delete**, keeping `softDeletes()` open for all editors. Soft delete is usually safe; force delete is permanent.
- **Exclude `deleted_at` from `getExportColumns()`** if you export only active records.

---

## Common Mistakes

**Enabling `softDeletes()` on a resource whose model does not use the `SoftDeletes` trait.** The `->onlyTrashed()` / `->withTrashed()` calls throw an error. Always add `use SoftDeletes` to the model first.

**Expecting Larafusion to inject `->withTrashed()` into all queries automatically.** Larafusion only applies it when the `?trashed=` parameter is present. Global scopes that call `withTrashed()` elsewhere (e.g. in an observer) do not affect the Larafusion query.

**Using `->delete()` in a custom action callback on a soft-deletable resource.** This performs a soft delete (sets `deleted_at`). If you need a hard delete, call `->forceDelete()`.

---

## Related Features

- [Resources](resources.md) — `softDeletes()` declaration
- [Table Actions](table-actions.md) — `DeleteAction`, bulk actions
- [Table Filters](table-filters.md) — `TrashedFilter`
