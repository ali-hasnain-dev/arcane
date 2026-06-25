<?php

namespace Larafusion\Pages\Actions;

/**
 * Page header action that deletes the current record.
 *
 * Default for EditPage::getHeaderActions().
 * Renders as a danger button with a confirmation dialog.
 */
class DeleteAction extends PageAction
{
    protected string  $color = 'danger';
    protected ?string $icon  = 'trash';

    public function toArray(string $resourceSlug, mixed $record = null, string $resourceClass = ''): ?array
    {
        if ($resourceClass && !$resourceClass::canDelete()) {
            return null;
        }

        $id = $record?->getKey();

        return [
            'type'    => 'delete',
            'label'   => $this->label ?? 'Delete',
            'color'   => $this->color,
            'icon'    => $this->icon,
            'confirm' => $this->confirm ?? 'Are you sure you want to delete this record? This action cannot be undone.',
            'url'     => $id !== null ? "/admin/{$resourceSlug}/{$id}" : null,
            'method'  => 'delete',
        ];
    }
}
