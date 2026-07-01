# Tables

## Overview

The `Table` builder is the PHP-side configuration object for the index table in every resource. It controls which columns appear, which filters are available, how the filter UI is positioned, what the empty state looks like, whether rows are striped, which actions appear per row and in the toolbar, whether the table polls for updates, and what the default sort is.

`Table::make()` is the entry point. It is passed to your resource's `table()` method:

```php
public static function table(Table $table): Table
{
    return $table
        ->columns([...])
        ->filters([...])
        ->recordActions([...])
        ->defaultSort('created_at', 'desc');
}
```

---

## Why This Feature Exists

Without a dedicated table builder, table configuration bleeds into controller code, view templates, and JavaScript files — none of which are colocated with the model they describe. The `Table` object keeps every table-level decision in one PHP method, serialises it via `toConfig()`, and hands the JSON to React through Inertia.

---

## Core Concepts

### Two Column APIs

Larafusion supports two column declaration styles:

**Builder style (recommended):**
```php
use Larafusion\Columns\TextColumn;
use Larafusion\Columns\BadgeColumn;

public static function table(Table $table): Table
{
    return $table->columns([
        TextColumn::make('title')->sortable(),
        BadgeColumn::make('status')->enum(StatusEnum::class),
    ]);
}
```

**Legacy flat array (backward compatible):**
```php
public static function columns(): array
{
    return [
        Column::text('title'),
        Column::badge('status'),
    ];
}
```

When `table()` is not overridden, the default implementation wraps the `columns()` array. New code should always override `table()`.

### Sortable Column Inference

`Table::getSortableColumnNames()` walks the columns array and collects every column that has `->sortable()` set. `Resource::getSortable()` merges these names with the static `$sortable` property. This means you only need to call `->sortable()` on the column — you do not have to duplicate the name in `$sortable`.

### Config vs Schema

The `Table` object produces two separate payloads:

- `Resource::getColumnsSchema()` → `Serializer::columns($table->getColumns())` → the `columns` Inertia prop (one object per column with type, label, sortable, filterable, etc.)
- `Resource::getTableConfig()` → `$table->toConfig()` → the `tableConfig` Inertia prop (everything else: striped, empty state, filters layout, record actions, default sort)

---

## Architecture

### Data Flow

```
ResourceController::index()
  → $resourceClass::getTableConfig()       → Inertia prop 'tableConfig'
  → $resourceClass::getColumnsSchema()     → Inertia prop 'columns'
  → apply filters from standaloneFilters   → Eloquent query
  → $query->paginate()                     → Inertia prop 'records'

React BasicTable receives:
  columns    → renders column headers, sort arrows
  records    → renders data rows
  tableConfig → striped, emptyState, filters config, recordActions
```

### Filter Application

The `ResourceController` builds a map of `Filter` objects by name from `$table->getFilters()`. When a filter key appears in `request->filter`, the controller calls `$filter->applyToQuery($query, $value)`. Filters without a matching `Filter` object fall through to generic column-level handling (string `LIKE`, boolean `WHERE`, date range, comma-split `whereIn`).

---

## Configuration Reference

### Columns

```php
->columns(array $columns)
```

Set all columns. Each element should be a `Column` subclass instance.

```php
->pushColumns(array $columns)
```

Append columns to the existing list.

---

### Filters

```php
->filters([
    SelectFilter::make('status')->options(StatusEnum::class),
    DateRangeFilter::make('created_at'),
    TernaryFilter::make('verified'),
])
```

Sets standalone `Filter` objects. These are PHP-side only (they carry query closures). They are serialised into `tableConfig['standaloneFilters']` so React knows their type and options.

---

### Filter Layout

Controls where the filter UI appears and how it is styled.

```php
->filtersLayout('dropdown')        // default: popover triggered by a filter button
->filtersLayout('drawer')          // slide-in panel from the right
->filtersLayout('modal')           // centered modal
->filtersLayout('above')           // always-visible bar above the table
->filtersLayout('above_collapsible') // collapsible bar above
->filtersLayout('below')           // bar below the table
```

```php
->filtersFormColumns(2)            // 2-column grid in the filter panel
->filtersFormWidth('24rem')        // max-width of dropdown/modal
->filtersFormMaxHeight('400px')    // max-height before scrolling
->hiddenFilterIndicators()         // hide active-filter chips
```

---

### Sorting

```php
->defaultSort('created_at', 'desc')
// Direction must be 'asc' or 'desc'; invalid values are silently coerced to 'asc'.
```

The controller respects `defaultSort` from `tableConfig` when no sort is present in the URL query string.

---

### Record Actions

Per-row actions that appear in the rightmost column.

```php
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Tables\Actions\ViewAction;
use Larafusion\Tables\Actions\Action;

->recordActions([
    EditAction::make(),
    DeleteAction::make()->withoutConfirmation(),
    Action::make('publish')
        ->label('Publish')
        ->icon('send')
        ->color('success')
        ->confirm('Publish this post?')
        ->action(fn($record) => $record->update(['status' => 'published'])),
])
```

---

### Toolbar Actions

Actions that appear in the table toolbar area (above the table, beside the search bar).

```php
->toolbarActions([
    Action::make('export')
        ->label('Export CSV')
        ->icon('download')
        ->url('/admin/posts/export'),
])
```

---

### Bulk Actions

Bulk actions are declared on the toolbar and apply to selected rows. Larafusion's built-in `BasicTable` renders the checkbox column and selection toolbar automatically. `DeleteBulkAction` sends a `DELETE` request to `/{resource}/bulk`; `RestoreBulkAction` sends a `POST` to `/{resource}/bulk-restore`.

```php
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;
use Larafusion\Tables\Actions\RestoreBulkAction;
use Larafusion\Tables\Actions\ForceDeleteBulkAction;

->toolbarActions([
    BulkActionGroup::make([
        DeleteBulkAction::make(),
        RestoreBulkAction::make(),
        ForceDeleteBulkAction::make(),
    ])->label('Bulk Actions'),
])
```

---

### Appearance

```php
->striped()                        // alternating row background
->heading('All Posts')             // title above the table
->description('Published articles from all authors')  // subtitle
->emptyState('No posts yet', 'Create your first post to get started.', 'newspaper')
// emptyState(heading, description?, icon?)
```

---

### Pagination

```php
->simplePagination()        // show only Prev/Next + "X / Y" instead of page numbers
->simplePagination(false)   // force full numbered pagination even when the panel default is simple
```

Per-table setting always wins over the panel-level `->simplePagination()` default. If neither is set, numbered pagination is shown.

---

### Behaviour

```php
->poll('5s')          // auto-refresh every 5 seconds (passes to Inertia router.reload)
->deferLoading()      // show skeleton first, load data asynchronously
->reorderable('sort') // enable drag-to-reorder; 'sort' is the column name
```

---

## Real World Examples

### Posts Table

```php
public static function table(Table $table): Table
{
    return $table
        ->columns([
            ImageColumn::make('thumbnail')->size('2.5rem')->circular(),
            TextColumn::make('title')->sortable()->limit(80)->copyable(),
            BadgeColumn::make('status')->enum(PostStatus::class),
            TextColumn::make('author.name')->label('Author'),
            DateColumn::make('published_at')->since()->sortable(),
        ])
        ->filters([
            SelectFilter::make('status')->options(PostStatus::class),
            SelectFilter::make('author_id')
                ->options(User::pluck('name', 'id')->toArray())
                ->label('Author'),
            DateRangeFilter::make('published_at')->label('Published'),
            TernaryFilter::make('featured')
                ->trueLabel('Featured')
                ->falseLabel('Not featured'),
        ])
        ->filtersLayout('above')
        ->filtersFormColumns(4)
        ->recordActions([
            EditAction::make(),
            Action::make('preview')
                ->label('Preview')
                ->icon('eye')
                ->url(fn($r) => "/posts/{$r->slug}")
                ->openUrlInNewTab(),
            DeleteAction::make(),
        ])
        ->defaultSort('published_at', 'desc')
        ->striped()
        ->emptyState('No posts found', 'Try adjusting your filters.')
        ->poll('30s');
}
```

### Orders Table with Reordering

```php
public static function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('order_number')->sortable()->copyable(),
            TextColumn::make('customer.name'),
            TextColumn::make('total')->money('USD'),
            BadgeColumn::make('status')
                ->colors(['success' => 'paid', 'warning' => 'pending', 'danger' => 'failed']),
            DateColumn::make('created_at')->dateTime()->sortable(),
        ])
        ->defaultSort('created_at', 'desc')
        ->reorderable('display_order');
}
```

---

## Advanced Usage

### Custom Filter Query Closures

When column-level filtering is not enough, use standalone filters with a custom query:

```php
SelectFilter::make('has_image')
    ->options(['yes' => 'With image', 'no' => 'Without image'])
    ->label('Image')
    ->query(function ($query, $value) {
        if ($value === 'yes') $query->whereNotNull('image_path');
        if ($value === 'no')  $query->whereNull('image_path');
    });
```

### Conditional Record Actions

The `Action::visible(callable)` method receives the record and returns a boolean. Hidden actions do not appear in the row:

```php
Action::make('publish')
    ->visible(fn($record) => $record->status === 'draft')
    ->action(fn($record) => $record->update(['status' => 'published'])),
Action::make('unpublish')
    ->visible(fn($record) => $record->status === 'published')
    ->action(fn($record) => $record->update(['status' => 'draft'])),
```

### Extending the Column Set at Runtime

```php
public static function table(Table $table): Table
{
    $table = PostsTable::build($table);

    if (auth()->user()->is_admin) {
        $table->pushColumns([
            TextColumn::make('internal_notes')->label('Notes'),
        ]);
    }

    return $table;
}
```

---

## Best Practices

- **Always use `table()` instead of the legacy `columns()`** for new resources. `table()` gives you access to filters, filter layout, actions, empty states, and sorting configuration.
- **Declare sortable columns with `->sortable()` on the column** rather than duplicating in the resource's `$sortable` property. The resource merges them automatically.
- **Use `filtersLayout('above')` with `filtersFormColumns(3)`** for resources where users filter frequently. The always-visible bar is faster than a popover.
- **Keep `poll()` intervals generous** (30s+). Short intervals (< 5s) create constant network activity and can degrade performance on servers with many admin users.
- **Use `->emptyState()`** to guide users when a table is legitimately empty rather than showing a blank white box.

---

## Common Mistakes

**Using both `$sortable` and `->sortable()` for the same column.** They merge, so the column ends up sortable either way — but the duplication is unnecessary.

**Forgetting `->filters()` on the Table but expecting server-side filter application.** Column-level `->filterable()` handles generic cases but does not support custom query closures. You need `->filters([...])` with standalone `Filter` objects for any non-trivial filter logic.

**Expecting `poll()` to update widgets.** Polling only triggers a partial reload of `records`. Widgets are deferred on initial load and are not re-fetched by the poll interval.

**Using `->deferLoading()` on small tables.** Deferred loading shows a skeleton first and then fires a second request. For tables with fewer than 50 rows that query fast, it makes the UI feel slower.

---

## Security Considerations

- The sort field is validated against `getSortable()` merged with `['id']` before being applied to the Eloquent query. Arbitrary column names cannot be injected.
- Filter values pass through `Filter::applyToQuery()` which uses parameterised Eloquent methods (`->where()`, `->whereIn()`) — not raw SQL.
- Record actions are authorised via `action->visibleFor($record)` and the resource's `canEdit()` / `canDelete()` gates in the controller.

---

## Related Features

- [Table Columns](table-columns.md) — all column types
- [Table Filters](table-filters.md) — all filter types
- [Table Actions](table-actions.md) — Action, EditAction, DeleteAction, bulk actions
- [Resources](resources.md) — where `table()` is declared
- [Soft Deletes](soft-deletes.md) — TrashedFilter integration
