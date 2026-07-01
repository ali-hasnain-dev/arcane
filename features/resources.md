# Resources

## Overview

A **Resource** is the central abstraction in Larafusion. It maps a single Eloquent model to a complete admin interface — form, table, navigation entry, authorization guards, validation rules, export/import columns, soft-delete behavior, inline editing, global search, and per-row actions — all derived from one PHP class.

You never touch routing, controller code, or React components. You define the shape of your data in PHP; Larafusion serialises that shape to JSON over Inertia.js and renders it in the prebuilt React pages.

---

## Why This Feature Exists

Traditional Laravel admin packages require you to either publish and edit views (Blade-heavy), write controller boilerplate for every model, or configure each CRUD flow separately. Larafusion follows the convention-over-configuration philosophy: one resource class per model, auto-discovered, zero registration ceremony.

Benefits:
- No route files to edit.
- No controller classes to write.
- No React components to create.
- Validation rules live beside field definitions — they cannot drift apart.
- Authorization is a single method override, not a Policy class.

---

## Core Concepts

### Resource Class

Every resource extends `Larafusion\Resource`. The class is abstract; you must implement `form()`. Everything else has a sensible default.

```
abstract class Resource
{
    protected static string $model;           // Eloquent model class
    protected static string $navigationIcon;  // Lucide icon name
    protected static string $recordLabel;     // Human-readable singular name

    abstract public static function form(): array;   // REQUIRED
    public static function table(Table $table): Table { ... }  // optional
}
```

### Auto-Discovery

`LarafusionManager::discoverResources()` scans `app/Larafusion/` recursively using `RecursiveIteratorIterator`. Any class that:
- ends in `.php`
- exists as a class (`class_exists`)
- is a subclass of `Larafusion\Resource`

...gets registered automatically. PSR-4 naming is assumed: the path `app/Larafusion/Resources/Posts/PostResource.php` maps to `App\Larafusion\Resources\Posts\PostResource`.

### Slug

The URL slug is derived from `$model` unless `$slug` is explicitly set:

```php
// Model = App\Models\Post → slug = "posts"
// Model = App\Models\OrderItem → slug = "orderitems"
// Explicit override:
protected static string $slug = 'order-items';
```

### Schema Serialisation

`Resource::getFormSchema()` calls `Serializer::fields(static::form())` which walks the field array, calls `->toArray()` on each `Field`, `Section`, `Tabs`, or `Grid` object, and returns the plain array that Inertia ships to React as the `schema` prop.

`Resource::getColumnsSchema()` does the same for the `Table` columns.

---

## Architecture

### PHP Side

```
ResourceController::index()
  → LarafusionManager::resolve($slug)       // look up class by slug
  → $resourceClass::canViewAny()        // authorization gate
  → apply search / filter / sort        // Eloquent query building
  → Inertia::render('Larafusion/Index', [...])
```

The controller is shared by every resource — there is no per-resource controller. It always calls the same sequence of static methods on the resolved resource class.

### Inertia Props (Index)

| Prop | Strategy | Content |
|---|---|---|
| `resource` | lazy closure | slug, label, can permissions, flags |
| `schema` | lazy closure | serialised form fields |
| `columns` | lazy closure | serialised table columns |
| `tableConfig` | lazy closure | table options (striped, empty state, etc.) |
| `actions` | lazy closure | per-row action definitions |
| `records` | regular | paginated Eloquent results |
| `widgets` | `Inertia::defer()` or `[]` | widget data (deferred only when widgets exist) |

On sort/filter/paginate the frontend sends `only: ['records']`; closures for `schema`, `columns`, etc. are never evaluated again during that navigation cycle.

### React Side

The `Larafusion/Index.tsx` page receives these props via `usePage()`. It passes `schema`, `columns`, `records`, and `actions` to `BasicTable`, which renders sortable columns, pagination, row actions, and inline search. The `schema` prop is also handed to `FormModal` when `useModalForms()` is enabled.

---

## Installation / Setup

Resources require no special setup beyond registering your `PanelProvider`:

```php
// bootstrap/providers.php
return [
    App\Providers\Larafusion\AdminPanelProvider::class,
];
```

Then scaffold:

```bash
php artisan larafusion:resource Post
```

This creates:

```
app/Larafusion/Resources/Posts/
├── PostResource.php
├── Schemas/PostForm.php
├── Tables/PostsTable.php
├── Pages/ListPosts.php
├── Pages/CreatePost.php
└── Pages/EditPost.php
```

---

## Basic Usage

### Minimal Resource

```php
namespace App\Larafusion\Resources\Posts;

use App\Models\Post;
use Larafusion\Resource;
use Larafusion\Fields\Text;
use Larafusion\Fields\Textarea;

class PostResource extends Resource
{
    protected static string $model          = Post::class;
    protected static string $navigationIcon = 'file-text';
    protected static string $recordLabel    = 'Post';
    protected static array  $searchable     = ['title', 'body'];

    public static function form(): array
    {
        return [
            Text::make('title')->required()->maxLength(255),
            Textarea::make('body'),
        ];
    }
}
```

That's enough for a fully functional CRUD interface.

### Adding a Table

```php
use Larafusion\Tables\Table;
use Larafusion\Columns\TextColumn;
use Larafusion\Columns\DateColumn;

public static function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('title')->sortable()->searchable(),
            TextColumn::make('status')->badge(),
            DateColumn::make('created_at')->since()->sortable(),
        ]);
}
```

### Adding Navigation Sorting / Grouping

```php
protected static string  $navigationGroup = 'Content';
protected static int     $navigationSort  = 1;
protected static string  $navigationIcon  = 'newspaper';
```

---

## Configuration

| Property | Type | Default | Description |
|---|---|---|---|
| `$model` | `string` | — | **Required.** Fully qualified Eloquent model class |
| `$navigationLabel` | `string` | `{Model}s` | Sidebar label |
| `$navigationIcon` | `string` | `'circle'` | Lucide icon name |
| `$navigationGroup` | `?string` | `null` | Groups items under a collapsible heading |
| `$navigationSort` | `int` | `0` | Sort order within the group or sidebar |
| `$slug` | `string` | `{model}s` | URL segment |
| `$recordLabel` | `string` | `'Record'` | Used in success flash messages |
| `$perPage` | `int` | `10` | Default pagination size |
| `$searchable` | `array` | `[]` | Column names to search against |
| `$sortable` | `array` | `[]` | Extra sortable column names (sortable columns declared in `table()` are merged automatically) |

---

## API Reference

### Static Methods

#### `form(): array`
**Required.** Return an array of `Field`, `Section`, `Tabs`, or `Grid` instances that define the create/edit form.

#### `table(Table $table): Table`
Optional. Override to configure the table builder. The default wraps the legacy `columns()` array.

#### `columns(): array`
Legacy API. Return a flat array of `Column` instances. Use `table()` for new code.

#### `actions(): array`
Return `ButtonAction` or `LinkAction` instances for per-row legacy actions. New code should use `table()->recordActions([...])`.

#### `widgets(): array`
Return `Widget` instances shown above the index table on the dashboard.

#### `useModalForms(): bool`
Return `true` to open create/edit forms in a modal overlay instead of navigating to a separate page.

#### `exportable(): bool`
Return `true` to show an Export button that triggers CSV download.

#### `importable(): bool`
Return `true` to show an Import link that opens the 3-step CSV import wizard.

#### `softDeletes(): bool`
Return `true` to enable soft-delete support (Trashed tab, Restore, Force Delete).

#### `getInlineEditable(): array`
Return an array of field names that can be edited inline by clicking a table cell.

#### `canViewAny(): bool`
Gates the index and show endpoints. Default `true`.

#### `canCreate(): bool`
Gates the create/store endpoints. Default `true`.

#### `canEdit(): bool`
Gates edit/update and inline-edit endpoints. Default `true`.

#### `canDelete(): bool`
Gates destroy, bulk-destroy, force-destroy endpoints. Default `true`.

#### `canView(): bool`
Gates the show endpoint. Default `true`.

#### `getGlobalSearchTitle(Model $record): string`
Override to customise the primary text shown in global search results. Default uses the first `$searchable` field.

#### `getGlobalSearchDescription(Model $record): ?string`
Override to customise the secondary line in global search results. Default uses the second `$searchable` field.

#### `getExportColumns(): array`
Return a `['db_column' => 'CSV Header']` map. Defaults to `id`, `$searchable`, `$sortable`, `created_at`.

#### `getImportColumns(): array`
Return a `['CSV Header' => 'db_column']` map for the import wizard. Defaults to the inverse of `getExportColumns()` minus `id`, `created_at`, `updated_at`.

#### `getNavigationBadge(): string|int|null`
Return a value to show a badge chip on the sidebar nav item (e.g. a record count). Default `null`.

---

## Real World Examples

### Blog Post Resource

```php
namespace App\Larafusion\Resources\Posts;

use App\Models\Post;
use App\Models\User;
use App\Enums\PostStatus;
use Larafusion\Resource;
use Larafusion\Tables\Table;
use Larafusion\Fields\Text;
use Larafusion\Fields\Select;
use Larafusion\Fields\RichText;
use Larafusion\Fields\Toggle;
use Larafusion\Fields\DatePicker;
use Larafusion\Fields\ImageUpload;
use Larafusion\Fields\Relations\BelongsTo;
use Larafusion\Columns\TextColumn;
use Larafusion\Columns\BadgeColumn;
use Larafusion\Columns\DateColumn;
use Larafusion\Columns\ImageColumn;
use Larafusion\Tables\Actions\EditAction;
use Larafusion\Tables\Actions\DeleteAction;
use Larafusion\Layout\Section;
use Larafusion\Layout\Grid;

class PostResource extends Resource
{
    protected static string $model          = Post::class;
    protected static string $navigationIcon = 'newspaper';
    protected static string $recordLabel    = 'Post';
    protected static string $navigationGroup = 'Content';
    protected static array  $searchable     = ['title', 'slug'];
    protected static int    $perPage        = 20;

    public static function form(): array
    {
        return [
            Section::make('Content')
                ->columns(2)
                ->schema([
                    Text::make('title')->required()->maxLength(200),
                    Text::make('slug')->required()->unique('posts', 'slug'),
                    RichText::make('body')->required()->columnSpan(2),
                ]),
            Section::make('Publishing')
                ->collapsible()
                ->schema([
                    Select::make('status')->options(PostStatus::class)->required(),
                    BelongsTo::make('author')->model(User::class)->labelColumn('name'),
                    DatePicker::make('published_at')->nullable(),
                    Toggle::make('featured'),
                ]),
            ImageUpload::make('cover_image')->directory('posts'),
        ];
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('cover_image')->circular()->size('2rem'),
                TextColumn::make('title')->sortable()->limit(60),
                BadgeColumn::make('status')->enum(PostStatus::class),
                TextColumn::make('author.name')->label('Author'),
                DateColumn::make('published_at')->since()->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function exportable(): bool { return true; }
    public static function softDeletes(): bool { return true; }
}
```

### Resource with Navigation Badge (Live Count)

```php
public static function getNavigationBadge(): string|int|null
{
    return static::getModelInstance()->where('status', 'pending')->count() ?: null;
}
```

### Explicit Resource Registration (Opt-out of Auto-Discovery)

```php
// AdminPanelProvider.php
public function panel(Panel $panel): Panel
{
    return $panel
        ->id('admin')
        ->path('admin')
        ->resources([
            PostResource::class,
            UserResource::class,
        ]);
}
```

---

## Advanced Usage

### Modal Forms

When `useModalForms()` returns `true`, clicking "New Post" or the Edit action on the index table opens a modal overlay instead of navigating to `/posts/create` or `/posts/{id}/edit`. The same `schema` prop powers the modal form. Useful for data that feels lightweight enough not to deserve its own page.

```php
public static function useModalForms(): bool { return true; }
```

### Custom Slug

The automatic slug lowercases the model class name and appends `s`. For compound names or irregular plurals, set it explicitly:

```php
protected static string $slug = 'media-files';
```

### Custom Per-Page Limits

The index controller respects `$perPage` as the default but allows the UI to request any value between 5 and 100 via `?per_page=`:

```php
protected static int $perPage = 25;
```

### Custom Validation Attribute Names in Error Messages

Define it at the field level — it travels with the schema:

```php
Text::make('email_address')
    ->validationAttribute('email address')
    ->validationMessages(['required' => 'Please provide your :attribute.']);
```

### Separating Schema Classes

Large resources benefit from extracting the form and table to dedicated classes:

```php
// Schemas/PostForm.php
class PostForm
{
    public static function fields(): array { return [...]; }
}

// Tables/PostsTable.php
class PostsTable
{
    public static function build(Table $table): Table { return $table->columns([...]); }
}

// PostResource.php
public static function form(): array { return PostForm::fields(); }
public static function table(Table $table): Table { return PostsTable::build($table); }
```

---

## Best Practices

- **Put the resource in its own namespace folder** (`Resources/Posts/PostResource.php`). Auto-discovery scans recursively, so nesting depth doesn't matter.
- **Co-locate validation with fields**, not in a separate request class. `getCreateRules()` extracts them automatically.
- **Use `$searchable` and declare `->sortable()` on columns** rather than duplicating in `$sortable`. The resource merges them automatically via `getSortable()`.
- **Return `null` from `getNavigationBadge()`** when the count is zero, to avoid displaying a "0" badge.
- **Keep `form()` readable**. Extract large schemas into a dedicated `Schemas/` class.

---

## Common Mistakes

**Not setting `$model`.** The property has no default; the resource will throw a PHP error when the controller tries to call `getModelInstance()`.

**Using `$sortable` and `->sortable()` in the same column.** The resource merges both, so you only need one. Prefer `->sortable()` on the column — it keeps sort configuration with the column definition.

**Forgetting `->withTrashed()` / `onlyTrashed()` queries.** Larafusion handles these automatically once `softDeletes(): bool { return true; }` is set; do not add your own `withTrashed()` to the model scope.

**Naming the slug the same as an existing route.** Larafusion defines `/search`, `/upload`, `/p/{page}`, `/profile`. Do not create a resource with a slug that collides with these.

---

## Security Considerations

- The authorization methods (`canViewAny`, `canCreate`, `canEdit`, `canDelete`) are the primary authorization layer. They run before every controller action via `abort_unless()`.
- When `strictAuthorization()` is enabled on the panel, hidden items throw an `AuthorizationException` rather than just disappearing — enforcing a 403 for any direct URL access.
- The `getInlineEditable()` whitelist is enforced server-side on every `PATCH /{resource}/{id}/inline` request. A field not in that array returns 403 even if sent from the browser.
- Password fields (any name containing `"password"`) are automatically `bcrypt()`-hashed in the controller before saving — but you should still mark them with the `Password` field type so React masks them.

---

## Performance Considerations

- **`Inertia::once()` props** (`schema`, `columns`, `tableConfig`, `actions`) are evaluated once per full page visit and never re-sent on partial reloads (sort, filter, paginate). The serialiser is therefore not called on every table interaction.
- **Widgets are deferred** only when `widgets()` returns a non-empty array. If the resource has no widgets, `[]` is sent immediately with no extra HTTP request.
- **CSV export uses chunking** (500 records per chunk) via `chunk()` to avoid loading the entire table into memory.
- **`$perPage` max is capped at 100** in the controller regardless of the request parameter.

---

## Troubleshooting

**Resource not appearing in the sidebar.** Check that: (a) the class extends `Larafusion\Resource`, (b) the file is under `app/Larafusion/`, and (c) `class_exists()` returns true (autoloader issue if not).

**"Larafusion resource [slug] is not registered" exception.** The slug resolved by `getSlug()` does not match any registered resource. Either the model class name is unusual (set `$slug` explicitly) or auto-discovery failed.

**Validation rules not running.** `getCreateRules()` only extracts rules from `Field` instances returned by `form()`. Layout wrappers (`Section`, `Grid`, `Tabs`) are flattened by `Serializer::flattenFields()`. If a field is nested inside a layout, its rules are still extracted — but the Tabs flattening iterates `$tab->getSchema()` rather than re-calling `Serializer::fields()`, so all tabs must be attached to the `Tabs` instance via `->tabs([Tab::make()->schema([...])])`.

---

## FAQ

**Can I have multiple panels with different resource sets?** Yes — each `PanelProvider` calls `LarafusionManager::registerPanel()` which accepts an explicit `->resources([...])` list. Different panel providers can each call `->resources()` with different classes. Note that `LarafusionManager` is a static class, so in the typical single-panel setup you don't need to worry about this.

**Can a resource use a model that does not have an `id` primary key?** The controller uses `findOrFail($id)` so it works with any primary key as long as the Eloquent model has `$primaryKey` set. The bulk-delete route uses `whereIn('id', $ids)` which would need to be overridden for non-`id` keys — file an issue if this is a blocker.

**Do I need to run `php artisan optimize:clear` after adding a resource?** No. Auto-discovery runs at boot time via PHP reflection — no cache is involved.

---

## Related Features

- [Forms](forms.md) — the field types returned by `form()`
- [Form Layout](form-layout.md) — `Section`, `Tabs`, `Grid` wrappers used inside `form()`
- [Tables](tables.md) — the `Table` builder returned by `table()`
- [Table Columns](table-columns.md) — column types used inside `table()->columns()`
- [Table Actions](table-actions.md) — `EditAction`, `DeleteAction`, custom `Action`
- [Soft Deletes](soft-deletes.md) — `softDeletes()`, trashed tab, restore
- [Inline Editing](inline-editing.md) — `getInlineEditable()`
- [Export & Import](export-import.md) — `exportable()`, `importable()`
- [Global Search](global-search.md) — `$searchable`, `getGlobalSearchTitle()`
- [Widgets](widgets.md) — `widgets()` on the resource
