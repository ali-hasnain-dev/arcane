# Widgets

## Overview

Widgets are dashboard components that appear above the index table on resource pages or on the main dashboard. Larafusion provides three built-in widget types:

- **StatsOverviewWidget** — a row of stat cards (count, revenue, percentage, trend)
- **ChartWidget** — a Chart.js-powered line, bar, doughnut, pie, radar, or scatter chart
- **TableWidget** — a read-only mini table showing recent or related records

All widgets extend `Larafusion\Widgets\Widget` and are registered on a resource via `widgets()` or globally via the `PanelProvider`.

---

## Why This Feature Exists

Dashboard and resource overview data (totals, trends, charts) is fundamentally different from tabular CRUD data — it is expensive to compute, rarely changes on every request, and should not block the primary table from rendering. Larafusion models this by deferring widget data: the index page renders the table immediately, then the deferred widget props load in a second Inertia request.

---

## Core Concepts

### Widget Base Class

`Larafusion\Widgets\Widget` defines the shared API:

```
columnSpan    — number of grid columns (1–12, or 'full')
heading       — optional title
description   — optional subtitle
sort          — sort order in the grid
pollingInterval — auto-refresh interval (e.g. '5s', '30s', null = disabled)
isLazy        — defer the initial render until in-viewport
```

Every widget implements `getType(): string` (used by React to select the renderer) and `getData(): array` (the type-specific payload).

### Deferred Loading

When a resource's `widgets()` returns a non-empty array, the `ResourceController` wraps them in `Inertia::defer()`:

```php
'widgets' => !empty($widgetData)
    ? Inertia::defer(fn () => array_map(fn($w) => $w->toArray(), $widgetData))
    : [],
```

The table loads immediately. React renders a skeleton or blank space where widgets will appear, then fires a second request to fetch the deferred `widgets` prop. For resources with no widgets, `[]` is sent immediately — no extra request.

### Polling

`->pollingInterval('5s')` makes the React widget component call `router.reload({ only: ['widgets'] })` every 5 seconds, keeping the numbers live without a full page refresh. Set to `null` to disable.

---

## Widget Registration

### On a Resource (Per-Table Widgets)

```php
class OrderResource extends Resource
{
    public static function widgets(): array
    {
        return [
            StatsOverviewWidget::make()->stats([
                Stat::make('Total Orders', Order::count()),
                Stat::make('Revenue', '$' . number_format(Order::sum('total'), 2)),
                Stat::make('Pending', Order::where('status', 'pending')->count()),
            ]),
        ];
    }
}
```

### On the Panel (Global Dashboard Widgets)

```php
// AdminPanelProvider.php
public function panel(Panel $panel): Panel
{
    return $panel
        ->widgets([
            App\Widgets\SalesChartWidget::class,
            App\Widgets\RecentOrdersWidget::class,
        ]);
}
```

---

## StatsOverviewWidget

`Larafusion\Widgets\StatsOverviewWidget`

Renders a row of stat cards. Always takes `columnSpan = 'full'`.

### Usage

```php
use Larafusion\Widgets\StatsOverviewWidget;
use Larafusion\Widgets\Stat;

StatsOverviewWidget::make()
    ->heading('Overview')
    ->stats([
        Stat::make('Total Users', User::count())
            ->description('+12% from last month')
            ->descriptionIcon('trending-up')
            ->descriptionColor('success')
            ->icon('users')
            ->color('primary')
            ->trend(12.4)           // positive = up arrow, negative = down arrow
            ->chart([40, 55, 60, 70, 65, 80, 95]),  // sparkline data
        Stat::make('Active Sessions', cache('active_sessions', 0))
            ->icon('activity')
            ->color('success'),
        Stat::make('Failed Logins', cache('failed_logins_today', 0))
            ->icon('shield-off')
            ->color('danger')
            ->description('Last 24 hours'),
    ])
    ->pollingInterval('10s')
```

### Subclass Pattern

For dynamic stats, extend the widget:

```php
class OrderStatsWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Orders Today', Order::whereDate('created_at', today())->count()),
            Stat::make('Revenue Today', '$' . number_format(
                Order::whereDate('created_at', today())->sum('total'), 2
            )),
            Stat::make('Average Order', '$' . number_format(
                Order::whereDate('created_at', today())->avg('total') ?? 0, 2
            )),
        ];
    }
}
```

Then register: `public static function widgets(): array { return [OrderStatsWidget::make()]; }`

### Stat Configuration

| Method | Description |
|---|---|
| `make(string $label, string|int|float $value)` | Factory; label and value are required |
| `description(string)` | Secondary text below the value |
| `descriptionIcon(string)` | Lucide icon beside the description |
| `descriptionIconPosition(string)` | `'before'` or `'after'` (default) |
| `descriptionColor(string)` | Color token for the description text |
| `icon(string)` | Lucide icon in the stat card corner |
| `color(string)` | Card accent color: `default` \| `primary` \| `success` \| `warning` \| `danger` \| `info` |
| `trend(float)` | Positive = up arrow, negative = down arrow |
| `chart(array)` | Array of numbers for the sparkline chart |
| `extraAttributes(array)` | Additional HTML attributes on the card |

---

## ChartWidget

`Larafusion\Widgets\ChartWidget`

Renders a Chart.js chart. Default `columnSpan = 2`.

### Supported Chart Types

`'line'` | `'bar'` | `'doughnut'` | `'pie'` | `'radar'` | `'polar-area'` | `'bubble'` | `'scatter'`

### Basic Line Chart

```php
use Larafusion\Widgets\ChartWidget;

ChartWidget::make()
    ->heading('Monthly Revenue')
    ->chartType('line')
    ->color('primary')
    ->labels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    ->datasets([
        ['label' => '2024', 'data' => [1200, 1800, 1400, 2100, 1900, 2400]],
        ['label' => '2023', 'data' => [900, 1100, 1000, 1500, 1300, 1800], 'color' => '#94a3b8'],
    ])
    ->maxHeight('300px')
    ->pollingInterval('60s')
```

### Chart with Filters

```php
ChartWidget::make()
    ->heading('Sales by Period')
    ->filters([
        'today'  => 'Today',
        'week'   => 'This Week',
        'month'  => 'This Month',
        'year'   => 'This Year',
    ])
    ->defaultFilter('month')
    ->labels(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    ->datasets([['label' => 'Sales', 'data' => [100, 200, 150, 300, 250, 400, 350]]])
```

### Dynamic Subclass

```php
class RevenueChart extends ChartWidget
{
    protected string $chartType = 'bar';
    protected string $color     = 'primary';

    public function getFilters(): array
    {
        return ['7d' => 'Last 7 days', '30d' => 'Last 30 days', '90d' => 'Last 90 days'];
    }

    public function getData(): array
    {
        $days = match ($this->activeFilter ?? '30d') {
            '7d'  => 7,
            '90d' => 90,
            default => 30,
        };

        $data = Order::selectRaw('DATE(created_at) as date, SUM(total) as revenue')
            ->whereBetween('created_at', [now()->subDays($days), now()])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'chartType' => $this->chartType,
            'color'     => $this->color,
            'labels'    => $data->pluck('date')->toArray(),
            'datasets'  => [['label' => 'Revenue', 'data' => $data->pluck('revenue')->toArray()]],
            'filterOptions'      => $this->getFilters(),
            'activeFilter'       => $this->activeFilter,
            'hasDeferredFilters' => false,
            'maxHeight'          => '300px',
            'options'            => [],
            'isCollapsible'      => false,
            'isCollapsed'        => false,
        ];
    }
}
```

### ChartWidget Configuration

| Method | Description |
|---|---|
| `chartType(string)` | Chart.js chart type |
| `labels(array)` | X-axis labels |
| `datasets(array)` | Dataset objects `{ label, data, color? }` |
| `color(string)` | Default dataset color token |
| `filters(array)` | `['key' => 'Label']` filter dropdown options |
| `defaultFilter(string)` | Pre-selected filter key |
| `deferFilters()` | Buffer filter changes until Apply clicked |
| `maxHeight(string)` | CSS max-height for the chart canvas |
| `options(array)` | Raw Chart.js options merged with defaults |
| `collapsible()` | Show collapse/expand toggle |
| `collapsed()` | Start collapsed |

---

## TableWidget

`Larafusion\Widgets\TableWidget`

Renders a read-only mini table of related or recent records.

```php
use Larafusion\Widgets\TableWidget;

TableWidget::make()
    ->heading('Recent Orders')
    ->columnSpan(2)
    ->columns([
        ['key' => 'order_number', 'label' => 'Order #'],
        ['key' => 'customer.name', 'label' => 'Customer'],
        ['key' => 'total', 'label' => 'Total'],
        ['key' => 'status', 'label' => 'Status'],
    ])
    ->records(
        Order::with('customer')
            ->latest()
            ->limit(5)
            ->get()
            ->toArray()
    )
```

---

## Shared Widget Configuration

| Method | Description |
|---|---|
| `make()` | Factory |
| `heading(string)` | Card title |
| `description(string)` | Card subtitle |
| `columnSpan(int|string)` | Grid columns to occupy (1–12 or `'full'`) |
| `sort(int)` | Sort order in the widget grid |
| `pollingInterval(?string)` | Auto-refresh interval; `null` = disabled |
| `lazy()` | Defer rendering until the widget scrolls into view |

### Authorization

Override the static `canView()` method to gate a widget:

```php
class AdminStatsWidget extends StatsOverviewWidget
{
    public static function canView(): bool
    {
        return auth()->user()->is_admin;
    }
}
```

---

## Real World Examples

### SaaS Dashboard

```php
// resources/widgets
class MrrWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $mrr = Subscription::active()->sum('monthly_price');
        $arr = $mrr * 12;
        $growth = $this->calculateMonthlyGrowth();

        return [
            Stat::make('MRR', '$' . number_format($mrr, 2))
                ->trend($growth)
                ->chart(Subscription::last30DaysMrr()),
            Stat::make('ARR', '$' . number_format($arr, 2))
                ->icon('trending-up')
                ->color('success'),
            Stat::make('Active Subscriptions', Subscription::active()->count())
                ->icon('users')
                ->chart(Subscription::last30DaysCount()),
            Stat::make('Churn Rate', $this->calculateChurnRate() . '%')
                ->icon('trending-down')
                ->color('danger'),
        ];
    }
}
```

### E-Commerce Resource Widgets

```php
class OrderResource extends Resource
{
    public static function widgets(): array
    {
        return [
            // Row 1: stats bar
            StatsOverviewWidget::make()->stats([
                Stat::make('Today', Order::today()->count()),
                Stat::make("Today's Revenue", '$' . number_format(Order::today()->sum('total'), 2)),
                Stat::make('Pending', Order::where('status', 'pending')->count())->color('warning'),
                Stat::make('Avg. Order', '$' . number_format(Order::avg('total') ?? 0, 2)),
            ]),

            // Row 2: chart
            WeeklyRevenueChart::make()->columnSpan(2),

            // Row 2: recent
            TableWidget::make()
                ->heading('Latest Orders')
                ->columns([
                    ['key' => 'id', 'label' => '#'],
                    ['key' => 'customer_name', 'label' => 'Customer'],
                    ['key' => 'total', 'label' => 'Total'],
                    ['key' => 'status', 'label' => 'Status'],
                ])
                ->records(Order::latest()->limit(5)->get()->toArray()),
        ];
    }
}
```

---

## Best Practices

- **Always extract widget logic into a dedicated class** that extends the widget base. Keep `widgets()` in the resource as just a list of instantiated objects.
- **Use `->pollingInterval('30s')` or higher.** Every poll fires an Inertia partial reload. Intervals under 10 seconds create constant HTTP traffic.
- **Cache expensive stat queries** in `getStats()` / `getData()`:
  ```php
  Stat::make('Total Orders', cache()->remember('total_orders', 60, fn() => Order::count()))
  ```
- **`columnSpan('full')`** for stats bars, `columnSpan(2)` for charts in a 3-column grid, `columnSpan(1)` for narrow supplementary widgets.
- **Override `canView()`** to hide sensitive financial widgets from non-admin users.

---

## Common Mistakes

**Querying the database in `toArray()` on every request instead of in `getData()`.** The widget's `toArray()` method calls `getData()`, which is the intended override point. Do not add DB queries in the base `toArray()` of a subclass.

**Registering widgets on the Panel and on a resource simultaneously.** Panel-level widgets appear only on the `/admin` dashboard. Resource-level widgets appear above the resource's index table. They do not share context.

**Expecting deferred widgets to poll.** Polling calls `router.reload({ only: ['widgets'] })`. This works correctly for both fresh and deferred widget props as of Inertia v3.

---

## Related Features

- [Resources](resources.md) — `widgets()` method
- [Panel Configuration](panel-configuration.md) — panel-level widget registration
- [Themes](themes.md) — `--larafusion-primary` CSS variable used for chart color tokens
