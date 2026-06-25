# Navigation, Pages & Modal Forms

## Navigation Groups & Badges

### Groups

**Declare on the resource:**

```php
class PostResource extends Resource
{
    protected static ?string $navigationGroup = 'Content';
    protected static int     $navigationSort  = 1;
}
```

**Register group appearance:**

```php
use Larafusion\LarafusionManager;
use Larafusion\Navigation\NavigationGroup;

LarafusionManager::registerNavGroup('Content',
    NavigationGroup::make('Content')
        ->icon('file-text')
        ->collapsible()
        ->collapsed(false)
        ->sort(1)
);
```

### Badges

```php
class OrderResource extends Resource
{
    public static function getNavigationBadge(): string|int|null
    {
        return Order::where('status', 'pending')->count() ?: null;
    }
}
```

Returns a count badge on the sidebar item. Return `null` to hide it.

---

## Custom Pages

Create arbitrary non-CRUD admin pages not tied to any resource.

### 1. Create the Page class

```php
// app/Larafusion/Pages/ReportsPage.php
use Larafusion\Pages\Page;

class ReportsPage extends Page
{
    protected static string  $slug            = 'reports';
    protected static string  $title           = 'Reports';
    protected static string  $navigationIcon  = 'bar-chart';
    protected static ?string $navigationGroup = 'Analytics';
    protected static int     $navigationSort  = 10;

    public static function getView(): string
    {
        return 'Larafusion/Reports';   // → resources/js/Pages/Larafusion/Reports.tsx
    }

    public static function getViewData(): array
    {
        return ['totals' => \App\Models\Order::groupBy('date')->get()];
    }
}
```

### 2. Register it

```php
use Larafusion\LarafusionManager;

LarafusionManager::registerPages([\App\Larafusion\Pages\ReportsPage::class]);
```

### 3. Create the React component

```tsx
// resources/js/Pages/Larafusion/Reports.tsx
import AdminLayout from "../components/layout/AdminLayout";

export default function Reports({ totals }: { totals: any[] }) {
  return (
    <AdminLayout pageTitle="Reports">{/* your page content */}</AdminLayout>
  );
}
```

Accessible at `GET /admin/p/reports`. Appears in the sidebar automatically.

### Page Options

| Property            | Description                                |
| ------------------- | ------------------------------------------ |
| `$slug`             | URL slug — page lives at `/admin/p/{slug}` |
| `$title`            | Page title shown in topbar                 |
| `$navigationLabel`  | Sidebar label (defaults to `$title`)       |
| `$navigationIcon`   | Icon key                                   |
| `$navigationGroup`  | Group key for sidebar grouping             |
| `$navigationSort`   | Sort order                                 |
| `$showInNavigation` | `true` — set `false` to hide from sidebar  |
| `getView()`         | Inertia component name (required)          |
| `getViewData()`     | Props array passed to the component        |

---

## Modal Forms

Open create/edit forms in a sliding modal without navigating away from the index table.

```php
public static function useModalForms(): bool { return true; }
```

When enabled:

- The **New** button opens a create modal
- Each row's **edit** button opens an edit modal
- On submit, the modal closes and the table refreshes via a partial Inertia reload

---

