<?php

namespace Larafusion\Schema;

use Illuminate\Support\ServiceProvider;

class SchemasServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Serializer::class, fn () => new Serializer());
    }

    public function boot(): void
    {
        //
    }
}
