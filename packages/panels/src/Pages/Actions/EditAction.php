<?php

namespace Larafusion\Pages\Actions;

/**
 * Page header action that links to the resource's edit page.
 *
 * Useful in ShowPage::getHeaderActions() to give the user a direct path
 * from the read-only view to the editable form.
 */
class EditAction extends PageAction
{
    protected string  $color = 'primary';
    protected ?string $icon  = 'pencil';

    public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array
    {
        if ($resourceClass && !$resourceClass::canEdit()) {
            return null;
        }

        $id = $record?->getKey();

        return [
            'type'  => 'edit',
            'label' => $this->label ?? 'Edit',
            'color' => $this->color,
            'icon'  => $this->icon,
            'href'  => $id !== null ? "/admin/{$resourceSlug}/{$id}/edit" : null,
        ];
    }
}
