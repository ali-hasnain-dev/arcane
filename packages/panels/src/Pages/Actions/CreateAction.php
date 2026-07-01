<?php

namespace Larafusion\Pages\Actions;

/**
 * Page header action that links to the resource's create page.
 *
 * Default for ListPage::getHeaderActions().
 */
class CreateAction extends PageAction
{
    protected string  $color = 'primary';
    // No default icon — add one explicitly with ->icon('plus') if desired.
    protected ?string $icon  = null;

    public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array
    {
        // Respect the resource's canCreate() guard
        if ($resourceClass && !$resourceClass::canCreate()) {
            return null;
        }

        return [
            'type'  => 'create',
            'label' => $this->label ?? ('New ' . ($resourceClass ? $resourceClass::getRecordLabel() : '')),
            'color' => $this->color,
            'icon'  => $this->icon,
            'href'  => "/admin/{$resourceSlug}/create",
        ];
    }
}
