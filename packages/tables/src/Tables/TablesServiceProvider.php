<?php

namespace Larafusion\Tables;

use Illuminate\Support\ServiceProvider;

class TablesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../resources/js' => resource_path('js/vendor/larafusion/tables'),
            ], 'larafusion-tables-js');
        }
    }
}
