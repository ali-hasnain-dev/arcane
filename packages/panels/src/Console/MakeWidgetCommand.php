<?php

namespace Arcane\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakeWidgetCommand extends Command
{
    protected $signature = 'arcane:widget
        {name : Widget class name e.g. StatsOverview, RevenueChart}
        {--type=custom : Widget template — custom|stats|chart|table}';

    protected $description = 'Create a new Arcane widget';

    public function handle(): int
    {
        $name = Str::studly($this->argument('name'));
        $type = $this->option('type');

        if (!in_array($type, ['custom', 'stats', 'chart', 'table'])) {
            $this->error("Invalid type [{$type}]. Choose from: custom, stats, chart, table.");
            return self::FAILURE;
        }

        $dir  = app_path('Arcane/Widgets');
        $path = "{$dir}/{$name}.php";

        if (File::exists($path)) {
            $this->error("Widget already exists: {$path}");
            return self::FAILURE;
        }

        File::ensureDirectoryExists($dir);
        File::put($path, $this->stub($name, $type));

        $this->newLine();
        $this->info("✅ Widget created: <comment>app/Arcane/Widgets/{$name}.php</comment>");
        $this->line('   Register it in your panel provider or service provider:');
        $this->line("   <comment>ArcaneManager::registerWidgets([{$name}::make()]);</comment>");
        $this->newLine();

        return self::SUCCESS;
    }

    protected function stub(string $name, string $type): string
    {
        $ns = 'App\\Arcane\\Widgets';

        return match ($type) {
            'stats' => $this->statsStub($name, $ns),
            'chart' => $this->chartStub($name, $ns),
            'table' => $this->tableStub($name, $ns),
            default => $this->customStub($name, $ns),
        };
    }

    protected function statsStub(string $name, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns};

use Arcane\Widgets\Stat;
use Arcane\Widgets\StatsOverviewWidget;

class {$name} extends StatsOverviewWidget
{
    protected ?string \$heading         = '{$name}';
    protected ?string \$pollingInterval = '30s';

    protected function getStats(): array
    {
        return [
            Stat::make('Total', 0)
                ->description('All time')
                ->color('primary')
                ->icon('heroicon-m-chart-bar'),

            Stat::make('This Month', 0)
                ->description('+0% from last month')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->descriptionColor('success')
                ->color('success')
                ->trend(0.0),

            Stat::make('Pending', 0)
                ->color('warning'),
        ];
    }
}
PHP;
    }

    protected function chartStub(string $name, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns};

use Arcane\Widgets\ChartWidget;

class {$name} extends ChartWidget
{
    protected ?string \$heading         = '{$name}';
    protected string  \$chartType       = 'line';   // line|bar|doughnut|pie|radar|polar-area|bubble|scatter
    protected ?string \$pollingInterval = null;      // null = no auto-refresh

    /** Return filter options for the dropdown (optional). */
    public function getFilters(): array
    {
        return [
            'week'  => 'Last 7 days',
            'month' => 'Last 30 days',
            'year'  => 'This year',
        ];
    }

    public function getData(): array
    {
        return [
            'chartType' => \$this->chartType,
            'color'     => \$this->color,
            'labels'    => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'datasets'  => [
                ['label' => 'Value', 'data' => [40, 80, 55, 95, 70, 120, 100]],
            ],
            'filterOptions'      => \$this->getFilters(),
            'activeFilter'       => \$this->activeFilter,
            'hasDeferredFilters' => \$this->hasDeferredFilters,
            'maxHeight'          => \$this->maxHeight,
            'options'            => \$this->getOptions(),
            'isCollapsible'      => \$this->isCollapsible,
            'isCollapsed'        => \$this->isCollapsed,
        ];
    }

    public function getType(): string { return 'chart'; }
}
PHP;
    }

    protected function tableStub(string $name, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns};

use Arcane\Widgets\TableWidget;

class {$name} extends TableWidget
{
    protected ?string \$heading = '{$name}';
    protected int     \$limit   = 5;

    public function __construct()
    {
        parent::__construct();
        \$this->columnSpan = 2;
    }

    public function getData(): array
    {
        \$columns = ['Name', 'Value', 'Date'];
        \$rows    = [
            // TODO: replace with real data
            // ['Example', '100', now()->toDateString()],
        ];

        return [
            'columns' => \$columns,
            'rows'    => array_slice(\$rows, 0, \$this->limit),
        ];
    }

    public function getType(): string { return 'table'; }
}
PHP;
    }

    protected function customStub(string $name, string $ns): string
    {
        return <<<PHP
<?php

namespace {$ns};

use Arcane\Widgets\Widget;

class {$name} extends Widget
{
    protected ?string \$heading      = '{$name}';
    protected int     \$columnSpan   = 1;

    public function getType(): string { return 'custom'; }

    public function getData(): array
    {
        return [
            // Return data for your custom React component
        ];
    }

    public static function canView(): bool
    {
        return true; // add permission logic here if needed
    }
}
PHP;
    }
}
