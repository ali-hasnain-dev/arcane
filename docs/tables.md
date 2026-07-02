# Tables

## Tables

### Table Builder (Filament-style)

Override `table()` on your resource (instead of `columns()`) for the full-featured Filament-style API:

```php
// app/Larafusion/Resources/Users/Tables/UsersTable.php
namespace App\Larafusion\Resources\Users\Tables;

use Larafusion\Tables\Table;
use Larafusion\Columns\TextColumn;
use Larafusion\Columns\BadgeColumn;
use Larafusion\Columns\BooleanColumn;
use Larafusion\Columns\DateColumn;
use Larafusion\Columns\ImageColumn;
use Larafusion\Tables\Filters\SelectFilter;
use Larafusion\Tables\Filters\Filter;
use Larafusion\Tables\Actions\Action;
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('avatar')->circular()->size('2.5rem'),

                TextColumn::make('name')
                    ->sortable()
                    ->searchable()
                    ->copyable(),

                TextColumn::make('email')
                    ->sortable()
                    ->searchable(),

                BadgeColumn::make('role')
                    ->colors([
                        'primary' => 'admin',
                        'success' => 'editor',
                        'info'    => 'viewer',
                    ]),

                BooleanColumn::make('is_active')
                    ->label('Active'),

                DateColumn::make('created_at')
                    ->label('Joined')
                    ->sortable()
                    ->since(),   // "3 days ago"
            ])
            ->filters([
                SelectFilter::make('role')
                    ->options([
                        'admin'  => 'Administrator',
                        'editor' => 'Editor',
                        'viewer' => 'Viewer',
                    ]),
                Filter::make('active')
                    ->label('Active only')
                    ->query(fn ($q) => $q->where('is_active', true)),
            ])
            ->recordActions([
                EditAction::make(),

                // Filament-style inline custom action
                Action::make('approve')
                    ->label('Approve')
                    ->icon('check')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn ($r) => $r->status === 'pending')
                    ->action(fn ($r) => $r->update(['status' => 'approved']))
                    ->successNotificationTitle('Approved!'),

                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->striped()
            ->heading('Users')
            ->description('Manage your system users.')
            ->emptyState('No users found', 'Try adjusting your search or filters.');
    }
}
```

Wire it in the resource:

```php
public static function table(Table $table): Table
{
    return UsersTable::configure($table);
}
```

**Auto-merge of sortable:** columns declared with `->sortable()` are automatically merged into the server-side sort allowlist — you no longer need a separate `$sortable` array when using the table builder.

#### Table Builder Methods

| Method                                        | Description                                                          |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `->columns([...])`                            | Column definitions                                                   |
| `->pushColumns([...])`                        | Append columns to existing list                                      |
| `->filters([...])`                            | Standalone filter definitions                                        |
| `->recordActions([...])`                      | Per-row actions: built-in (EditAction, DeleteAction, ViewAction) or custom `Action::make()` |
| `->toolbarActions([...])`                     | Toolbar / bulk actions (must wrap with BulkActionGroup)              |
| `->defaultSort('field', 'asc')`              | Default sort column and direction (`'asc'` or `'desc'`)              |
| `->striped()`                                 | Alternating row shading                                              |
| `->heading('...')`                            | Title displayed above the table card                                 |
| `->description('...')`                        | Subtitle below the heading                                           |
| `->emptyState('heading', 'description')`      | Custom empty state message                                           |
| `->polling('30s')`                            | Auto-refresh interval — reloads just the records prop                |
| `->deferLoading()`                            | Load records asynchronously on first visit                           |
| `->reorderable('sort')`                       | Enable drag-to-reorder using the named column                        |
| `->pagination()`                              | Full numbered pagination (default)                                   |
| `->pagination('simple')`                      | Show only Prev/Next buttons instead of numbered page links; overrides the panel-level default |
| `->pagination(false)`                         | Disable pagination — all records returned on one page                |
| `->filtersLayout(FiltersLayout::Modal)`       | Where/how the filter panel appears — `FiltersLayout` enum case or string value (`Dropdown` (default) · `Drawer` · `Modal` · `Above` · `AboveCollapsible` · `Below` · `BeforeContent` · `BeforeContentCollapsible` · `AfterContent` · `AfterContentCollapsible`); also settable via `->filters([...], layout: ...)` |
| `->filtersFormColumns(2)`                     | Grid columns inside the filter form (default: 1; side layouts are always 1) |
| `->filtersFormWidth('28rem')`                 | Width of the filter panel — dropdown popover width, drawer width, or modal max-width |
| `->filtersFormMaxHeight('400px')`             | Max-height before filter panel scrolls                               |
| `->hiddenFilterIndicators()`                  | Hide the active-filter indicator chips row                           |

---

### Built-in Record Actions

Control which action buttons appear on each table row. When `recordActions()` is defined, **only** those actions are shown. Omitting `recordActions()` falls back to showing all three built-in actions (View, Edit, Delete) based on the resource's `can.*` permissions.

```php
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Tables\Actions\ViewAction;

->recordActions([
    ViewAction::make(),      // "View" link → /admin/{resource}/{id}
    EditAction::make(),      // "Edit" link → /admin/{resource}/{id}/edit
    DeleteAction::make(),    // "Delete" button with confirmation dialog
])
```

Customise labels and appearance:

```php
->recordActions([
    EditAction::make()->label('Modify'),
    DeleteAction::make()
        ->label('Remove')
        ->confirm('Permanently remove this record?'),

    DeleteAction::make()->withoutConfirmation(),  // skip confirm dialog
])
```

The checkbox column and bulk actions toolbar are **hidden automatically** when `toolbarActions([])` is explicitly set to an empty array. Omitting `toolbarActions()` entirely keeps the legacy bulk-delete behavior.

| Class          | Default label | Default color | Notes                                        |
| -------------- | ------------- | ------------- | -------------------------------------------- |
| `EditAction`   | Edit          | primary       | Navigates to the edit page (or opens modal)  |
| `DeleteAction` | Delete        | danger        | Shows the shared animated confirmation dialog before deleting |
| `ViewAction`   | View          | default       | Navigates to the show/detail page            |

> **Consistent confirmation UI** — all delete paths (single row, bulk, force delete, and the Delete header action on Show/Edit pages) use the same animated modal dialog: an `AlertTriangle` icon in a red circle, a title, a message, and full-width Cancel / Delete buttons. There is no native `window.confirm()` anywhere in the panel UI.

---

### Custom Action (Filament-style)

`Action::make()` is the recommended way to add any server-side or URL-based custom action directly inside `->recordActions()`. It supports the full Filament action API — confirmation dialogs, display modes, visibility conditions, notifications, tooltips, and badges.

```php
use Larafusion\Tables\Actions\Action;

->recordActions([
    EditAction::make(),

    Action::make('reset_password')
        ->label('Reset Password')
        ->icon('refresh')
        ->color('warning')
        ->iconOnly()                          // or ->textOnly() / ->button()
        ->requiresConfirmation()              // generic "Are you sure?" dialog
        ->modalHeading('Reset Password')      // custom dialog heading
        ->modalDescription('This will send a password reset email to the user.')
        ->modalSubmitActionLabel('Send Link') // confirm button text
        ->action(function ($record) {
            \Illuminate\Support\Facades\Password::sendResetLink(['email' => $record->email]);
        })
        ->successNotificationTitle('Password reset link sent.')
        ->tooltip('Send password reset email')
        ->visible(fn ($record) => $record->email !== null),

    // URL-based action (no server round-trip)
    Action::make('preview')
        ->label('Preview')
        ->icon('eye')
        ->url(fn ($record) => "/blog/{$record->slug}")
        ->openUrlInNewTab(),

    DeleteAction::make(),
])
```

#### Action Method Reference

| Method | Description |
| ------ | ----------- |
| `->label('...')` | Button text |
| `->icon('...')` | Lucide icon name (see [Available Icons](#available-icons)) |
| `->color('...')` | `default` · `primary` · `success` · `warning` · `danger` |
| `->iconOnly()` | Show icon only (default) |
| `->textOnly()` | Show label only |
| `->button()` | Pill button with icon + label |
| `->primary()` / `->success()` / `->warning()` / `->danger()` | Color shorthands |
| `->requiresConfirmation()` | Show "Are you sure?" dialog before executing |
| `->confirm('message')` | Dialog with custom message |
| `->modalHeading('...')` | Custom dialog heading |
| `->modalDescription('...')` | Custom dialog body text |
| `->modalSubmitActionLabel('...')` | Custom confirm button label |
| `->action(fn($record) => ...)` | Server-side callback; fired via `POST /{resource}/{id}/action/{key}` |
| `->url('/path')` or `->url(fn($r) => ...)` | Navigate to URL instead of calling server |
| `->openUrlInNewTab()` | Open URL in a new tab |
| `->successNotificationTitle('...')` | Flash message shown after success |
| `->failureNotificationTitle('...')` | Flash message shown on failure |
| `->tooltip('...')` | Tooltip on hover (especially useful in icon-only mode) |
| `->badge('3', 'danger')` | Small badge overlaid on the button |
| `->visible(fn($record) => ...)` | Conditionally show per record |
| `->hidden()` | Always hide |

> **How execution works:** When the user clicks the action, the frontend POSTs to `POST /admin/{resource}/{id}/action/{key}`. The `ActionController` resolves the action from either `actions()` (legacy) or `recordActions()` (new), calls `->action()`, and returns the success notification. No extra route or controller code is needed.

---

### Toolbar & Bulk Actions

Bulk actions appear in a dropdown when the user selects one or more rows. All bulk action types **must** be nested inside `BulkActionGroup::make([...])`:

```php
use Larafusion\Tables\Actions\BulkActionGroup;
use Larafusion\Tables\Actions\DeleteBulkAction;
use Larafusion\Tables\Actions\ForceDeleteBulkAction;
use Larafusion\Tables\Actions\RestoreBulkAction;

->toolbarActions([
    BulkActionGroup::make([
        DeleteBulkAction::make(),            // soft-delete selected rows
        ForceDeleteBulkAction::make(),       // permanently delete (soft-delete resources)
        RestoreBulkAction::make(),           // restore trashed rows
    ]),
])
```

> **Important:** `DeleteBulkAction::make()` passed *directly* to `toolbarActions([])` without a `BulkActionGroup` wrapper will be silently ignored — the frontend only renders items inside groups.

Each bulk action class accepts a custom label:

```php
DeleteBulkAction::make()->label('Archive selected')
ForceDeleteBulkAction::make()->label('Wipe selected')
RestoreBulkAction::make()->label('Recover selected')
```

| Class                   | Default label          | Route called                           | Confirmation |
| ----------------------- | ---------------------- | -------------------------------------- | ------------ |
| `DeleteBulkAction`      | Delete selected        | `DELETE /{resource}/bulk`              | Animated modal dialog |
| `ForceDeleteBulkAction` | Force delete selected  | `DELETE /{resource}/bulk-force-delete` | Animated modal dialog |
| `RestoreBulkAction`     | Restore selected       | `POST /{resource}/bulk-restore`        | None (non-destructive) |

---

### Column Classes

All column classes live under `Larafusion\Columns\*`.

#### TextColumn

```php
use Larafusion\Columns\TextColumn;

TextColumn::make('title')
    ->sortable()
    ->searchable()      // include this column in the table's global search box
    ->inlineEditable()  // edit this cell inline in the index table
    ->copyable()        // click-to-copy button
    ->limit(80)         // truncate at N characters
    ->wrap()            // allow text to wrap across lines
    ->description('Short summary')  // second smaller line below value
    ->prefix('$')
    ->suffix(' USD')
    ->weight('bold')    // 'bold' | 'semibold' | 'medium'
    ->color('primary')  // static color name
    ->money('USD')      // format as currency
    ->asBadge()         // render as a gray inline badge chip
```

#### BadgeColumn

Renders values as coloured pill badges. Map values to named colors:

```php
use Larafusion\Columns\BadgeColumn;

BadgeColumn::make('status')
    ->colors([
        'success' => 'published',
        'warning' => 'draft',
        'danger'  => ['archived', 'deleted'],
        'info'    => 'reviewing',
    ])
    ->filterable('select')

// Single value:
BadgeColumn::make('role')
    ->color('primary', 'admin')
    ->color('success', 'editor')
```

Available color names: `primary` · `success` · `warning` · `danger` · `info` · `gray`

#### BooleanColumn

```php
use Larafusion\Columns\BooleanColumn;

BooleanColumn::make('is_active')
    ->label('Active')
    ->trueColor('success')     // default: 'success'
    ->falseColor('danger')     // default: 'danger'
    ->trueLabel('Yes')         // default: 'Yes'
    ->falseLabel('No')         // default: 'No'
    ->trueIcon('check-circle') // lucide icon name
    ->falseIcon('x-circle')
    ->filterable('boolean')
```

#### DateColumn

```php
use Larafusion\Columns\DateColumn;

DateColumn::make('created_at')
    ->label('Joined')
    ->sortable()
    ->since()           // render as "3 days ago"
    ->format('M j, Y')  // PHP date format (default: 'M j, Y')
    ->dateTime()        // includes time: 'M j, Y H:i'
    ->time()            // time only
```

#### ImageColumn

```php
use Larafusion\Columns\ImageColumn;

ImageColumn::make('avatar')
    ->circular()          // rounded-full vs rounded-lg
    ->size('2.5rem')      // CSS size (width = height)
    ->disk('public')      // storage disk (default: 'public')
    ->stacked(3)          // overlapping avatars, show up to N
```

#### IconColumn

```php
use Larafusion\Columns\IconColumn;

// Boolean mode (check / x icons):
IconColumn::make('is_featured')->boolean()

// Custom value → icon mapping:
IconColumn::make('type')
    ->icons([
        'article'  => 'file-text',
        'video'    => 'play-circle',
        'podcast'  => 'mic',
    ])
    ->colors([
        'article'  => 'primary',
        'video'    => 'success',
        'podcast'  => 'warning',
    ])
```

#### Common Column Methods

All column classes extend the base `Column` and share these methods:

```php
TextColumn::make('name')
    ->label('Full Name')   // override auto-generated label
    ->sortable()           // show sort icon; enables server-side sorting
    ->searchable()         // include in the table's global search box
    ->inlineEditable()     // allow editing the value inline in the table
    ->hidden()             // hide from table
    ->align('right')       // 'left' | 'center' | 'right'
    ->width('200px')       // fixed column width
    ->filterable()         // text filter
    ->filterable('select') // dropdown filter
    ->filterable('boolean')
    ->filterable('date_range')
    ->filterable('number_range')
    ->filterOptions([      // options for 'select' filter
        ['label' => 'Active', 'value' => 1],
        ['label' => 'Inactive', 'value' => 0],
    ])
    ->toggleable()                   // user can show/hide this column
    ->toggleable(hiddenByDefault: true)  // hidden by default, user can enable
```

> `->searchable()` is **search**, not filtering — it adds the column to the shared
> search box at the top of the table. `->filterable()` is separate and adds a
> per-column filter control. (Earlier versions aliased `->searchable()` to a filter;
> it now means global search, matching Filament.)

---

### Global Search (column-driven)

Mark any column `->searchable()` and the resource collects them automatically — there
is **no `$searchable` array to maintain**. The search box appears in the toolbar as
soon as at least one column is searchable, and typing runs a `LIKE` across every
searchable column.

```php
->columns([
    TextColumn::make('title')->searchable(),
    TextColumn::make('slug')->searchable(),
    TextColumn::make('author.name')->searchable(),   // searches the related table
])
```

Relationship columns (dot notation) are searched via `whereHas` on the relation, so
`author.name` matches against the related model's `name`. The legacy
`protected static array $searchable = [...]` still works and is merged in if present,
but you no longer need it.

### Inline Editing (column-driven)

Mark a column `->inlineEditable()` to let users edit that cell directly in the table
(the column must be backed by a form field of the same name). The resource collects
inline-editable columns automatically — no separate array needed.

```php
->columns([
    TextColumn::make('title')->inlineEditable(),
])
```

### Relationship Columns

Use dot notation to display a value from a related model. The relation is eager-loaded
(no N+1), so the value renders correctly:

```php
->columns([
    TextColumn::make('category.name')->label('Category')->sortable()->searchable(),
])
```

- **Display** — the frontend resolves the dotted path (`record.category.name`).
- **Search** — handled via `whereHas` when the column is `->searchable()`.
- **Sort** — supported for single-level `belongsTo` relations via a correlated
  subquery (no joins). Other relation types render but aren't click-sortable.

### Column-scoped queries (fast & safe by default)

The index query only `SELECT`s the local columns your table actually declares (plus the
primary key, any inline-editable columns, the soft-delete column, the record-title
attribute, and the foreign keys needed for `belongsTo` relationship columns). This means
smaller, faster queries and — importantly — columns you don't display (e.g. `password`)
never leave the database. Relationship columns are eager-loaded separately. Narrowing is
skipped only for deeply nested relations (`a.b.c`), which safely fall back to selecting
all base columns.

> If a record-action `->visibleWhen()` closure reads an attribute that isn't one of your
> displayed columns, include that attribute as a column (even `->hidden()`) so it stays
> in the `SELECT`.

---

### Legacy Column API

The original `Column::*` static factories are fully supported and can be mixed with the new table builder:

```php
use Larafusion\Columns\Column;

public static function columns(): array
{
    return [
        Column::text('name')->sortable()->filterable('text'),
        Column::badge('status')->filterable('select')->filterOptions([
            ['label' => 'Published', 'value' => 'published'],
            ['label' => 'Draft',     'value' => 'draft'],
        ]),
        Column::boolean('is_active')->filterable('boolean'),
        Column::date('created_at')->sortable()->filterable('date_range'),
        Column::image('avatar'),
        Column::number('price')->align('right')->sortable(),
    ];
}
```

When using `columns()` without `table()`, put sortable field names in `$sortable`:

```php
protected static array $sortable = ['name', 'created_at', 'price'];
```

---

### Standalone Filters

Define filters independently of columns using the Filter classes. All standalone filters are shown together in the filter panel alongside any column-level filters. The panel position is controlled by the `layout` argument of `->filters()` (or `->filtersLayout()`) — see [Filter Layout](#filter-layout) for all options.

```php
use Larafusion\Tables\Filters\Filter;
use Larafusion\Tables\Filters\SelectFilter;
use Larafusion\Tables\Filters\DateRangeFilter;
use Larafusion\Tables\Filters\TernaryFilter;
use Larafusion\Tables\Filters\TrashedFilter;

->filters([
    // Boolean toggle — fires a custom query closure when active
    Filter::make('active')
        ->label('Active only')
        ->query(fn ($query) => $query->where('is_active', true)),

    // Dropdown — values map directly to a DB column
    SelectFilter::make('role')
        ->label('Role')
        ->options(['admin' => 'Administrator', 'editor' => 'Editor', 'viewer' => 'Viewer'])
        ->searchable()     // add a search box inside the dropdown
        ->multiple(),      // allow selecting multiple values

    // 3-state filter (All / Yes / No)
    TernaryFilter::make('is_verified')
        ->label('Verified')
        ->trueLabel('Verified')
        ->falseLabel('Unverified')
        ->placeholder('All'),

    // Date range
    DateRangeFilter::make('created_at')->label('Joined between'),

    // Soft-delete — shows Active / All / Trashed tabs
    TrashedFilter::make(),
])
```

---

#### Filter (boolean toggle)

Renders as a checkbox / toggle in the filter drawer. When active, fires the `query()` closure.

```php
Filter::make('featured')
    ->label('Featured only')
    ->attribute('is_featured')          // DB column (defaults to filter name)
    ->default('true')                   // pre-activated on page load
    ->indicator('Featured')             // label shown in the active-filter bar
    ->query(fn ($query) => $query->where('is_featured', true))
```

| Method | Description |
| ------ | ----------- |
| `->label('...')` | Display label |
| `->attribute('column')` | DB column to filter (defaults to filter name) |
| `->query(fn($query) => ...)` | Custom Eloquent query applied when active |
| `->default($value)` | Default value on load |
| `->indicator('...')` | Label shown in the active-filters indicator row |

---

#### SelectFilter

Renders as a list of checkboxes for option-based filtering.

```php
SelectFilter::make('status')
    ->label('Status')
    ->options([
        'draft'     => 'Draft',
        'published' => 'Published',
        'archived'  => 'Archived',
    ])
    ->searchable()           // adds a search box inside the list
    ->multiple()             // allow selecting several values
    ->attribute('status')    // DB column (defaults to filter name)
    ->default('published')   // pre-selected option
    ->query(fn ($q, $value) => $q->whereIn('status', (array) $value))  // optional custom query
```

| Method | Description |
| ------ | ----------- |
| `->options([...])` | `'value' => 'Label'` map of selectable options |
| `->options(MyEnum::class)` | Auto-populate from a BackedEnum's cases |
| `->relationship('rel', 'name')` | Populate options from a related model and filter through the relationship |
| `->multiple()` | Allow selecting multiple values at once |
| `->searchable()` | Show a search box inside the option list |
| `->attribute('column')` | DB column override |
| `->default($value)` | Pre-selected value or array |
| `->query(fn($q, $v) => ...)` | Custom query; receives the selected value(s) |

##### Relationship options

Populate the option list from an Eloquent relationship on the resource model.
Options become `relatedKey => titleAttribute`, and filtering runs through the
relationship (`whereHas`), so it works for `belongsTo`, `hasMany`, and
`belongsToMany`:

```php
SelectFilter::make('Category')
    ->relationship('category', 'name')   // relationship method, title column
    ->multiple()                          // selecting several categories
    ->searchable();                       // search box in the option list
```

Scope the option query with an optional third closure argument:

```php
SelectFilter::make('Author')
    ->relationship('author', 'name', fn ($query) => $query->where('is_active', true))
    ->searchable();
```

Options are resolved server-side when the table config is serialized (the
resource model is known there) and sent to the client, so no extra request is
needed. `->preload()` is accepted for Filament compatibility but is a no-op —
options are always preloaded.

##### Enum options (label, color, icon, description)

Pass a `BackedEnum` to `->options()` and the filter automatically picks up each
case's label, color, icon, and description from the `HasLabel` / `HasColor` /
`HasIcon` / `HasDescription` contracts — the same ones `BadgeColumn::enum()`
uses — so options render as coloured, icon-badged rows that match the table:

```php
SelectFilter::make('status')
    ->options(PostStatus::class)   // enum implementing HasLabel/HasColor/HasIcon
    ->multiple()
    ->searchable();
```

You can also set the metadata manually for a plain array of options:

```php
SelectFilter::make('priority')
    ->options(['low' => 'Low', 'high' => 'High'])
    ->colors(['low' => 'gray', 'high' => 'danger'])
    ->icons(['high' => 'flame'])
    ->descriptions(['high' => 'Needs attention now']);
```

Rendering rules on the client:

- **Multiple**, **searchable**, or **any option metadata present** → the rich
  dropdown (chips, search box, coloured/icon option rows, descriptions),
  matching the form `Select` field with `->native(false)`.
- Plain single select with no metadata → a lightweight native `<select>`.

###### Opting out of enum metadata

The enum may define colors/icons/descriptions, but a given filter can suppress
any or all of them — without changing the enum:

```php
SelectFilter::make('status')->options(PostStatus::class)->withoutIcons();
SelectFilter::make('status')->options(PostStatus::class)->withoutColors();
SelectFilter::make('status')->options(PostStatus::class)->withoutDescriptions();

// Labels only — no color, icon, or description:
SelectFilter::make('status')->options(PostStatus::class)->plain();
```

| Method | Effect |
| ------ | ------ |
| `->withoutColors()` | Neutral chips/labels instead of coloured ones |
| `->withoutIcons()` | Hide the per-option icon |
| `->withoutDescriptions()` | Hide the helper description under each option |
| `->plain()` | All of the above — labels only |

Each accepts an optional boolean condition (e.g. `->withoutIcons($isCompact)`),
and the toggles are order-independent — they work whether called before or after
`->options()`. With `->plain()` on a non-searchable single select, the control
falls back to the lightweight native `<select>`.

---

#### TernaryFilter *(new)*

Three-state selector: **All** (no filter) · **Yes** · **No**. Ideal for boolean and nullable columns.

```php
// Boolean column
TernaryFilter::make('is_active')
    ->label('Status')
    ->trueLabel('Active')
    ->falseLabel('Inactive')
    ->placeholder('All Users')    // "All" button label (default: 'All')
    ->attribute('is_active')      // DB column override

// Nullable timestamp — "Yes" = not-null, "No" = null
TernaryFilter::make('email_verified_at')
    ->label('Email verified')
    ->trueLabel('Verified')
    ->falseLabel('Unverified')
    ->nullable()                  // true → whereNotNull; false → whereNull

// Fully custom query per state
TernaryFilter::make('plan')
    ->label('Plan')
    ->trueLabel('Premium')
    ->falseLabel('Free')
    ->queries(
        true:  fn ($q) => $q->where('plan', 'premium'),
        false: fn ($q) => $q->where('plan', 'free'),
        blank: fn ($q) => $q,    // optional — do nothing when "All"
    )
```

| Method | Description |
| ------ | ----------- |
| `->trueLabel('...')` | "Yes" button text (default: `'Yes'`) |
| `->falseLabel('...')` | "No" button text (default: `'No'`) |
| `->placeholder('...')` | "All" button text (default: `'All'`) |
| `->attribute('column')` | DB column override |
| `->nullable()` | Filter null vs non-null instead of true/false |
| `->queries(true: fn, false: fn, blank: fn)` | One closure per filter state |
| `->default('true'\|'false'\|'')` | Pre-selected state |

---

#### DateRangeFilter

Renders a From / To date pair.

```php
DateRangeFilter::make('created_at')
    ->label('Joined between')
    ->attribute('created_at')      // DB column override
    ->query(fn ($q, $v) => $q      // optional custom query
        ->when($v['from'] ?? null, fn($q, $d) => $q->where('created_at', '>=', $d))
        ->when($v['to']   ?? null, fn($q, $d) => $q->where('created_at', '<=', $d)))
```

---

---

### Filter Layout

Control where and how the filter panel appears with the `FiltersLayout` enum. The easiest way is the `layout` argument of `->filters()`:

```php
use Larafusion\Tables\Enums\FiltersLayout;

->filters([
    // ...
], layout: FiltersLayout::Modal)
```

The default is `FiltersLayout::Dropdown` — you don't need to pass anything for the funnel-icon popover. `->filtersLayout()` is also available on the `Table` builder and accepts the same values. The filter trigger button uses the **funnel icon** (matching Filament's `heroicons:funnel` design).

```php
use Larafusion\Tables\Enums\FiltersLayout;
use Larafusion\Tables\Table;

->filtersLayout(FiltersLayout::Dropdown)                  // Filament-style popover below the filter button (default)
->filtersLayout(FiltersLayout::Drawer)                    // slide-in panel from the right
->filtersLayout(FiltersLayout::Modal)                     // centred modal dialog
->filtersLayout(FiltersLayout::Above)                     // inline panel above the table rows
->filtersLayout(FiltersLayout::AboveCollapsible)          // above, with collapse/expand toggle
->filtersLayout(FiltersLayout::Below)                     // inline panel below the table rows
->filtersLayout(FiltersLayout::BeforeContent)             // fixed sidebar to the LEFT of the table
->filtersLayout(FiltersLayout::BeforeContentCollapsible)  // left sidebar with collapse toggle
->filtersLayout(FiltersLayout::AfterContent)              // fixed sidebar to the RIGHT of the table
->filtersLayout(FiltersLayout::AfterContentCollapsible)   // right sidebar with collapse toggle
```

The enum's string values (`'drawer'`, `'modal'`, `'before_content'`, …) are still accepted for backwards compatibility.

Additional layout options:

```php
// Number of grid columns in the filter form (useful for above/below layouts).
// Ignored for the side layouts (before_content / after_content and their
// collapsible variants) — sidebars are always single-column.
->filtersFormColumns(2)

// Panel width — dropdown popover width, drawer width, or modal max-width.
// Increase it when the table has many filters.
->filtersFormWidth('28rem')

// Max-height before the filter list scrolls (drawer / modal)
->filtersFormMaxHeight('400px')

// Hide the active-filter indicator chips row above the table
->hiddenFilterIndicators()
```

**Layout behaviour summary:**

| Layout | Where rendered | Trigger | Collapsible? |
| ------ | -------------- | ------- | ------------ |
| `FiltersLayout::Dropdown` | Popover below the filter icon button (default) | Icon-only button + badge | — |
| `FiltersLayout::Drawer` | Slide-in panel from right | Button with label + badge | — |
| `FiltersLayout::Modal` | Centred dialog | Button with label + badge | — |
| `FiltersLayout::Above` | Inline — above table rows | None | No |
| `FiltersLayout::AboveCollapsible` | Inline — above table rows | None | Yes |
| `FiltersLayout::Below` | Inline — below table rows | None | No |
| `FiltersLayout::BeforeContent` | Sticky sidebar, left of table | None | No |
| `FiltersLayout::BeforeContentCollapsible` | Sticky sidebar, left of table | None | Yes |
| `FiltersLayout::AfterContent` | Sticky sidebar, right of table | None | No |
| `FiltersLayout::AfterContentCollapsible` | Sticky sidebar, right of table | None | Yes |

Side-layout sidebars stick to the viewport while the table scrolls, so the Reset / Apply buttons stay visible even on long pages (e.g. 50 rows per page); the filter list scrolls internally when it outgrows the viewport.

**Full example:**

```php
Table::make()
    ->columns([...])
    ->filters([
        SelectFilter::make('role')->options([...]),
        TernaryFilter::make('is_active')->label('Active'),
    ], layout: FiltersLayout::BeforeContent)   // sidebar to the left
    ->filtersFormMaxHeight('600px')
```

> **Active-filter indicators:** Active-filter chips are shown **only** for the trigger-based layouts (`Dropdown` / `Modal` / `Drawer`), rendered in a full-width row directly below the table's column-header row; the trigger button also shows a badge count. Inline (`Above` / `AboveCollapsible` / `Below`) and side layouts show no chips — their filter form is visible on the page, with a funnel-icon header and a count badge instead. Chips and badge counts reflect **applied** filters only — editing the filter form doesn't change them until the user clicks Apply (or Reset). `->hiddenFilterIndicators()` hides the chips row.

---

#### Base Filter Methods (all filter types share these)

| Method | Description |
| ------ | ----------- |
| `->label('...')` | Display label shown in the filter drawer |
| `->attribute('column')` | DB column to filter (defaults to the filter name) |
| `->query(\Closure $cb)` | Custom Eloquent query closure |
| `->default($value)` | Default value loaded when the page opens |
| `->indicator('...')` | Short label for the active-filter indicator |

---

