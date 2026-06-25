# Resources

## Resources

A **Resource** maps an Eloquent model to a full CRUD interface. It wires together the form schema, table definition, navigation settings, and authorization.

### Filament-Style Folder Structure

```php
// app/Larafusion/Resources/Users/UserResource.php
namespace App\Larafusion\Resources\Users;

use App\Models\User;
use Larafusion\Resource;
use Larafusion\Tables\Table;
use App\Larafusion\Resources\Users\Schemas\UserForm;
use App\Larafusion\Resources\Users\Tables\UsersTable;

class UserResource extends Resource
{
    protected static string $model          = User::class;
    protected static string $navigationIcon = 'users';
    protected static string $recordLabel    = 'User';
    protected static array  $searchable     = ['name', 'email'];

    public static function form(): array
    {
        return UserForm::fields();
    }

    public static function table(Table $table): Table
    {
        return UsersTable::build($table);
    }

    public static function actions(): array
    {
        return UsersTable::actions();
    }
}
```

### Resource Auto-Discovery

Larafusion **recursively** scans `app/Larafusion/` for any class that extends `Larafusion\Resource`. No explicit registration is required — create the file and it appears in the panel.

```
app/Larafusion/
└── Resources/
    ├── Users/UserResource.php     ← discovered automatically
    ├── Posts/PostResource.php     ← discovered automatically
    └── Orders/OrderResource.php   ← discovered automatically
```

To opt in to **explicit control** (skips auto-discovery):

```php
->resources([
    \App\Larafusion\Resources\Users\UserResource::class,
    \App\Larafusion\Resources\Posts\PostResource::class,
])
```

### Resource Options

| Property / Method                     | Default    | Description                                                                                |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `$model`                              | —          | Eloquent model class (required)                                                            |
| `$navigationLabel`                    | auto       | Sidebar label (auto-generated from model name)                                             |
| `$navigationIcon`                     | `'circle'` | Sidebar icon key                                                                           |
| `$navigationGroup`                    | `null`     | Group key for sidebar grouping                                                             |
| `$navigationSort`                     | `0`        | Sort order within its group/level                                                          |
| `$slug`                               | auto       | URL slug (auto: model name + 's')                                                          |
| `$recordLabel`                        | `'Record'` | Label used in flash messages                                                               |
| `$perPage`                            | `10`       | Default pagination size                                                                    |
| `$searchable`                         | `[]`       | Column names used for the global search box                                                |
| `$sortable`                           | `[]`       | Column names sortable server-side (auto-merged from `table()` columns with `->sortable()`) |
| `form()`                              | —          | Field definitions (required)                                                               |
| `table(Table $table): Table`          | delegates  | Filament-style table builder (columns, filters, record/bulk actions, sort)                 |
| `columns()`                           | `[]`       | Legacy table column definitions (still supported)                                          |
| `actions()`                           | `[]`       | Legacy custom actions (ButtonAction / LinkAction) — prefer `Action::make()` in `table()`  |
| `widgets()`                           | `[]`       | Widgets shown above the index table                                                        |
| `exportable()`                        | `false`    | Enable CSV export button                                                                   |
| `importable()`                        | `false`    | Enable CSV import wizard                                                                   |
| `softDeletes()`                       | `false`    | Show Trashed tab + restore/force-delete                                                    |
| `useModalForms()`                     | `false`    | Open create/edit in a modal instead of a new page                                          |
| `getInlineEditable()`                 | `[]`       | Field names editable inline in the table                                                   |
| `getNavigationBadge()`                | `null`     | Badge count shown on the sidebar item                                                      |
| `getGlobalSearchTitle($record)`       | auto       | Primary line in global search results                                                      |
| `getGlobalSearchDescription($record)` | auto       | Secondary line in global search results                                                    |

---
