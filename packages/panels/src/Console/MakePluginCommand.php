<?php

namespace Arcane\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakePluginCommand extends Command
{
    protected $signature   = 'arcane:plugin {name : The plugin name e.g. Analytics}';
    protected $description = 'Create a new Arcane plugin class';

    public function handle(): int
    {
        $name = Str::studly($this->argument('name'));
        $dir  = app_path('Arcane/Plugins');
        $path = "{$dir}/{$name}Plugin.php";

        File::ensureDirectoryExists($dir);

        if (File::exists($path)) {
            $this->error("Plugin already exists: {$path}");
            return self::FAILURE;
        }

        File::put($path, $this->buildStub($name));

        $this->info("✅ Plugin created: <comment>app/Arcane/Plugins/{$name}Plugin.php</comment>");
        $this->newLine();
        $this->line("Next steps:");
        $this->line("  1. Add <comment>App\\Arcane\\Plugins\\{$name}Plugin::class</comment> to <comment>config/arcane.php</comment> plugins array");
        $this->line("  2. Implement <comment>navigationItems()</comment>, <comment>hooks()</comment>, <comment>components()</comment> as needed");

        return self::SUCCESS;
    }

    protected function buildStub(string $name): string
    {
        $id    = Str::slug($name);
        $label = Str::headline($name);

        return <<<PHP
<?php

namespace App\Arcane\Plugins;

use Arcane\Plugins\ArcanePlugin;

class {$name}Plugin extends ArcanePlugin
{
    public static function id(): string          { return '{$id}'; }
    public static function name(): string        { return '{$label}'; }
    public static function version(): string     { return '1.0.0'; }
    public static function description(): string { return ''; }

    /**
     * Called once when the plugin boots.
     * Register services, observers, bindings here.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Navigation items injected into the Arcane sidebar.
     * Return an empty array to add no items.
     */
    public function navigationItems(): array
    {
        return [
            // [
            //     'label' => '{$label}',
            //     'icon'  => 'circle',
            //     'slug'  => '{$id}',
            //     'url'   => '/admin/{$id}',
            //     'badge' => null,
            // ],
        ];
    }

    /**
     * Lifecycle hooks. Available events:
     *   record.creating  record.created
     *   record.updating  record.updated
     *   record.deleting  record.deleted
     *   page.rendering   navigation.built
     */
    public function hooks(): array
    {
        return [
            // 'record.created' => function (\$record) {
            //     // runs after any record is created
            // },
        ];
    }

    /**
     * React components this plugin contributes to named slots.
     * Key = slot name, Value = JS import path from your plugin bundle.
     *
     * Built-in slots: sidebar.nav, topbar.actions, page.top,
     *                 page.bottom, dashboard.widget
     */
    public function components(): array
    {
        return [
            // 'dashboard.widget' => '@{$id}/Widget',
            // 'topbar.actions'   => '@{$id}/TopbarBadge',
        ];
    }

    /**
     * Asset URLs (JS/CSS) injected into every admin page.
     */
    public function assets(): array
    {
        return [
            // '/vendor/{$id}/plugin.js',
            // '/vendor/{$id}/plugin.css',
        ];
    }
}
PHP;
    }
}
