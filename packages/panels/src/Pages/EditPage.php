<?php

namespace Larafusion\Pages;

use Larafusion\Pages\Actions\DeleteAction;

abstract class EditPage
{
    protected static string $resource;

    public static function getResource(): string
    {
        return static::$resource;
    }

    /**
     * Header actions rendered in the breadcrumb area of the edit page.
     *
     * Override to customise. Common additions: ForceDeleteAction, RestoreAction.
     *
     * Example:
     *   use Larafusion\Pages\Actions\DeleteAction;
     *   use Larafusion\Pages\Actions\ForceDeleteAction;
     *   use Larafusion\Pages\Actions\RestoreAction;
     *
     *   public static function getHeaderActions(): array
     *   {
     *       return [
     *           DeleteAction::make(),
     *           ForceDeleteAction::make(),
     *           RestoreAction::make(),
     *       ];
     *   }
     */
    public static function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    /** Called after a record is successfully updated. */
    protected static function afterSave(mixed $record): void {}
}
