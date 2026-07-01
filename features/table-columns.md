# Table Columns

## Overview

Table columns define what data appears in each column of the index table, how it is displayed, whether it can be sorted or filtered, and what its visual representation is. All column types extend `Larafusion\Columns\Column` and are serialised by `Serializer::columns()` into the `columns` Inertia prop.

---

## Why This Feature Exists

Database columns hold raw values — integers, enum strings, ISO dates, file paths, boolean flags. A table column class bridges raw data and the correct React renderer: it knows whether to render a green badge, a relative timestamp, a circular avatar, or an icon. This keeps display logic in PHP alongside the data definition, rather than scattered in JavaScript.

---

## Core Concepts

### Base Column Class

`Larafusion\Columns\Column` provides the shared API:

```
name       — database column name (also the key in the record)
label      — auto-generated from name, overridable
type       — string type token read by the React renderer
sortable   — whether a sort arrow appears in the header
filterable — whether a filter widget appears for this column
filterType — 'text' | 'select' | 'boolean' | 'date_range'
visible    — whether the column renders at all
align      — 'left' | 'center' | 'right'
width      — CSS width string
toggleable — can be hidden/shown via a column visibility menu
```

### Sortable Column Auto-Registration

Columns declared with `->sortable()` are collected by `Table::getSortableColumnNames()`, which merges them into `Resource::getSortable()`. You never need to duplicate a sortable column name in the resource's `$sortable` property.

### Column Factories

All column classes expose named static factories for the most common types so you can construct a `Column` base class without importing the specific subclass:

```php
Column::text('title')
Column::badge('status')
Column::boolean('active')
Column::date('created_at')
Column::image('avatar')
Column::number('price')
```

For type-specific features you must use the subclass directly (`TextColumn::make()`, `BadgeColumn::make()`, etc.).

---

## Column Types

### TextColumn

The most versatile column. Renders plain text with optional truncation, badges, copy buttons, money formatting, prefixes, suffixes, and enum label mapping.

```php
use Larafusion\Columns\TextColumn;

TextColumn::make('title')
    ->label('Post Title')
    ->sortable()
    ->filterable()            // adds a text search filter
    ->limit(80)               // truncate to 80 characters
    ->wrap()                  // allow text wrapping
    ->lineClamp(2)            // CSS line-clamp (sets limit=2)
    ->description('subtitle') // secondary line below the value
    ->copyable()              // shows a copy-to-clipboard button
    ->color('primary')        // semantic color token
    ->weight('bold')          // 'bold' | 'medium' | 'semibold'
    ->bold()                  // shortcut for ->weight('bold')
    ->prefix('$')
    ->suffix(' USD')
    ->money('USD')            // formats as locale currency
    ->asBadge()               // render as an inline badge chip
    ->toggleable()            // user can hide/show this column
    ->toggleable(true)        // hidden by default in the visibility menu
    ->align('right')
    ->width('12rem')
```

#### Enum Integration

`->enum(string $enumClass)` automatically enables badge rendering and populates labels and colors from the enum's `HasLabel` and `HasColor` interfaces. It also registers a select filter with enum cases as options:

```php
TextColumn::make('status')->enum(PostStatus::class)
// Renders as badge chip with label from HasLabel::getLabel()
// Color from HasColor::getColor()
// Filter: dropdown with all enum cases
```

#### Configuration Reference

| Method | Description |
|---|---|
| `limit(int)` | Truncate to N characters |
| `wrap()` | Allow text to wrap across lines |
| `lineClamp(int)` | CSS line-clamp after N lines |
| `description(string)` | Secondary text below the main value |
| `copyable()` | Show copy button |
| `color(string)` | Semantic color (primary, success, etc.) |
| `weight(string)` | Font weight |
| `bold()` | Shortcut for `weight('bold')` |
| `prefix(string)` | Decorative prefix (not stored) |
| `suffix(string)` | Decorative suffix (not stored) |
| `money(?string)` | Format as currency; default USD |
| `asBadge()` | Render as inline badge chip |
| `enum(class-string)` | Bind enum class (enables badge, adds filter) |

---

### BadgeColumn

Renders the value as a coloured badge chip. Supports explicit value→color and value→icon maps, or automatic population from a BackedEnum.

```php
use Larafusion\Columns\BadgeColumn;

// Manual color map
BadgeColumn::make('status')
    ->colors([
        'success' => ['active', 'published'],
        'warning' => 'pending',
        'danger'  => ['archived', 'deleted'],
    ])
    ->icons([
        'active'   => 'check-circle',
        'archived' => 'archive',
    ])
    ->labels([
        'active'   => 'Active',
        'archived' => 'Archived',
    ]);

// Shorthand for a single color
BadgeColumn::make('priority')
    ->color('danger', 'high')
    ->color('warning', ['medium', 'low']);

// Enum integration
BadgeColumn::make('status')->enum(OrderStatus::class);
```

Color tokens: `primary`, `success`, `warning`, `danger`, `info`, `gray`.

When `->enum()` is called, `EnumOptions::toOptions()`, `toColors()`, and `toIcons()` are called to populate labels, colors, and icons. A select filter is also auto-registered.

---

### BooleanColumn

Renders a boolean value as an icon in a semantic color.

```php
use Larafusion\Columns\BooleanColumn;

BooleanColumn::make('is_featured')
    ->label('Featured')
    ->trueIcon('star')
    ->falseIcon('star-off')
    ->trueColor('warning')
    ->falseColor('gray')
    ->trueLabel('Yes')      // tooltip text
    ->falseLabel('No')
    ->sortable()
    ->searchable()          // adds a boolean filter (true/false/all)
```

Defaults: `trueIcon='check-circle'`, `falseIcon='x-circle'`, `trueColor='success'`, `falseColor='danger'`.

---

### DateColumn

Renders ISO date/datetime strings in a human-readable format.

```php
use Larafusion\Columns\DateColumn;

DateColumn::make('published_at')
    ->format('M j, Y')       // PHP date format
    ->dateTime()             // sets format to 'M j, Y H:i'
    ->time()                 // time-only display
    ->since()                // relative: "3 days ago", "2 hours ago"
    ->sortable()
    ->searchable()           // adds a date_range filter
```

| Method | Description |
|---|---|
| `format(string)` | PHP date format string; default `'M j, Y'` |
| `dateTime()` | Sets format to `'M j, Y H:i'` |
| `time()` | Show time portion only |
| `since()` | Show relative time ("3 days ago") |

---

### ImageColumn

Renders an image from a file path stored in the database.

```php
use Larafusion\Columns\ImageColumn;

ImageColumn::make('avatar')
    ->circular()             // round crop
    ->size('2.5rem')         // CSS size (default)
    ->disk('public')         // storage disk
    ->stacked(3)             // overlapping avatars for multi-image columns
```

The `disk` value is passed to React so it can construct the correct URL (e.g. using Laravel's `Storage::url()` equivalent). For `stacked`, the first N images overlap in a row with the excess count shown as "+N".

| Method | Description |
|---|---|
| `circular()` | Round crop |
| `size(string)` | CSS width/height (default `'2.5rem'`) |
| `disk(string)` | Storage disk (default `'public'`) |
| `stacked(int)` | Show stacked overlapping images; limit = N shown |

---

### IconColumn

Renders an icon based on the column value. Useful for enum-backed status or type columns when you want icons without text.

```php
use Larafusion\Columns\IconColumn;

IconColumn::make('type')
    ->icons([
        'video'    => 'play-circle',
        'article'  => 'file-text',
        'podcast'  => 'headphones',
    ])
    ->colors([
        'video'    => 'primary',
        'article'  => 'success',
        'podcast'  => 'warning',
    ]);

// Boolean mode — auto icon + color
IconColumn::make('is_public')->boolean()
// true → check-circle green, false → x-circle red
```

---

## Shared Column Options

All column types inherit these from `Larafusion\Columns\Column`:

### Sorting

```php
->sortable()
->sortable(false)   // explicitly disable
```

Adds an up/down arrow to the column header. Clicking sorts the table client-side (Inertia partial reload with `?sort=field&direction=asc`).

### Filtering

```php
->filterable()              // generic text LIKE filter
->filterable('select')      // dropdown filter
->filterable('date_range')  // date range picker
->filterable('boolean')     // yes/no/all toggle
->filterOptions([           // forces type=select with given options
    ['value' => 'active', 'label' => 'Active'],
    ['value' => 'archived', 'label' => 'Archived'],
])
->searchable()              // shortcut for ->filterable('text')
```

Column-level filters appear in the filter panel when any column has `->filterable()`. They are serialised into the `columns` prop's `filterable`, `filterType`, and `filterOptions` keys; React uses these to render the appropriate filter widget.

### Visibility

```php
->hidden()                    // always hidden (not shown, not in visibility menu)
->toggleable()                // can be hidden via column visibility menu (visible by default)
->toggleable(true)            // hidden by default in the visibility menu
```

### Alignment & Width

```php
->align('left')    // default
->align('center')
->align('right')
->width('8rem')    // CSS width
```

---

## Real World Examples

### Users Table

```php
->columns([
    ImageColumn::make('avatar')->circular()->size('2rem'),
    TextColumn::make('name')->sortable()->copyable(),
    TextColumn::make('email')->sortable()->copyable(),
    BadgeColumn::make('role')
        ->colors(['success' => 'admin', 'primary' => 'editor', 'gray' => 'viewer']),
    BooleanColumn::make('email_verified_at')
        ->label('Verified')
        ->trueIcon('shield-check')
        ->trueColor('success')
        ->falseColor('warning')
        ->sortable(),
    DateColumn::make('last_login_at')->since()->label('Last Login'),
    DateColumn::make('created_at')->format('Y-m-d')->sortable()->toggleable(true),
])
```

### Products Table

```php
->columns([
    ImageColumn::make('thumbnail')->size('3rem'),
    TextColumn::make('name')->sortable()->limit(60),
    TextColumn::make('sku')->copyable()->width('8rem'),
    TextColumn::make('price')->money('USD')->align('right')->sortable(),
    TextColumn::make('stock_quantity')
        ->label('Stock')
        ->align('right')
        ->color('danger')     // this would need conditional logic in React
        ->sortable(),
    BadgeColumn::make('status')->enum(ProductStatus::class),
    DateColumn::make('created_at')->since()->sortable()->toggleable(true),
])
```

---

## Advanced Usage

### Accessing Nested Relation Values

Use dot notation in the column name to access eager-loaded relations:

```php
TextColumn::make('author.name')->label('Author')
TextColumn::make('category.name')->label('Category')
TextColumn::make('address.city')->label('City')
```

The React renderer reads `record['author']['name']` using `lodash.get`-style path traversal. No extra eager loading configuration is required here — the Eloquent model must have the relationship defined and the query must eager-load it (Larafusion does not add `with()` automatically; use a global scope or override the index query in the resource).

### Computed Columns

There is no native "computed column" API, but you can:

1. Add an accessor to the model: `getFullNameAttribute()` → `TextColumn::make('full_name')`
2. Use a `SELECT` raw in the resource's query scope (advanced)

### Column Visibility Persistence

When `->toggleable()` is set, React stores each user's column visibility preferences in `localStorage` keyed by resource slug. Preferences persist across page reloads.

---

## Best Practices

- **Use `TextColumn::make()->money('USD')` for currency** rather than formatting in the model. The column communicates to React the correct locale formatting.
- **Use `BadgeColumn::make()->enum(StatusEnum::class)` as the primary status display column.** It auto-populates filters, labels, and colors from one source of truth.
- **Mark `DateColumn->since()`** for `created_at` / `updated_at` columns in list views — relative times are more scannable. Use `->dateTime()` for audit-sensitive columns where the exact timestamp matters.
- **Limit sortable columns** to fields that have database indexes. Sorting an unindexed text column on a large table causes full table scans.
- **Use `->toggleable(true)`** (hidden by default) for supplementary columns like `updated_at`, `id`, or internal notes that clutter the default view.

---

## Common Mistakes

**Using `->filterable()` for a column whose values are enum strings and expecting a text search.** Use `->filterOptions([...])` or `->filterable('select')` with options for enum columns so the filter renders as a dropdown.

**Calling `->sortable()` on a relation column** like `TextColumn::make('author.name')`. Sorting by a dot-notation key results in a query like `ORDER BY author.name` which requires a join. Larafusion does not add joins automatically — either use a raw `orderBy` override or sort on a denormalised column.

**Expecting `->hidden()` to remove the column from the data payload.** The records pagination result still includes all model attributes. `->hidden()` only suppresses rendering in the UI.

---

## Related Features

- [Tables](tables.md) — the `Table` builder where columns are declared
- [Table Filters](table-filters.md) — standalone filter types
- [Enums](enums.md) — `HasLabel`, `HasColor`, `HasIcon` for `->enum()`
- [Resources](resources.md) — resource's `table()` method
