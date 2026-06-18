<?php

namespace Arcane;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Arcane\Contracts\HasArcaneAvatar;
use Arcane\Contracts\HasArcaneName;
use Arcane\Console\InstallCommand;
use Arcane\Console\MakePanelCommand;
use Arcane\Console\MakeResourceCommand;
use Arcane\Console\MakePluginCommand;
use Arcane\Console\MakeWidgetCommand;
use Arcane\Console\MakeUserCommand;
use Arcane\Console\GenerateApiCommand;
use Arcane\Console\IdeHelpersCommand;
use Arcane\TwoFactor\TwoFactorManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class ArcaneServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/arcane.php', 'arcane');
        $this->app->singleton('arcane',         fn () => new ArcaneManager());
        $this->app->singleton('arcane.plugins', fn () => ArcaneManager::plugins());
        $this->app->singleton('arcane.theme',   fn () => ArcaneManager::theme());
        $this->app->singleton(TwoFactorManager::class, fn () => new TwoFactorManager());
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/arcane.php');

        // Named rate limiters — actual limits pulled from panel config at request-time
        RateLimiter::for('arcane-login', function ($request) {
            $panel    = ArcaneManager::getPanel();
            $max      = $panel?->getLoginMaxAttempts()  ?? 5;
            $decay    = $panel?->getLoginDecayMinutes() ?? 1;
            $enabled  = $panel?->hasLoginRateLimiting() ?? true;
            return $enabled
                ? Limit::perMinutes($decay, $max)->by($request->input('email') . '|' . $request->ip())
                : Limit::none();
        });

        RateLimiter::for('arcane-2fa', function ($request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Register API routes if panel has API enabled
        $this->app->booted(function () {
            $panel = ArcaneManager::getPanel();
            if ($panel && $panel->hasApi()) {
                $this->registerApiRoutes($panel);
            }
        });

        /*
         * Legacy config-based registration — only used when the application
         * has NOT registered a PanelProvider. The PanelProvider's register()
         * runs before boot() and calls ArcaneManager::registerPanel(), which
         * already handles resources/plugins. We skip the config fallback when
         * a panel is present to avoid double-registration.
         */
        if (ArcaneManager::getPanel() === null) {
            $resources = config('arcane.resources', []);
            if (!empty($resources)) {
                ArcaneManager::register($resources);
            }

            $plugins = config('arcane.plugins', []);
            if (!empty($plugins)) {
                ArcaneManager::plugins()->register($plugins);
            }
        }

        Inertia::share([
            'arcane' => fn () => [
                'navigation' => ArcaneManager::getNavigation(),
                'theme'      => ArcaneManager::theme()->toArray(),
                'plugins'    => ArcaneManager::plugins()->toArray(),
                'assets'     => ArcaneManager::plugins()->assets(),
                'panel'      => ArcaneManager::getPanel()?->toArray() ?? [],
            ],
            'auth' => fn () => [
                'user' => $this->resolveAuthUser(),
            ],
        ]);

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/arcane.php' => config_path('arcane.php'),
            ], 'arcane-config');

            $panelJs         = __DIR__ . '/../resources/js';
            $formsJs         = __DIR__ . '/../../forms/resources/js';
            $tablesJs        = __DIR__ . '/../../tables/resources/js';
            $widgetsJs       = __DIR__ . '/../../widgets/resources/js';
            $supportJs       = __DIR__ . '/../../support/resources/js';
            $notificationsJs = __DIR__ . '/../../notifications/resources/js';

            $publish = [
                "{$panelJs}/pages/Arcane" => resource_path('js/Pages/Arcane'),
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

            $this->publishes($publish, 'arcane-components');

            $this->publishes([
                __DIR__ . '/../stubs/example' => base_path('stubs/arcane'),
            ], 'arcane-stubs');

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
     * Respects the panel's auth guard and the HasArcaneAvatar / HasArcaneName contracts.
     */
    protected function resolveAuthUser(): ?array
    {
        $panel = ArcaneManager::getPanel();
        $guard = $panel ? $panel->getAuthGuard() : 'web';
        $user  = Auth::guard($guard)->user();

        if (!$user) return null;

        $name   = $user instanceof HasArcaneName  ? $user->getArcaneName()      : $user->name;
        $avatar = $user instanceof HasArcaneAvatar ? $user->getArcaneAvatarUrl() : null;

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
            ->name('arcane.api.')
            ->group(function () {
                Route::get   ('/{resource}',        [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'index'])  ->name('index');
                Route::post  ('/{resource}',        [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'store'])  ->name('store');
                Route::get   ('/{resource}/schema', [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'schema']) ->name('schema');
                Route::get   ('/{resource}/{id}',   [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'show'])   ->name('show');
                Route::put   ('/{resource}/{id}',   [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'update']) ->name('update');
                Route::patch ('/{resource}/{id}',   [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'update']) ->name('update.patch');
                Route::delete('/{resource}/{id}',   [\Arcane\Http\Controllers\Api\ResourceApiController::class, 'destroy'])->name('destroy');
            });
    }
}
