# Widgets

## Widgets

Widgets appear on the **Dashboard** (registered globally via the panel provider or `ArcaneManager`) or above a **resource index table** (returned by `widgets()` on the resource).

---

### Creating a Widget

Use the artisan generator to scaffold a new widget:

```bash
php artisan arcane:widget MyWidget              # blank/custom widget
php artisan arcane:widget StatsOverview --type=stats
php artisan arcane:widget RevenueChart --type=chart
php artisan arcane:widget RecentOrders --type=table
```

Generated files are placed in `app/Arcane/Widgets/`. Register them as shown in the [Registering Widgets](#registering-widgets) section.

---

### StatsOverviewWidget

Display a row of metric cards, each with a value, trend indicator, sparkline, and icon.

**Fluent API (inline):**

```php
use Arcane\Widgets\StatsOverviewWidget;
use Arcane\Widgets\Stat;

StatsOverviewWidget::make()
    ->heading('Dashboard Overview')
    ->description('Key metrics at a glance')
    ->pollingInterval('30s')   // auto-refresh every 30 s; null = disabled
    ->stats([
        Stat::make('Total Users', User::count())
            ->description('+12 this week')
            ->descriptionIcon('heroicon-m-arrow-trending-up')
            ->descriptionIconPosition('before')   // 'before' | 'after' (default)
            ->descriptionColor('success')          // semantic color for the description text
            ->icon('heroicon-m-users')
            ->color('primary')
            ->trend(12.5)                          // positive = green ▲, negative = red ▼
            ->chart([40, 55, 45, 70, 60, 90, 80]) // sparkline data points
            ->extraAttributes(['class' => 'border-l-4 border-violet-500']),

        Stat::make('Revenue', '$9,800')
            ->description('-2.1% from last month')
            ->descriptionColor('danger')
            ->color('success')
            ->trend(-2.1),

        Stat::make('Active Orders', 34)
            ->color('warning'),
    ])
```

**Class-based (recommended for complex widgets):**

```php
// app/Arcane/Widgets/DashboardStatsWidget.php
use Arcane\Widgets\StatsOverviewWidget;
use Arcane\Widgets\Stat;

class DashboardStatsWidget extends StatsOverviewWidget
{
    protected ?string $heading         = 'Dashboard Overview';
    protected ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        return [
            Stat::make('Users', User::count())
                ->color('primary')
                ->chart($this->lastSevenDays(User::class)),
        ];
    }

    public function getHeading(): ?string    { return $this->heading; }
    public function getDescription(): ?string { return 'Live counts'; }
}
```

#### Stat Options

| Method                              | Default    | Description                                                         |
| ----------------------------------- | ---------- | ------------------------------------------------------------------- |
| `->description('...')`              | `null`     | Text below the value                                                |
| `->descriptionIcon('heroicon-m-...')` | `null`   | Icon next to the description                                        |
| `->descriptionIconPosition('before')` | `'after'` | Position the icon before or after the description text             |
| `->descriptionColor('success')`     | `null`     | Semantic color for the description (`success`, `danger`, `warning`, `info`, `primary`) |
| `->icon('heroicon-m-...')`          | `null`     | Icon shown in the colored badge                                     |
| `->color('primary')`                | `'default'`| Card accent color (`default`, `primary`, `success`, `warning`, `danger`, `info`) |
| `->trend(12.5)`                     | `null`     | Percentage change; positive = green ▲, negative = red ▼, zero = —  |
| `->chart([40, 55, 70])`             | `[]`       | Array of numeric values for the sparkline chart                     |
| `->extraAttributes(['class' => '…'])` | `[]`     | HTML attributes merged onto the card wrapper                        |

---

### ChartWidget

Renders interactive charts as pure SVG — no external JavaScript dependencies.

**Supported chart types:** `line`, `bar`, `doughnut`, `pie`, `radar`, `polar-area`, `bubble`, `scatter`

**Fluent API (inline):**

```php
use Arcane\Widgets\ChartWidget;

ChartWidget::make()
    ->heading('Monthly Signups')
    ->description('New registrations per month')
    ->columnSpan(2)
    ->chartType('bar')     // line | bar | doughnut | pie | radar | polar-area | bubble | scatter
    ->color('primary')     // semantic color token used for single-dataset charts
    ->labels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    ->datasets([
        ['label' => 'Users',   'data' => [40, 80, 120, 95, 160, 200], 'color' => '#7c3aed'],
        ['label' => 'Revenue', 'data' => [20, 60,  90, 70, 130, 180], 'color' => '#10b981'],
    ])
    ->filters([
        'week'  => 'Last 7 days',
        'month' => 'Last 30 days',
        'year'  => 'This year',
    ])
    ->defaultFilter('month')
    ->deferFilters()       // show Apply button instead of updating on every change
    ->maxHeight('280px')   // CSS max-height for the chart area
    ->collapsible()        // add a collapse/expand toggle button
    ->collapsed()          // start collapsed
    ->pollingInterval(null) // null = no auto-refresh
```

**Bubble / Scatter datasets** use `{x, y, r?}` objects:

```php
->chartType('bubble')
->datasets([
    ['label' => 'Group A', 'data' => [['x' => 10, 'y' => 20, 'r' => 8], ['x' => 30, 'y' => 10, 'r' => 15]]],
])
```

**Class-based (with dynamic filter handling):**

```php
class PostsChartWidget extends ChartWidget
{
    protected ?string $heading       = 'Posts Over Time';
    protected string  $chartType     = 'bar';
    protected bool    $isCollapsible = true;

    public function getFilters(): array
    {
        return ['3months' => 'Last 3 months', '6months' => 'Last 6 months', '12months' => 'Last year'];
    }

    public function getData(): array
    {
        $months = match ($this->activeFilter) {
            '3months'  => 3,
            '12months' => 12,
            default    => 6,
        };
        // … build and return the data array
    }

    public function getType(): string { return 'chart'; }
}
```

#### ChartWidget Options

| Method / Property         | Default     | Description                                                    |
| ------------------------- | ----------- | -------------------------------------------------------------- |
| `->chartType('line')`     | `'line'`    | Chart type — see supported types above                         |
| `->color('primary')`      | `'primary'` | Semantic color token for single-dataset charts                 |
| `->labels([...])`         | `[]`        | X-axis labels (or radar axes)                                  |
| `->datasets([...])`       | `[]`        | Chart.js-compatible dataset array                              |
| `->filters([...])`        | `[]`        | Key-value pairs for the filter dropdown                        |
| `->defaultFilter('key')`  | `null`      | Pre-selected filter key                                        |
| `->deferFilters()`        | `false`     | Buffer filter changes until "Apply" is clicked                 |
| `->maxHeight('300px')`    | `null`      | CSS max-height for the chart container                         |
| `->options([...])`        | `[]`        | Chart.js options merged with defaults (class override: `getOptions()`) |
| `->collapsible()`         | `false`     | Show a collapse/expand toggle in the header                    |
| `->collapsed()`           | `false`     | Start in the collapsed state                                   |
| `->pollingInterval('5s')` | `null`      | Auto-refresh interval; `null` = disabled                       |
| `->lazy()`                | `false`     | Defer initial load until the widget is in the viewport         |

---

### TableWidget

Render a compact data table inside a widget card.

```php
use Arcane\Widgets\TableWidget;

TableWidget::make()
    ->heading('Recent Users')
    ->description('Last 5 registrations')
    ->columnSpan(1)
    ->columns(['Name', 'Email', 'Joined'])
    ->rows(fn () => User::latest()->take(5)->get()
        ->map(fn ($u) => [$u->name, $u->email, $u->created_at->diffForHumans()])
        ->toArray()
    )
    ->limit(5)
```

**Class-based:**

```php
class RecentPostsWidget extends TableWidget
{
    protected ?string $heading = 'Recent Posts';
    protected int     $limit   = 5;

    public function getData(): array
    {
        return [
            'columns' => ['Title', 'Status', 'Category', 'Created'],
            'rows'    => Post::latest()->take($this->limit)->get()
                ->map(fn ($p) => [$p->title, $p->status->getLabel(), $p->category?->name ?? '—', $p->created_at->diffForHumans()])
                ->toArray(),
        ];
    }

    public function getType(): string { return 'table'; }
}
```

---

### Registering Widgets

**Via the panel provider** (recommended):

```php
// app/Providers/Arcane/AdminPanelProvider.php
->widgets([
    DashboardStatsWidget::make()->sort(1),
    PostsChartWidget::make()->columnSpan(2)->sort(2),
    UserRolesChartWidget::make()->columnSpan(1)->sort(3),
    RecentPostsWidget::make()->sort(4),
])
```

**Via ArcaneManager** (from any service provider):

```php
use Arcane\ArcaneManager;

ArcaneManager::registerWidgets([
    StatsOverviewWidget::make()->stats([...]),
    ChartWidget::make()->heading('Signups')->chartType('bar')->labels([...])->datasets([...]),
]);
```

**Resource-level widgets** — shown above the index table:

```php
public static function widgets(): array
{
    return [
        StatsOverviewWidget::make()->stats([
            Stat::make('Total', static::getModelInstance()->count())->color('primary'),
        ]),
    ];
}
```

---

### Widget Base Options

All widgets inherit these options from the `Widget` base class:

| Method                       | Default  | Description                                                     |
| ---------------------------- | -------- | --------------------------------------------------------------- |
| `->heading('...')`           | `null`   | Widget title                                                    |
| `->description('...')`       | `null`   | Subtitle displayed below the heading                            |
| `->columnSpan(n)`            | `1`      | Grid width — integer `1`–`12`, or `'full'` for full-width      |
| `->sort(n)`                  | `0`      | Order within the widget grid (ascending)                        |
| `->pollingInterval('30s')`   | `'5s'`   | Auto-refresh interval; `null` = disabled                        |
| `->lazy()`                   | `false`  | Defer the widget's initial render until it enters the viewport  |
| `static::canView(): bool`    | `true`   | Override to hide a widget based on permissions                  |

**Column span values:**

| Value    | Behaviour                                    |
| -------- | -------------------------------------------- |
| `1`      | One column (default)                         |
| `2`      | Two columns on md+ screens                   |
| `3`      | Three columns on lg+ screens (full row)      |
| `'full'` | Always spans the entire grid width           |

---

