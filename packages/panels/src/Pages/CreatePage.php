<?php

namespace Arcane\Pages;

abstract class CreatePage
{
    protected static string $resource;

    public static function getResource(): string
    {
        return static::$resource;
    }

    /**
     * Header actions rendered in the breadcrumb area of the create page.
     *
     * Empty by default — the create form itself is the primary action.
     * Override to add buttons (e.g. a link back to the list).
     */
    public static function getHeaderActions(): array
    {
        return [];
    }

    /** Called after a record is successfully created. */
    protected static function afterCreate(mixed $record): void {}
}
