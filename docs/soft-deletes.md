# Soft Deletes

## Soft Deletes

1. Add `SoftDeletes` to your Eloquent model.
2. Enable on the resource:

```php
public static function softDeletes(): bool { return true; }
```

The index table gains three tabs: **Active** · **All** · **Trashed**.

- Trashed rows show **Restore** and **Delete Forever** buttons.
- **Bulk restore** is available on the Trashed tab.
- Force delete is permanent; restore moves the record back to Active.

## Confirmation UI

All destructive actions — single delete, force delete, bulk delete, and the Delete header action on Edit/Show pages — use the same animated confirmation dialog. It shows an `AlertTriangle` icon, a title, a description, and full-width Cancel / Delete buttons. The dialog is consistent regardless of which page or surface triggers the action.

Restore does not require confirmation.

---
