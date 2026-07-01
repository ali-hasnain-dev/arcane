<?php

namespace Larafusion\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

use function Laravel\Prompts\text;

class InstallCommand extends Command
{
    protected $signature   = 'larafusion:install';
    protected $description = 'Install Larafusion admin panel into your Laravel application';

    public function handle(): int
    {
        $this->info('Installing Larafusion...');
        $this->newLine();

        // Ask for the panel name up-front so all derived values are consistent.
        $panelName = text(
            label: 'What should the panel be named?',
            default: 'admin',
            required: true,
            hint: 'Used as the URL path and panel ID (e.g. "admin" → /admin).',
        );

        $panelId    = Str::slug($panelName);
        $panelClass = Str::studly($panelName) . 'PanelProvider';

        $this->newLine();

        // 1. Create the PanelProvider in the user's app
        $this->createPanelProvider($panelId, $panelClass);

        // 2. Create resources/views/app.blade.php (Inertia root template)
        $this->createAppBlade();

        // 3. Patch vite.config — add React plugin (no @inertiajs/vite — we use manual resolver)
        $this->patchViteConfig();

        // 4. Patch app.tsx entry — vendor-based glob resolver (pages stay in package)
        $this->patchAppEntry();

        // 5. Patch bootstrap/app.php — register Inertia middleware + redirect guests to larafusion.login
        $this->patchBootstrapApp();

        // 6. Patch .env — enable Inertia v3 script-element page data format
        $this->patchEnv();

        // 7. Patch app.css — add @custom-variant dark for Tailwind v4 dark mode
        $this->patchAppCss();

        // 8. Install required npm packages
        $this->installNpmPackages();

        // Resources/Pages/Plugins/Widgets folders are intentionally not scaffolded here —
        // `larafusion:resource`, `larafusion:page`, `larafusion:plugin`, and `larafusion:widget`
        // each create their own directory (and app/Larafusion/*) on demand when actually used.

        $this->newLine();
        $this->info('Larafusion installed successfully!');
        $this->newLine();
        $this->table(
            ['Step', 'Action'],
            [
                ['Build assets',      '<comment>npm run build</comment>'],
                ['Visit admin panel', '<comment>http://your-app.test/' . $panelId . '</comment>'],
                ['Create a resource', '<comment>php artisan larafusion:resource User</comment>'],
                ['Create a plugin',   '<comment>php artisan larafusion:plugin Analytics</comment>'],
                ['Switch theme',      "<comment>->theme('emerald') in your {$panelClass}</comment>"],
            ]
        );

        return self::SUCCESS;
    }

    protected function createPanelProvider(string $panelId, string $panelClass): void
    {
        $dir  = app_path('Providers/Larafusion');
        $path = "{$dir}/{$panelClass}.php";
        $fqn  = "App\\Providers\\Larafusion\\{$panelClass}";

        File::ensureDirectoryExists($dir);

        if (File::exists($path)) {
            $this->line("  ✅ PanelProvider already exists → <comment>app/Providers/Larafusion/{$panelClass}.php</comment>");
            return;
        }

        $appName = config('app.name', 'My App');

        $stub = <<<PHP
<?php

namespace App\Providers\Larafusion;

use Larafusion\Panel;
use Larafusion\PanelProvider;

class {$panelClass} extends PanelProvider
{
    public function panel(Panel \$panel): Panel
    {
        return \$panel
            ->id('{$panelId}')
            ->path('{$panelId}')
            ->login()
            ->brand('{$appName}')
            ->theme('neutral')
            ->defaultThemeMode('light');
        // Font defaults to Inter — override with ->font('DM Sans') if desired.
        // Resources in app/Larafusion/ are auto-discovered — no need to list them here.
    }
}
PHP;

        File::put($path, $stub);
        $this->line("  ✅ PanelProvider created → <comment>app/Providers/Larafusion/{$panelClass}.php</comment>");

        // Auto-register in bootstrap/providers.php (Laravel 11+)
        $bootstrapPath = base_path('bootstrap/providers.php');
        if (File::exists($bootstrapPath)) {
            ServiceProvider::addProviderToBootstrapFile($fqn, $bootstrapPath);
            $this->line("  ✅ Provider registered → <comment>bootstrap/providers.php</comment>");
        }
    }

    protected function createAppBlade(): void
    {
        $path = resource_path('views/app.blade.php');

        if (File::exists($path)) {
            $this->line('  ✅ app.blade.php already exists');
            return;
        }

        $blade = <<<'BLADE'
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
BLADE;

        File::put($path, $blade);
        $this->line('  ✅ app.blade.php created → <comment>resources/views/app.blade.php</comment>');
    }

    protected function createCoreBarrel(): void
    {
        $path = resource_path('js/core.ts');

        if (File::exists($path)) {
            $this->line('  ✅ core.ts barrel already exists');
            return;
        }

        // Ensure the directory exists (components are published before this runs)
        File::ensureDirectoryExists(resource_path('js'));

        $barrel = <<<'TS'
export { FieldRenderer } from './components/fields';
export type { LarafusionField, FormValues, FormErrors } from './types';
TS;

        File::put($path, $barrel);
        $this->line('  ✅ core.ts barrel created → <comment>resources/js/core.ts</comment>');
    }

    protected function patchViteConfig(): void
    {
        $viteConfigPath = base_path('vite.config.ts');
        if (!File::exists($viteConfigPath)) {
            $viteConfigPath = base_path('vite.config.js');
        }

        if (!File::exists($viteConfigPath)) {
            $this->line('  ⚠️  <comment>vite.config</comment> not found — skipping Vite patch');
            return;
        }

        $content = File::get($viteConfigPath);

        // Already configured — skip
        if (str_contains($content, 'larafusion-cross-package-resolve')) {
            $this->line('  ✅ vite.config already configured');
            return;
        }

        $stub = <<<'JS'
import { defineConfig } from 'vite';
import { existsSync } from 'fs';
import path from 'path';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Use symlink paths (not realpathSync) so bare-module imports resolve from project node_modules.
const vendor = path.resolve(__dirname, 'vendor/larafusion');
const panelsJs  = path.join(vendor, 'panels/resources/js');
const formsJs   = path.join(vendor, 'forms/resources/js');
const tablesJs  = path.join(vendor, 'tables/resources/js');
const supportJs = path.join(vendor, 'support/resources/js');
const widgetsJs = path.join(vendor, 'widgets/resources/js');

const allVendorPackages = [panelsJs, formsJs, tablesJs, supportJs, widgetsJs];

const crossPackageMap = [
    [panelsJs, 'components/form',    path.join(formsJs,   'components/form')],
    [panelsJs, 'components/fields',  path.join(formsJs,   'components/fields')],
    [panelsJs, 'components/ui',      path.join(supportJs, 'components')],
    [panelsJs, 'components/table',   path.join(tablesJs,  'components')],
    [panelsJs, 'components/widgets', path.join(widgetsJs, 'components')],
    [panelsJs, 'types',              path.join(supportJs, 'types')],
    [panelsJs, 'lib',                path.join(supportJs, 'lib')],
    [tablesJs, 'ui',                 path.join(supportJs, 'components')],
    [widgetsJs, 'types',             path.join(supportJs, 'types')],
    [widgetsJs, 'lib',               path.join(supportJs, 'lib')],
];

function resolveFile(base) {
    if (existsSync(base)) return base;
    for (const ext of ['.tsx', '.ts', '.js', '/index.tsx', '/index.ts', '/index.js']) {
        if (existsSync(base + ext)) return base + ext;
    }
    return null;
}

// Vendor source also uses bare `@larafusion/x` imports directly (not just
// relative cross-package imports), e.g. panels' components/ui/Card.tsx does
// `import { Card } from '@larafusion/support'`. These aren't real npm
// packages — resolve them straight to each vendor package's entry file.
const bareVendorMap = {
    '@larafusion/support': supportJs,
    '@larafusion/forms':   formsJs,
    '@larafusion/tables':  tablesJs,
    '@larafusion/widgets': widgetsJs,
};

const larafusionResolve = {
    name: 'larafusion-cross-package-resolve',
    resolveId(id, importer) {
        if (Object.prototype.hasOwnProperty.call(bareVendorMap, id)) {
            return resolveFile(bareVendorMap[id]);
        }

        if (!importer) return null;
        if (!id.startsWith('.')) return null;
        if (!allVendorPackages.some(pkg => importer.startsWith(pkg))) return null;

        const abs = path.resolve(path.dirname(importer), id);

        for (const [pkgBase, subPath, target] of crossPackageMap) {
            if (!importer.startsWith(pkgBase)) continue;
            const from = path.join(pkgBase, subPath);
            if (abs === from || abs.startsWith(from + '/') || abs.startsWith(from + path.sep)) {
                return resolveFile(abs.replace(from, target));
            }
        }

        return resolveFile(abs);
    },
};

export default defineConfig({
    plugins: [
        larafusionResolve,
        react(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        tailwindcss(),
    ],

    resolve: {
        // Keep symlink paths so bare-module imports (react, lucide-react, etc.)
        // resolve via node_modules in the project root, not via real vendor paths.
        preserveSymlinks: true,
    },

    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
JS;

        File::put($viteConfigPath, $stub);
        $this->line('  ✅ <comment>vite.config</comment> replaced — larafusionResolve plugin + preserveSymlinks added');
    }

    protected function patchAppEntry(): void
    {
        $tsxPath = resource_path('js/app.tsx');

        if (File::exists($tsxPath) && str_contains(File::get($tsxPath), 'vendorPages')) {
            $this->line('  ✅ App entry already configured');
            return;
        }

        // Pages stay in the vendor package — no publishing needed.
        // User pages in resources/js/Pages/ override vendor pages when both exist.
        $stub = <<<'TSX'
/// <reference types="vite/client" />
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

// User pages override vendor pages — create resources/js/Pages/Larafusion/Foo.tsx to customise any built-in page.
const userPages   = import.meta.glob('./Pages/**/*.tsx', { eager: false });
const vendorPages = import.meta.glob([
    '../../vendor/larafusion/panels/resources/js/pages/**/*.tsx',
    '../../vendor/larafusion/forms/resources/js/pages/**/*.tsx',
    '../../vendor/larafusion/widgets/resources/js/pages/**/*.tsx',
], { eager: false });

createInertiaApp({
    title: title => title || 'Admin',

    progress: { color: '#7c3aed', showSpinner: false },

    async resolve(name) {
        const userKey   = `./Pages/${name}.tsx`;
        const vendorKey = `../../vendor/larafusion/panels/resources/js/pages/${name}.tsx`;

        const loader = userPages[userKey] ?? vendorPages[vendorKey];

        if (!loader) {
            throw new Error(`[Larafusion] Page not found: "${name}". Create resources/js/Pages/${name}.tsx to add a custom page.`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await loader() as any).default;
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
TSX;

        File::put($tsxPath, $stub);
        $this->line('  ✅ App entry created → <comment>resources/js/app.tsx</comment> (vendor-based resolver)');
    }

    protected function patchBootstrapApp(): void
    {
        $path = base_path('bootstrap/app.php');

        if (!File::exists($path)) {
            $this->line('  ⚠️  <comment>bootstrap/app.php</comment> not found — skipping');
            return;
        }

        $content = File::get($path);

        $needsInertiaMiddleware = !str_contains($content, 'Inertia\\Middleware');
        $needsGuestRedirect     = !str_contains($content, 'redirectGuestsTo');

        if (!$needsInertiaMiddleware && !$needsGuestRedirect) {
            $this->line('  ✅ bootstrap/app.php already patched');
            return;
        }

        // Build the lines to inject into the withMiddleware callback body.
        $inject = '';
        if ($needsInertiaMiddleware) {
            $inject .= "\n" . '        $middleware->web(append: [\\Inertia\\Middleware::class]);';
        }
        if ($needsGuestRedirect) {
            $inject .= "\n" . '        $middleware->redirectGuestsTo(fn () => route(\'larafusion.login\'));';
        }

        $content = preg_replace(
            '/->withMiddleware\(function\s*\(Middleware\s+\$middleware\)\s*:\s*void\s*\{([^}]*)\}/',
            '->withMiddleware(function (Middleware $middleware): void {$1' . $inject . "\n" . '    }',
            $content
        );

        File::put($path, $content);

        $messages = [];
        if ($needsInertiaMiddleware) $messages[] = '<comment>\\Inertia\\Middleware</comment>';
        if ($needsGuestRedirect)     $messages[] = '<comment>redirectGuestsTo larafusion.login</comment>';
        $this->line('  ✅ bootstrap/app.php patched → ' . implode(' + ', $messages));
    }

    protected function patchEnv(): void
    {
        $envPath = base_path('.env');

        if (!File::exists($envPath)) {
            $this->line('  ⚠️  .env not found — skipping env patch');
            return;
        }

        $content = File::get($envPath);

        if (str_contains($content, 'INERTIA_USE_SCRIPT_ELEMENT_FOR_INITIAL_PAGE')) {
            $this->line('  ✅ .env already has INERTIA_USE_SCRIPT_ELEMENT_FOR_INITIAL_PAGE');
            return;
        }

        File::append($envPath, "\nINERTIA_USE_SCRIPT_ELEMENT_FOR_INITIAL_PAGE=true\n");
        $this->line('  ✅ .env updated → <comment>INERTIA_USE_SCRIPT_ELEMENT_FOR_INITIAL_PAGE=true</comment>');
    }

    protected function patchAppCss(): void
    {
        $cssPath = resource_path('css/app.css');

        if (!File::exists($cssPath)) {
            $this->line('  ⚠️  <comment>resources/css/app.css</comment> not found — skipping CSS patch');
            return;
        }

        $content = File::get($cssPath);
        $changed = false;

        // Add dark mode variant if not already present
        if (!str_contains($content, '@custom-variant dark')) {
            $content = preg_replace(
                "/(@import\s+'tailwindcss';)/",
                "$1\n\n/* Enable Tailwind dark: variants when .dark is on <html> */\n@custom-variant dark (&:where(.dark, .dark *));",
                $content,
                1
            );
            $changed = true;
        }

        // Add vendor larafusion @source so Tailwind scans package component files
        if (!str_contains($content, 'vendor/larafusion')) {
            $content = preg_replace(
                "/(@source\s+'[^']*\*\*\/\*\.js';)/",
                "$1\n@source '../../vendor/larafusion/*/resources/js/**/*.{ts,tsx}';",
                $content,
                1
            );
            $changed = true;
        }

        // Add theme-transition styles for View Transitions API + Firefox fallback
        if (!str_contains($content, 'view-transition-old') && !str_contains($content, 'larafusion-theme-transition')) {
            $themeTransitionCss = <<<'CSS'

/*
 * View Transitions API: cross-fade the entire page on dark/light and colour-
 * theme switches. All pixels transition simultaneously — no per-element stagger.
 */
@media (prefers-reduced-motion: no-preference) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
        animation-duration: 250ms;
        animation-timing-function: ease;
    }
}

/* Firefox fallback — used when View Transitions are not available. */
.larafusion-theme-transition,
.larafusion-theme-transition *,
.larafusion-theme-transition *::before,
.larafusion-theme-transition *::after {
    transition:
        color            250ms ease,
        background-color 250ms ease,
        border-color     250ms ease,
        box-shadow       250ms ease,
        fill             250ms ease,
        stroke           250ms ease !important;
    transition-delay: 0ms !important;
}
CSS;
            $content .= $themeTransitionCss;
            $changed = true;
        }

        if ($changed) {
            File::put($cssPath, $content);
            $this->line('  ✅ app.css patched → <comment>@custom-variant dark</comment> + <comment>vendor larafusion @source</comment> + <comment>theme transitions</comment>');
        } else {
            $this->line('  ✅ app.css already configured');
        }
    }

    protected function installNpmPackages(): void
    {
        $packageJsonPath = base_path('package.json');

        if (!File::exists($packageJsonPath)) {
            $this->line('  ⚠️  package.json not found — skipping npm install');
            return;
        }

        $packageJson = json_decode(File::get($packageJsonPath), true);
        $allDeps     = array_merge(
            $packageJson['dependencies']    ?? [],
            $packageJson['devDependencies'] ?? [],
        );

        $required = [
            '@inertiajs/react',
            '@vitejs/plugin-react',
            'react',
            'react-dom',
            'lucide-react',
            'clsx',
        ];

        $requiredDev = [
            '@types/react',
            '@types/react-dom',
        ];

        $toInstall    = array_filter($required,    fn ($p) => !isset($allDeps[$p]));
        $toInstallDev = array_filter($requiredDev, fn ($p) => !isset($allDeps[$p]));

        if (empty($toInstall) && empty($toInstallDev)) {
            $this->line('  ✅ npm packages already installed');
            return;
        }

        $this->line('  📦 Installing npm packages...');

        if (!empty($toInstall)) {
            $cmd = 'npm install ' . implode(' ', $toInstall) . ' 2>&1';
            exec($cmd, $output, $code);
            if ($code !== 0) {
                $this->line('  ⚠️  npm install failed — run manually: <comment>npm install ' . implode(' ', $toInstall) . '</comment>');
            }
        }

        if (!empty($toInstallDev)) {
            $cmd = 'npm install --save-dev ' . implode(' ', $toInstallDev) . ' 2>&1';
            exec($cmd, $output, $code);
            if ($code !== 0) {
                $this->line('  ⚠️  npm install --save-dev failed — run manually: <comment>npm install --save-dev ' . implode(' ', $toInstallDev) . '</comment>');
            }
        }

        $this->line('  ✅ npm packages installed');
    }

}
