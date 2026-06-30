<?php

namespace Larafusion\Widgets;

use Illuminate\Support\ServiceProvider;

class WidgetsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../resources/js' => resource_path('js/vendor/larafusion/widgets'),
            ], 'larafusion-widgets-js');
        }
    }
}
