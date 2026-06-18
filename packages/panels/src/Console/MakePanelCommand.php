<?php

namespace Arcane\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakePanelCommand extends Command
{
    protected $signature   = 'arcane:panel {name? : Panel name, e.g. admin, cpanel, my-app}';
    protected $description = 'Create a new Arcane panel provider';

    public function handle(): int
    {
        $rawName = $this->argument('name')
            ?? $this->ask('Panel name (e.g. admin, cpanel, my-app)');

        if (empty($rawName)) {
            $this->error('Panel name cannot be empty.');
            return self::FAILURE;
        }

        // Normalise: "my-app" → "MyApp", "cpanel" → "Cpanel"
        $studly    = Str::studly($rawName);
        $className = "{$studly}Provider";
        $panelPath = Str::slug($rawName);   // keep original slug as URL prefix
        $namespace = 'App\\Providers\\Arcane';
        $dir       = app_path('Providers/Arcane');
        $filePath  = "{$dir}/{$className}.php";

        File::ensureDirectoryExists($dir);

        if (File::exists($filePath)) {
            $this->error("Provider already exists: app/Providers/Arcane/{$className}.php");
            return self::FAILURE;
        }

        $appName = config('app.name', 'My App');

        $stub = <<<PHP
<?php

namespace {$namespace};

use Arcane\Panel;
use Arcane\PanelProvider;

class {$className} extends PanelProvider
{
    public function panel(Panel \$panel): Panel
    {
        return \$panel
            ->id('{$panelPath}')
            ->path('{$panelPath}')
            ->login()
            ->brand('{$appName}')
            ->theme('neutral')
            ->defaultThemeMode('light');
    }
}
PHP;

        File::put($filePath, $stub);

        $this->info("✅ Panel provider created: <comment>app/Providers/Arcane/{$className}.php</comment>");
        $this->newLine();
        $this->line("Register it in <comment>bootstrap/providers.php</comment>:");
        $this->line("  <comment>{$namespace}\\{$className}::class</comment>");
        $this->newLine();
        $this->line("Your panel will be available at: <comment>/{$panelPath}</comment>");

        // Auto-patch bootstrap/providers.php
        $this->registerProvider($namespace, $className);

        return self::SUCCESS;
    }

    protected function registerProvider(string $namespace, string $className): void
    {
        $providersPath = base_path('bootstrap/providers.php');

        if (!File::exists($providersPath)) {
            $this->warn('  ⚠️  bootstrap/providers.php not found — register the provider manually.');
            return;
        }

        $fqcn    = "{$namespace}\\{$className}";
        $content = File::get($providersPath);

        if (str_contains($content, $fqcn)) {
            $this->line('  ✅ Provider already registered in bootstrap/providers.php');
            return;
        }

        // Insert before the closing bracket of the return array
        $content = preg_replace(
            '/(\];?\s*)$/',
            "    {$fqcn}::class,\n$1",
            $content
        );

        File::put($providersPath, $content);
        $this->line('  ✅ Provider registered in <comment>bootstrap/providers.php</comment>');
    }
}
