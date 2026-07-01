# Inline Editing

## Inline Editing

Allow specific columns to be edited directly in the table without opening the edit page.

The recommended way is to mark the column `->inlineEditable()` in your `table()` — the
resource auto-detects them, with no separate array to keep in sync:

```php
->columns([
    TextColumn::make('title')->inlineEditable(),
    TextColumn::make('price')->align('right')->inlineEditable(),
])
```

Each inline-editable column must be backed by a form field of the same name (that's what
renders the inline editor). Click any cell in those columns to edit in place; press
**Enter** or click away to save via `PATCH /admin/{resource}/{id}/inline`.

You can still override the list explicitly if you prefer:

```php
public static function getInlineEditable(): array
{
    return ['status', 'price', 'is_active'];
}
```

---
