<?php

namespace Larafusion\Forms;

use Illuminate\Support\ServiceProvider;

class FormsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../resources/js' => resource_path('js/vendor/larafusion/forms'),
            ], 'larafusion-forms-js');
        }
    }
}
