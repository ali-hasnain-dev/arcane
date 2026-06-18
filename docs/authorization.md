# Authorization

## Authorization

Override any of these methods to restrict access:

```php
public static function canViewAny(): bool { return auth()->user()->isAdmin(); }
public static function canCreate(): bool  { return auth()->user()->can('create-posts'); }
public static function canEdit(): bool    { return auth()->user()->can('edit-posts'); }
public static function canDelete(): bool  { return auth()->user()->can('delete-posts'); }
public static function canView(): bool    { return true; }
```

All default to `true`. The controller calls `abort_unless()` on every route. The React UI hides buttons based on the `can` object sent to the frontend.

---
