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
| `->filtersLayout('dropdown')`                 | Where/how the filter panel appears (`dropdown` · `drawer` · `modal` · `above` · `above_collapsible` · `below` · `before_content` · `before_content_collapsible` · `after_content` · `after_content_collapsible`) |
| `->filtersFormColumns(2)`                     | Grid columns inside the filter form (default: 1)                     |
| `->filtersFormWidth('24rem')`                 | Max-width of the drawer/modal panel                                  |
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
    ->searchable()      // adds per-column filter input
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

Define filters independently of columns using the Filter classes. All standalone filters are shown together in the filter panel alongside any column-level filters. The panel position is controlled by `->filtersLayout()` — see [Filter Layout](#filter-layout) for all options.

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
| `->multiple()` | Allow selecting multiple values at once |
| `->searchable()` | Show a search box inside the option list |
| `->attribute('column')` | DB column override |
| `->default($value)` | Pre-selected value or array |
| `->query(fn($q, $v) => ...)` | Custom query; receives the selected value(s) |

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

Control where and how the filter panel appears using `->filtersLayout()` on the `Table` builder. The filter trigger button uses the **funnel icon** (matching Filament's `heroicons:funnel` design).

```php
use Larafusion\Tables\Table;

->filtersLayout('dropdown')           // Filament-style popover below the filter button
->filtersLayout('drawer')             // slide-in panel from the right (default)
->filtersLayout('modal')              // centred modal dialog
->filtersLayout('above')              // inline panel above the table rows
->filtersLayout('above_collapsible')  // above, with collapse/expand toggle
->filtersLayout('below')              // inline panel below the table rows
->filtersLayout('before_content')     // fixed sidebar to the LEFT of the table
->filtersLayout('before_content_collapsible')  // left sidebar with collapse toggle
->filtersLayout('after_content')      // fixed sidebar to the RIGHT of the table
->filtersLayout('after_content_collapsible')   // right sidebar with collapse toggle
```

Additional layout options:

```php
// Number of grid columns in the filter form (useful for above/below layouts)
->filtersFormColumns(2)

// Max-width of the drawer / modal panel
->filtersFormWidth('24rem')

// Max-height before the filter list scrolls (drawer / modal)
->filtersFormMaxHeight('400px')

// Hide the active-filter indicator chips row above the table
->hiddenFilterIndicators()
```

**Layout behaviour summary:**

| Layout value | Where rendered | Trigger | Collapsible? |
| ------------ | -------------- | ------- | ------------ |
| `dropdown` | Popover below the filter icon button | Icon-only button + badge | — |
| `drawer` | Slide-in panel from right (default) | Button with label + badge | — |
| `modal` | Centred dialog | Button with label + badge | — |
| `above` | Inline — above table rows | None | No |
| `above_collapsible` | Inline — above table rows | None | Yes |
| `below` | Inline — below table rows | None | No |
| `before_content` | Fixed sidebar, left of table | None | No |
| `before_content_collapsible` | Fixed sidebar, left of table | None | Yes |
| `after_content` | Fixed sidebar, right of table | None | No |
| `after_content_collapsible` | Fixed sidebar, right of table | None | Yes |

**Full example:**

```php
Table::make()
    ->columns([...])
    ->filters([
        SelectFilter::make('role')->options([...]),
        TernaryFilter::make('is_active')->label('Active'),
    ])
    ->filtersLayout('before_content')   // sidebar to the left
    ->filtersFormColumns(1)
    ->filtersFormMaxHeight('600px')
```

> **Active-filter indicators:** For `drawer` and `modal` layouts the trigger button shows a badge count when filters are active. For `above` / `above_collapsible` / `below` layouts, active-filter indicator chips appear in a row above the inline form. For side layouts the filter form is always visible, so no separate indicators are needed.

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

