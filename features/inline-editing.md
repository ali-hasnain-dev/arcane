# Inline Editing

## Overview

Inline editing lets admin users edit individual cell values directly in the index table by clicking on them — no navigation to a separate edit page required. A cell turns into an input, the user types a new value, and pressing Enter or clicking away saves it via a PATCH request.

---

## Why This Feature Exists

Navigating to an edit page to change a single field (a status, a priority, a flag, a short title) is slow and disruptive. Inline editing is purpose-built for lightweight, frequent edits on data that is fundamentally list-oriented.

---

## Setup

Return a whitelist of field names from `getInlineEditable()`:

```php
class PostResource extends Resource
{
    public static function getInlineEditable(): array
    {
        return ['title', 'status', 'sort_order'];
    }
}
```

Any field name not in this whitelist is rejected with 403 by the controller, even if the request is well-formed.

---

## Architecture

### Endpoint

```
PATCH /admin/{resource}/{id}/inline
```

### Request Body

```json
{ "field": "status", "value": "published" }
```

### Controller Logic

```php
// InlineEditController::update()
$field = $request->input('field');
$value = $request->input('value');

// 1. Check edit permission
abort_unless($resourceClass::canEdit(), 403);

// 2. Check whitelist
abort_unless(in_array($field, $resourceClass::getInlineEditable()), 403, "Field not editable.");

// 3. Find record
$record = $resourceClass::getModelInstance()->findOrFail($id);

// 4. Hash passwords if applicable
if (str_contains(strtolower($field), 'password') && $value) {
    $value = bcrypt($value);
}

// 5. Save
$record->update([$field => $value]);

// 6. Return fresh value
return response()->json([
    'success' => true,
    'value'   => $record->fresh()->{$field},
]);
```

The response includes the freshly read value (after any model mutators/casts run), which React uses to update the displayed cell without a full page reload.

---

## Real World Examples

### Status and Priority Inline Editing

```php
class TaskResource extends Resource
{
    public static function getInlineEditable(): array
    {
        return ['title', 'status', 'priority', 'due_date'];
    }
}
```

### Inline Editing with Sorted Tables

Inline editing works well alongside `Table::reorderable()`. Users can reorder rows by dragging and edit individual cells inline:

```php
public static function getInlineEditable(): array
{
    return ['name', 'sort'];  // 'sort' is the reorder column
}

public static function table(Table $table): Table
{
    return $table
        ->reorderable('sort')
        ->columns([
            TextColumn::make('name'),
            TextColumn::make('sort')->align('right'),
        ]);
}
```

---

## Security Considerations

- `canEdit()` is checked before any field update — unauthenticated or unauthorised requests receive 403.
- The field name is validated against `getInlineEditable()` — no arbitrary column can be updated by crafting a request.
- Password fields (`strtolower($field)` contains `'password'`) are automatically hashed before saving.
- No validation rules from the form schema are applied during inline editing — only the whitelist check. If you need validation, add it as a model observer or use `$model->$field = $value` with a setter attribute.

---

## Best Practices

- **Keep the whitelist small** — only expose fields that are genuinely intended for quick in-place edits.
- **Do not include sensitive fields** (payment info, credentials) in `getInlineEditable()`.
- **For enum or select fields**, the React inline edit widget shows a dropdown populated from the column's `filterOptions` (from `->filterOptions()` or `->enum()`). Declare those on the column for correct inline edit rendering.

---

## Common Mistakes

**Including relation foreign keys (e.g. `category_id`) in the whitelist.** Inline editing does not run the relation sync logic that `ResourceController::update()` uses. The FK is saved directly. If the relation requires pivot sync, use the full edit page.

**Expecting form validation rules to run.** Inline editing bypasses `getCreateRules()` / `getUpdateRules()`. Add a model-level attribute setter or observer if you need server-side validation on inline saves.

---

## Related Features

- [Resources](resources.md) — `getInlineEditable()` declaration
- [Tables](tables.md) — `Table::reorderable()` for drag-to-reorder
