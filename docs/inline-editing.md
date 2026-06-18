# Inline Editing

## Inline Editing

Allow specific columns to be edited directly in the table without opening the edit page.

```php
public static function getInlineEditable(): array
{
    return ['status', 'price', 'is_active'];
}
```

Click any cell in those columns to edit in place. Press **Enter** or click away to save via `PATCH /admin/{resource}/{id}/inline`.

---
