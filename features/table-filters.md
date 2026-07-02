# Table Filters

## Overview

Filters let admin users narrow the table to a subset of records. Larafusion provides two filtering mechanisms that work together:

1. **Column-level filters** — declared with `->filterable()` directly on a column definition. They are the quick path for basic text search, select dropdowns, and date ranges tied to a specific column.
2. **Standalone filters** — `Filter` subclass objects passed to `Table::filters([...])`. They carry PHP query closures, support custom labels and indicators, and unlock filter types that column-level filtering cannot express.

Both mechanisms are applied in `ResourceController::index()` from the `?filter[field]=value` query string.

---

## Why This Feature Exists

Most admin tables need more than a single search box. Filtering by status, date range, relationship, boolean flags, and combinations thereof requires per-column logic that does not belong in a generic controller. Standalone filters externalise that logic as named objects, keeping query concerns colocated with column/resource definitions.

---

## Core Concepts

### Filter Application in the Controller

```php
// ResourceController::index()

// 1. Build a map of named Filter objects from table()->getFilters()
$standaloneFilters = [];
foreach ($resourceClass::table(Table::make())->getFilters() as $f) {
    $standaloneFilters[$f->getName()] = $f;
}

// 2. Iterate ?filter[...] parameters
foreach ($filters as $field => $value) {
    if ($value === null || $value === '') continue;

    if (isset($standaloneFilters[$field])) {
        // Delegate to the PHP Filter object
        $standaloneFilters[$field]->applyToQuery($query, $value);
        continue;
    }

    // Generic column-level fallback
    // - array           → date range from/to
    // - true/false/1/0  → boolean WHERE
    // - contains ','    → whereIn
    // - else            → LIKE search
}
```

### Indicator Chips

When a filter is active, the React UI shows a dismissible chip above the table that names the active filter. `->indicator('Status')` on a standalone filter controls the chip label. Column-level filters use the column label.

Chips can be hidden globally with `Table::hiddenFilterIndicators()`.

---

## Column-Level Filtering

Declared on any `Column` subclass:

```php
// Generic text LIKE filter
TextColumn::make('title')->filterable()
TextColumn::make('title')->searchable()   // alias for ->filterable('text')

// Select filter (dropdown)
TextColumn::make('status')->filterable('select')

// Boolean filter (three-state: Yes / No / All)
BooleanColumn::make('active')->searchable()

// Date range filter (from/to date pickers)
DateColumn::make('created_at')->searchable()   // adds date_range filter

// Hardcoded options (also switches type to select)
Column::make('role')
    ->filterOptions([
        ['value' => 'admin',  'label' => 'Admin'],
        ['value' => 'editor', 'label' => 'Editor'],
    ])
```

Column-level filters do not support custom query closures. The controller applies them with generic logic (LIKE, whereIn, boolean WHERE). For anything more complex, use a standalone filter.

---

## Standalone Filters

### Filter (Base)

`Larafusion\Tables\Filters\Filter`

A generic boolean/text filter. Provide a custom query closure for full control.

```php
use Larafusion\Tables\Filters\Filter;

Filter::make('has_thumbnail')
    ->label('Has Thumbnail')
    ->indicator('Has Thumbnail')
    ->query(function ($query, $value) {
        if ($value === 'true') $query->whereNotNull('thumbnail_path');
        if ($value === 'false') $query->whereNull('thumbnail_path');
    })
    ->default(null);
```

Without a `->query()` closure, the base `Filter::applyToQuery()` defaults to a boolean WHERE or LIKE depending on the value.

**Methods:**

| Method | Description |
|---|---|
| `make(string $name)` | Factory |
| `label(string)` | Label in the filter UI |
| `query(Closure)` | Custom `($query, $value) => void` closure |
| `default(mixed)` | Pre-selected value |
| `attribute(string)` | Column name to filter on (defaults to `$name`) |
| `indicator(string)` | Chip label when the filter is active |

---

### SelectFilter

`Larafusion\Tables\Filters\SelectFilter`

A dropdown filter with a list of options.

```php
use Larafusion\Tables\Filters\SelectFilter;
use App\Enums\PostStatus;

// Static options
SelectFilter::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published', 'archived' => 'Archived'])
    ->label('Status')
    ->indicator('Status');

// From a BackedEnum
SelectFilter::make('status')
    ->options(PostStatus::class);

// Multi-select
SelectFilter::make('tags')
    ->options(['php' => 'PHP', 'laravel' => 'Laravel', 'react' => 'React'])
    ->multiple();

// Searchable dropdown
SelectFilter::make('user_id')
    ->options(User::pluck('name', 'id')->toArray())
    ->searchable()
    ->label('Author');

// Custom query
SelectFilter::make('category')
    ->options(Category::pluck('name', 'id')->toArray())
    ->query(function ($query, $value) {
        $query->where('category_id', $value);
    });
```

**Methods:**

| Method | Description |
|---|---|
| `options(array|class-string)` | Option map or BackedEnum class |
| `multiple()` | Allow multi-select; value sent as comma-separated string |
| `searchable()` | Searchable dropdown widget |
| `query(Closure)` | Custom `($query, $value) => void` |

**Default `applyToQuery` behaviour:**
- Array value → `whereIn($column, $value)`
- Comma-separated string → split and `whereIn`
- Single value → `where($column, $value)`

---

### DateRangeFilter

`Larafusion\Tables\Filters\DateRangeFilter`

A two-picker filter (from/to) for date columns.

```php
use Larafusion\Tables\Filters\DateRangeFilter;

DateRangeFilter::make('created_at')
    ->label('Created')
    ->indicator('Created Date');

DateRangeFilter::make('published_at')
    ->label('Published')
    ->attribute('published_at')  // if filter name differs from column name
    ->query(function ($query, $value) {
        // $value = ['from' => '2024-01-01', 'to' => '2024-12-31']
        if (!empty($value['from'])) $query->whereDate('published_at', '>=', $value['from']);
        if (!empty($value['to']))   $query->whereDate('published_at', '<=', $value['to']);
    });
```

Default `applyToQuery`: applies `where($column, '>=', $value['from'])` and `where($column, '<=', $value['to'])` for non-empty values.

---

### TernaryFilter

`Larafusion\Tables\Filters\TernaryFilter`

A three-state toggle: **All** (no filter) / **True** (Yes) / **False** (No). Ideal for boolean and nullable columns.

```php
use Larafusion\Tables\Filters\TernaryFilter;

// Boolean column
TernaryFilter::make('is_featured')
    ->label('Featured')
    ->trueLabel('Featured only')
    ->falseLabel('Not featured')
    ->placeholder('All posts');

// Nullable column (null = blank, not-null = filled)
TernaryFilter::make('published_at')
    ->label('Published')
    ->nullable()
    ->trueLabel('Published')
    ->falseLabel('Unpublished');

// Custom per-state queries
TernaryFilter::make('verified')
    ->label('Verified')
    ->queries(
        true:  fn($q) => $q->whereNotNull('email_verified_at'),
        false: fn($q) => $q->whereNull('email_verified_at'),
    );
```

**Methods:**

| Method | Description |
|---|---|
| `trueLabel(string)` | Label for the "true" state (default: `'Yes'`) |
| `falseLabel(string)` | Label for the "false" state (default: `'No'`) |
| `placeholder(string)` | Label for the "all" state (default: `'All'`) |
| `nullable()` | Use `whereNull` / `whereNotNull` instead of boolean WHERE |
| `queries(Closure $true, Closure $false, ?Closure $blank)` | Custom closures per state |

---

### TrashedFilter

`Larafusion\Tables\Filters\TrashedFilter`

A pre-built filter for soft-delete state. Renders as a three-state toggle: Without trashed / With trashed / Only trashed.

```php
use Larafusion\Tables\Filters\TrashedFilter;

TrashedFilter::make()
```

This filter is applied specially by the `ResourceController` when `$resourceClass::softDeletes()` returns `true`. You do not need to add it manually — but if you want to include it in the filter panel as a user-facing control, add it to `table()->filters([TrashedFilter::make()])`.

See [Soft Deletes](soft-deletes.md) for the full integration.

---

## Filter Layout

The visual presentation of filters is controlled by `Table::filtersLayout()`. This applies to all filters (both column-level and standalone) rendered in the filter panel.

```php
->filtersLayout('dropdown')            // popover panel
->filtersLayout('drawer')              // default — slide-in panel from the right
->filtersLayout('modal')               // centered modal dialog
->filtersLayout('above')               // always visible bar above the table
->filtersLayout('above_collapsible')   // collapsible bar above the table
->filtersLayout('below')               // bar below the table
```

### Grid Layout within the Panel

```php
->filtersFormColumns(3)      // 3-column grid inside the filter panel
->filtersFormWidth('28rem')  // max-width of dropdown / modal
->filtersFormMaxHeight('500px') // max-height before scrolling
```

---

## Real World Examples

### Blog Post Filters

```php
Table::make()
    ->filters([
        SelectFilter::make('status')
            ->options(PostStatus::class)
            ->indicator('Status'),

        SelectFilter::make('author_id')
            ->options(User::pluck('name', 'id')->toArray())
            ->label('Author')
            ->searchable()
            ->indicator('Author'),

        DateRangeFilter::make('published_at')
            ->label('Published'),

        TernaryFilter::make('featured')
            ->trueLabel('Featured')
            ->falseLabel('Not featured'),

        SelectFilter::make('category_id')
            ->options(Category::pluck('name', 'id')->toArray())
            ->label('Category'),
    ])
    ->filtersLayout('above')
    ->filtersFormColumns(5)
```

### Order Filters

```php
->filters([
    SelectFilter::make('status')
        ->options(['pending' => 'Pending', 'paid' => 'Paid', 'refunded' => 'Refunded', 'failed' => 'Failed'])
        ->multiple()
        ->indicator('Status'),

    DateRangeFilter::make('created_at')->label('Order Date'),

    Filter::make('large_orders')
        ->label('Amount > $1000')
        ->query(fn($q, $v) => $v === 'true' ? $q->where('total', '>', 1000) : null),

    SelectFilter::make('payment_method')
        ->options(['card' => 'Card', 'paypal' => 'PayPal', 'bank' => 'Bank Transfer']),
])
->filtersLayout('drawer')
```

---

## Advanced Usage

### Combining Multiple Filter Values

`SelectFilter::multiple()` sends a comma-separated string. The default `applyToQuery` splits it and uses `whereIn`. For a relationship-based filter:

```php
SelectFilter::make('tags')
    ->options(Tag::pluck('name', 'id')->toArray())
    ->multiple()
    ->query(function ($query, $value) {
        $ids = is_array($value) ? $value : explode(',', $value);
        $query->whereHas('tags', fn($q) => $q->whereIn('tags.id', $ids));
    });
```

### Dependent Filters

There is no built-in dependent filter (filter B's options change based on filter A's selection). Workarounds:
- Pre-populate all possible combinations as a single `SelectFilter`
- Override the React filter component via a plugin slot

### Default Filter Values

```php
SelectFilter::make('status')
    ->options(['draft' => 'Draft', 'published' => 'Published'])
    ->default('published');   // table loads with this filter pre-applied
```

The default value is serialised into `tableConfig['standaloneFilters']` and initialised by React when the page loads.

---

## Best Practices

- **Prefer `SelectFilter::make()->options(MyEnum::class)`** over building the options array manually. Changes to the enum automatically propagate.
- **Use `->indicator()` on every standalone filter** so the chip label is meaningful. Without it the chip shows the raw filter name.
- **Add database indexes** for every column used in filters that is not already indexed. LIKE queries on unindexed columns scan the full table.
- **Avoid `SelectFilter::multiple()` with very large option lists.** The full options array is serialised into `tableConfig` and sent with every full page visit. Prefer async search for lists exceeding ~200 items.
- **Use `filtersLayout('above')` with `filtersFormColumns(4+)`** when the resource has many filters that users apply frequently — they can see and modify filters without opening a panel.

---

## Common Mistakes

**Using `TrashedFilter` without enabling `softDeletes()` on the resource.** The filter renders but the `ResourceController` ignores the `trashed` query parameter unless `$resourceClass::softDeletes()` returns `true`.

**Expecting `->filterable()` on a column and `->filters([Filter::make(...)])` to stack.** They are applied independently. Column-level filters create `filter[columnName]=value` parameters; standalone filters use their own `$name` as the key. They can coexist without conflict.

**Using the same name for a column and a standalone filter.** The controller checks `standaloneFilters[$field]` first. If a standalone filter has the same name as a column's filter key, the standalone filter takes precedence and its query closure runs instead of the generic column logic.

---

## Related Features

- [Tables](tables.md) — `Table::filters()`, `filtersLayout()`, etc.
- [Table Columns](table-columns.md) — column-level `->filterable()` and `->filterOptions()`
- [Enums](enums.md) — `SelectFilter::make()->options(EnumClass::class)` integration
- [Soft Deletes](soft-deletes.md) — `TrashedFilter` and the trashed query logic
