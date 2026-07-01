# Enums

## Overview

Larafusion provides first-class support for PHP 8.1 BackedEnums across forms, tables, and filters. Four enum interfaces in `larafusion/support` add semantic metadata to enum cases — labels, colors, icons, and descriptions — that field and column classes read automatically.

---

## Why This Feature Exists

Without enum integration, you must maintain parallel arrays: one in PHP for validation, one for form select options, one for table badge colors, and one for filter dropdown labels. When an enum case is renamed or added, all four must be updated. Larafusion's enum system makes the enum itself the single source of truth: add a case with `getLabel()` and `getColor()` and it automatically appears in forms, tables, and filters everywhere it is used.

---

## Enum Interfaces

All interfaces live in `Larafusion\Support\Enums\`.

### HasLabel

```php
interface HasLabel
{
    public function getLabel(): ?string;
}
```

Provides a human-readable label for each case. Used by `EnumOptions::toOptions()`.

### HasColor

```php
interface HasColor
{
    public function getColor(): ?string;
}
```

Returns a semantic color token: `'primary'` | `'success'` | `'warning'` | `'danger'` | `'info'` | `'gray'`. Used by `BadgeColumn::enum()` and `TextColumn::enum()` for badge chip colors, and by `SelectFilter::options()` for indicator display.

### HasIcon

```php
interface HasIcon
{
    public function getIcon(): ?string;
}
```

Returns a Lucide icon name. Used by `BadgeColumn::enum()`.

### HasDescription

```php
interface HasDescription
{
    public function getDescription(): ?string;
}
```

Returns a descriptive string. Available for custom use (e.g. tooltips, help text).

---

## Creating an Enum

```php
namespace App\Enums;

use Larafusion\Support\Enums\HasLabel;
use Larafusion\Support\Enums\HasColor;
use Larafusion\Support\Enums\HasIcon;

enum PostStatus: string implements HasLabel, HasColor, HasIcon
{
    case Draft     = 'draft';
    case Review    = 'review';
    case Published = 'published';
    case Archived  = 'archived';

    public function getLabel(): ?string
    {
        return match($this) {
            self::Draft     => 'Draft',
            self::Review    => 'In Review',
            self::Published => 'Published',
            self::Archived  => 'Archived',
        };
    }

    public function getColor(): ?string
    {
        return match($this) {
            self::Draft     => 'gray',
            self::Review    => 'warning',
            self::Published => 'success',
            self::Archived  => 'danger',
        };
    }

    public function getIcon(): ?string
    {
        return match($this) {
            self::Draft     => 'pencil',
            self::Review    => 'clock',
            self::Published => 'check-circle',
            self::Archived  => 'archive',
        };
    }
}
```

---

## EnumOptions Utility

`Larafusion\Support\Enums\EnumOptions` is the bridge between enum classes and the arrays that field/column classes need.

### `toOptions(string $enumClass): array`

Returns `['value' => 'Label', ...]`.
- If the case implements `HasLabel`, uses `getLabel()`.
- Otherwise, title-cases the case name: `ACTIVE` → `Active`, `IN_REVIEW` → `In Review`.

```php
EnumOptions::toOptions(PostStatus::class);
// ['draft' => 'Draft', 'review' => 'In Review', 'published' => 'Published', 'archived' => 'Archived']
```

### `toColors(string $enumClass): array`

Returns `['value' => 'colorToken', ...]` for cases implementing `HasColor`.

```php
EnumOptions::toColors(PostStatus::class);
// ['draft' => 'gray', 'review' => 'warning', 'published' => 'success', 'archived' => 'danger']
```

### `toIcons(string $enumClass): array`

Returns `['value' => 'lucide-icon-name', ...]` for cases implementing `HasIcon`.

### `toDescriptions(string $enumClass): array`

Returns `['value' => 'description', ...]` for cases implementing `HasDescription`.

### `isEnumClass(string $class): bool`

Returns `true` if the string is a valid `BackedEnum` class. Used by `Select::options()` and `SelectFilter::options()` to detect enum class strings vs plain arrays.

---

## Integration Points

### Select Field

```php
Select::make('status')->options(PostStatus::class)
```

Calls `EnumOptions::toOptions()` to build the dropdown options. Also builds an `in:draft,review,...` validation rule automatically via `rebuildInRule()`.

### TextColumn with Enum

```php
TextColumn::make('status')->enum(PostStatus::class)
```

- Enables badge rendering (`$this->badge = true`)
- Sets `enumLabels` from `toOptions()`
- Sets `enumColors` from `toColors()`
- Auto-registers a select filter with enum labels as options

### BadgeColumn with Enum

```php
BadgeColumn::make('status')->enum(PostStatus::class)
```

- Sets `labels` from `toOptions()`
- Sets `colors` from `toColors()`
- Sets `icons` from `toIcons()`
- Auto-registers a select filter

### SelectFilter with Enum

```php
SelectFilter::make('status')->options(PostStatus::class)
```

Calls `EnumOptions::toOptions()` directly if `isEnumClass()` returns `true`.

### Field Validation with Enum

```php
// Field::enum() on the base Field class
Text::make('status')->enum(PostStatus::class)
// Adds: 'in:draft,review,published,archived'
```

---

## Real World Examples

### Order Status Enum

```php
enum OrderStatus: string implements HasLabel, HasColor, HasIcon
{
    case Pending   = 'pending';
    case Paid      = 'paid';
    case Shipped   = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded  = 'refunded';

    public function getLabel(): ?string
    {
        return match($this) {
            self::Pending   => 'Pending Payment',
            self::Paid      => 'Paid',
            self::Shipped   => 'Shipped',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
            self::Refunded  => 'Refunded',
        };
    }

    public function getColor(): ?string
    {
        return match($this) {
            self::Pending   => 'warning',
            self::Paid      => 'primary',
            self::Shipped   => 'info',
            self::Delivered => 'success',
            self::Cancelled => 'danger',
            self::Refunded  => 'gray',
        };
    }

    public function getIcon(): ?string
    {
        return match($this) {
            self::Pending   => 'clock',
            self::Paid      => 'credit-card',
            self::Shipped   => 'truck',
            self::Delivered => 'check-circle',
            self::Cancelled => 'x-circle',
            self::Refunded  => 'rotate-ccw',
        };
    }
}
```

Usage across the resource:

```php
// Form
Select::make('status')->options(OrderStatus::class)->required()

// Table
BadgeColumn::make('status')->enum(OrderStatus::class)

// Filter
SelectFilter::make('status')->options(OrderStatus::class)
```

---

## Best Practices

- **Implement all three interfaces** (`HasLabel`, `HasColor`, `HasIcon`) on every enum used in admin tables. Even if you do not immediately need icons, having labels and colors makes the table significantly more readable.
- **Keep color tokens semantic**, not visual. Use `'success'` for "active/paid/live" and `'danger'` for "error/failed/deleted" — the theme controls what those colours actually look like.
- **Use `BackedEnum` (string or int backing)** for database storage. Unit enums cannot be stored in a column. The `value` property is what gets written to the DB and what forms submit.
- **Cast enum columns on the Eloquent model** to auto-hydrate enum instances: `protected $casts = ['status' => PostStatus::class]`. This does not affect Larafusion's form/table behaviour (which works with raw strings) but is good practice.

---

## Common Mistakes

**Implementing `HasLabel` but returning `null` for a case.** `EnumOptions::toOptions()` falls back to the title-cased case name when `getLabel()` returns `null`. This is intentional — it allows partial `HasLabel` implementations.

**Using a unit enum (no backing value).** Larafusion's `enum()` methods call `$case->value` to build the options map. Unit enums have no `value` property. The `isEnumClass()` check passes for all `BackedEnum` types, but unit enums will produce errors if passed to `toOptions()`.

**Registering an `in:` validation rule manually after calling `->enum()` on Select.** `Select::options()` and `Select::enum()` both call `rebuildInRule()`, which removes any previous `in:` rule and adds a new one. Manual `->rules(['in:...'])` added before calling `->options()` will be wiped.

---

## Related Features

- [Forms](forms.md) — `Select::make()->options(EnumClass::class)`
- [Table Columns](table-columns.md) — `TextColumn::enum()`, `BadgeColumn::enum()`
- [Table Filters](table-filters.md) — `SelectFilter::options(EnumClass::class)`
