<?php

namespace Larafusion;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Larafusion\Contracts\HasLarafusionAvatar;
use Larafusion\Contracts\HasLarafusionName;
use Larafusion\Console\InstallCommand;
use Larafusion\Console\MakePanelCommand;
use Larafusion\Console\MakeResourceCommand;
use Larafusion\Console\MakePluginCommand;
use Larafusion\Console\MakeWidgetCommand;
use Larafusion\Console\MakeUserCommand;
use Larafusion\Console\GenerateApiCommand;
use Larafusion\Console\IdeHelpersCommand;
use Larafusion\TwoFactor\TwoFactorManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class LarafusionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/larafusion.php', 'larafusion');
        $this->app->singleton('larafusion',         fn () => new LarafusionManager());
        $this->app->singleton('larafusion.plugins', fn () => LarafusionManager::plugins());
        $this->app->singleton('larafusion.theme',   fn () => LarafusionManager::theme());
        $this->app->singleton(TwoFactorManager::class, fn () => new TwoFactorManager());
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/larafusion.php');

        // Named rate limiters — actual limits pulled from panel config at request-time
        RateLimiter::for('larafusion-login', function ($request) {
            $panel    = LarafusionManager::getPanel();
            $max      = $panel?->getLoginMaxAttempts()  ?? 5;
            $decay    = $panel?->getLoginDecayMinutes() ?? 1;
            $enabled  = $panel?->hasLoginRateLimiting() ?? true;
            return $enabled
                ? Limit::perMinutes($decay, $max)->by($request->input('email') . '|' . $request->ip())
                : Limit::none();
        });

        RateLimiter::for('larafusion-2fa', function ($request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Register API routes if panel has API enabled
        $this->app->booted(function () {
            $panel = LarafusionManager::getPanel();
            if ($panel && $panel->hasApi()) {
                $this->registerApiRoutes($panel);
            }
        });

        /*
         * Legacy config-based registration — only used when the application
         * has NOT registered a PanelProvider. The PanelProvider's register()
         * runs before boot() and calls LarafusionManager::registerPanel(), which
         * already handles resources/plugins. We skip the config fallback when
         * a panel is present to avoid double-registration.
         */
        if (LarafusionManager::getPanel() === null) {
            $resources = config('larafusion.resources', []);
            if (!empty($resources)) {
                LarafusionManager::register($resources);
            }

            $plugins = config('larafusion.plugins', []);
            if (!empty($plugins)) {
                LarafusionManager::plugins()->register($plugins);
            }
        }

        Inertia::share([
            'larafusion' => fn () => [
                'navigation' => LarafusionManager::getNavigation(),
                'theme'      => LarafusionManager::theme()->toArray(),
                'plugins'    => LarafusionManager::plugins()->toArray(),
                'assets'     => LarafusionManager::plugins()->assets(),
                'panel'      => LarafusionManager::getPanel()?->toArray() ?? [],
            ],
            'auth' => fn () => [
                'user' => $this->resolveAuthUser(),
            ],
        ]);

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/larafusion.php' => config_path('larafusion.php'),
            ], 'larafusion-config');

            $panelJs         = __DIR__ . '/../resources/js';
            $formsJs         = __DIR__ . '/../../forms/resources/js';
            $tablesJs        = __DIR__ . '/../../tables/resources/js';
            $widgetsJs       = __DIR__ . '/../../widgets/resources/js';
            $supportJs       = __DIR__ . '/../../support/resources/js';
            $notificationsJs = __DIR__ . '/../../notifications/resources/js';

            $publish = [
                "{$panelJs}/pages/Larafusion" => resource_path('js/Pages/Larafusion'),
                "{$panelJs}/components"   => resource_path('js/components'),
            ];

            if (is_dir($supportJs)) {
                $publish["{$supportJs}/components"] = resource_path('js/components/ui');
                $publish["{$supportJs}/lib"]        = resource_path('js/lib');
                $publish["{$supportJs}/types"]      = resource_path('js/types');
            }
            if (is_dir($formsJs)) {
                $publish["{$formsJs}/components/fields"] = resource_path('js/components/fields');
                $publish["{$formsJs}/components/form"]   = resource_path('js/components/form');
            }
            if (is_dir($tablesJs)) {
                $publish["{$tablesJs}/components"] = resource_path('js/components/table');
            }
            if (is_dir($widgetsJs)) {
                $publish["{$widgetsJs}/components"] = resource_path('js/components/widgets');
            }
            if (is_dir($notificationsJs)) {
                $publish["{$notificationsJs}/components"] = resource_path('js/components/ui');
            }

            $this->publishes($publish, 'larafusion-components');

            $this->publishes([
                __DIR__ . '/../stubs/example' => base_path('stubs/larafusion'),
            ], 'larafusion-stubs');

            $this->commands([
                InstallCommand::class,
                MakePanelCommand::class,
                MakeResourceCommand::class,
                MakePluginCommand::class,
                MakeWidgetCommand::class,
                MakeUserCommand::class,
                GenerateApiCommand::class,
                IdeHelpersCommand::class,
            ]);
        }
    }

    /**
     * Resolve the current user for Inertia's auth.user prop.
     * Respects the panel's auth guard and the HasLarafusionAvatar / HasLarafusionName contracts.
     */
    protected function resolveAuthUser(): ?array
    {
        $panel = LarafusionManager::getPanel();
        $guard = $panel ? $panel->getAuthGuard() : 'web';
        $user  = Auth::guard($guard)->user();

        if (!$user) return null;

        $name   = $user instanceof HasLarafusionName  ? $user->getLarafusionName()      : $user->name;
        $avatar = $user instanceof HasLarafusionAvatar ? $user->getLarafusionAvatarUrl() : null;

        return [
            'id'         => $user->getKey(),
            'name'       => $name,
            'email'      => $user->email ?? null,
            'avatar'     => $avatar,
            'twoFactor'  => !empty($user->two_factor_confirmed_at),
        ];
    }

    protected function registerApiRoutes(Panel $panel): void
    {
        Route::prefix($panel->getApiPrefix())
            ->middleware($panel->getApiMiddleware())
            ->name('larafusion.api.')
            ->group(function () {
                Route::get   ('/{resource}',        [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'index'])  ->name('index');
                Route::post  ('/{resource}',        [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'store'])  ->name('store');
                Route::get   ('/{resource}/schema', [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'schema']) ->name('schema');
                Route::get   ('/{resource}/{id}',   [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'show'])   ->name('show');
                Route::put   ('/{resource}/{id}',   [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'update']) ->name('update');
                Route::patch ('/{resource}/{id}',   [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'update']) ->name('update.patch');
                Route::delete('/{resource}/{id}',   [\Larafusion\Http\Controllers\Api\ResourceApiController::class, 'destroy'])->name('destroy');
            });
    }
}
