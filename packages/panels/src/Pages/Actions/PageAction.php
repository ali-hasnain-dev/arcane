<?php

namespace Larafusion\Pages\Actions;

/**
 * Base class for page-level header actions.
 *
 * Header actions appear in the breadcrumb/header area of resource pages,
 * e.g. the "New Post" button on list pages, or "Delete" on edit pages.
 *
 * Usage (in a page class):
 *   public static function getHeaderActions(): array
 *   {
 *       return [
 *           CreateAction::make(),
 *           DeleteAction::make()->label('Remove'),
 *       ];
 *   }
 */
abstract class PageAction
{
    protected ?string $label   = null;
    protected string  $color   = 'primary';
    protected ?string $icon    = null;
    protected ?string $confirm = null;

    public static function make(): static
    {
        return new static();
    }

    public function label(string $label): static
    {
        $this->label = $label;
        return $this;
    }

    public function color(string $color): static
    {
        $this->color = $color;
        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;
        return $this;
    }

    public function requiresConfirmation(string $message): static
    {
        $this->confirm = $message;
        return $this;
    }

    /**
     * Serialize to an array for Inertia props.
     *
     * @param  string      $resourceSlug  e.g. "posts"
     * @param  mixed       $record        The current record (for edit-page actions)
     * @param  string      $resourceClass Fully-qualified resource class name
     * @return array|null  null = skip this action (condition not met)
     */
    abstract public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array;
}
