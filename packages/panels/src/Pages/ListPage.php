<?php

namespace Arcane\Pages;

use Arcane\Pages\Actions\CreateAction;

abstract class ListPage
{
    protected static string $resource;

    public static function getResource(): string
    {
        return static::$resource;
    }

    /**
     * Header actions rendered in the breadcrumb area above the table.
     *
     * Override to customise. Return [] to hide all buttons.
     *
     * Example — hide the create button:
     *   public static function getHeaderActions(): array { return []; }
     *
     * Example — keep create and add more:
     *   public static function getHeaderActions(): array
     *   {
     *       return [ CreateAction::make() ];
     *   }
     */
    public static function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
