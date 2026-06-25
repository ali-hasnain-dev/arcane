<?php

namespace Larafusion\Pages;

abstract class ShowPage
{
    protected static string $resource;

    public static function getResource(): string
    {
        return static::$resource;
    }

    /**
     * Header actions rendered in the breadcrumb area of the show/view page.
     *
     * Override to add actions such as EditAction, DeleteAction, etc.
     *
     * Example:
     *   use Larafusion\Pages\Actions\EditAction;
     *   use Larafusion\Pages\Actions\DeleteAction;
     *
     *   public static function getHeaderActions(): array
     *   {
     *       return [
     *           EditAction::make(),
     *           DeleteAction::make(),
     *       ];
     *   }
     */
    public static function getHeaderActions(): array
    {
        return [];
    }
}
